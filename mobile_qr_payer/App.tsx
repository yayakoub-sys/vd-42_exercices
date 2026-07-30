import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { ScannerScreen } from './src/screens/ScannerScreen';
import { ResultScreen } from './src/screens/ResultScreen';
import type { ScannedQr } from './src/core/providers/types';

// L'appli s'ouvre directement sur le lecteur : c'est le but demandé
// ("je lance l'appli, ça lance le lecteur").
export default function App() {
  const [scanned, setScanned] = useState<ScannedQr | null>(null);

  return (
    <View style={styles.container}>
      {scanned ? (
        <ResultScreen qr={scanned} onRescan={() => setScanned(null)} />
      ) : (
        <ScannerScreen onScanned={(raw) => setScanned({ raw })} />
      )}
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
