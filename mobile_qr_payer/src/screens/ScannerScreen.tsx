import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRef } from 'react';
import { Button, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { BarcodeScanningResult } from 'expo-camera';

interface Props {
  onScanned: (rawData: string) => void;
  onOpenHistory: () => void;
}

export function ScannerScreen({ onScanned, onOpenHistory }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  // Empêche de traiter 10 fois le même QR pendant la fraction de seconde
  // où la caméra continue de le voir après le premier scan.
  const alreadyHandled = useRef(false);

  if (!permission) {
    return <View style={styles.center} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.message}>
          Pour scanner les QR codes de paiement, l'appli a besoin de la caméra.
        </Text>
        <Button title="Autoriser la caméra" onPress={requestPermission} />
      </View>
    );
  }

  function handleBarcodeScanned(result: BarcodeScanningResult) {
    if (alreadyHandled.current) return;
    alreadyHandled.current = true;
    onScanned(result.data);
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={handleBarcodeScanned}
      />
      <View style={styles.overlay} pointerEvents="box-none">
        <View style={styles.frame} pointerEvents="none" />
        <Text style={styles.hint} pointerEvents="none">
          Vise un QR code de paiement
        </Text>
        <TouchableOpacity style={styles.historyButton} onPress={onOpenHistory}>
          <Text style={styles.historyButtonText}>Historique</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black' },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 16,
  },
  message: { textAlign: 'center', fontSize: 16 },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  frame: {
    width: 260,
    height: 260,
    borderWidth: 3,
    borderColor: 'white',
    borderRadius: 16,
  },
  hint: {
    marginTop: 24,
    color: 'white',
    fontSize: 16,
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  historyButton: {
    position: 'absolute',
    top: 56,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  historyButtonText: { color: 'white', fontSize: 14, fontWeight: '600' },
});
