import type { BarcodeScanningResult } from 'expo-camera';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as React from 'react';
import { StyleSheet } from 'react-native';

import { Button, FocusAwareStatusBar, Pressable, Text, View } from '@/components/ui';

interface Props {
  onScanned: (rawData: string) => void;
  onOpenHistory: () => void;
}

export function ScannerScreen({ onScanned, onOpenHistory }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  // Empêche de traiter 10 fois le même QR pendant la fraction de seconde
  // où la caméra continue de le voir après le premier scan.
  const alreadyHandled = React.useRef(false);

  if (!permission) {
    return <View className="flex-1 bg-black" />;
  }

  if (!permission.granted) {
    return (
      <View className="flex-1 items-center justify-center gap-4 bg-white p-6 dark:bg-black">
        <FocusAwareStatusBar />
        <Text className="text-center text-base">
          Pour scanner les QR codes de paiement, l'appli a besoin de la caméra.
        </Text>
        <Button label="Autoriser la caméra" onPress={requestPermission} />
      </View>
    );
  }

  function handleBarcodeScanned(result: BarcodeScanningResult) {
    if (alreadyHandled.current) return;
    alreadyHandled.current = true;
    onScanned(result.data);
  }

  return (
    <View className="flex-1 bg-black">
      <FocusAwareStatusBar />
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={handleBarcodeScanned}
      />
      <View className="flex-1 items-center justify-center" pointerEvents="box-none">
        <View
          className="rounded-2xl border-[3px] border-white"
          style={{ width: 260, height: 260 }}
          pointerEvents="none"
        />
        <View className="mt-6 rounded-lg bg-black/40 px-3 py-1.5" pointerEvents="none">
          <Text className="text-base text-white">Vise un QR code de paiement</Text>
        </View>
        <Pressable
          className="absolute right-5 top-14 rounded-full bg-black/45 px-4 py-2"
          onPress={onOpenHistory}
        >
          <Text className="text-sm font-semibold text-white">Historique</Text>
        </Pressable>
      </View>
    </View>
  );
}
