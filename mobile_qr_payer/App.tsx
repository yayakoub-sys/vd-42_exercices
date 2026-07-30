import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { ScannerScreen } from './src/screens/ScannerScreen';
import { ResultScreen } from './src/screens/ResultScreen';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { HistoryScreen } from './src/screens/HistoryScreen';
import type { ScannedQr } from './src/core/providers/types';
import type { ScanHistoryEntry } from './src/core/history';
import { buildHistoryEntry } from './src/core/history';
import { addHistoryEntry, clearHistory, getHistory, hasSeenOnboarding, markOnboardingSeen } from './src/storage/appState';

type View_ = 'loading' | 'onboarding' | 'scanner' | 'result' | 'history';

// L'appli s'ouvre directement sur le lecteur (après le premier accueil) :
// c'est le but demandé ("je lance l'appli, ça lance le lecteur").
export default function App() {
  const [view, setView] = useState<View_>('loading');
  const [scanned, setScanned] = useState<ScannedQr | null>(null);
  const [history, setHistory] = useState<ScanHistoryEntry[]>([]);

  useEffect(() => {
    (async () => {
      const [seenOnboarding, storedHistory] = await Promise.all([hasSeenOnboarding(), getHistory()]);
      setHistory(storedHistory);
      setView(seenOnboarding ? 'scanner' : 'onboarding');
    })();
  }, []);

  async function handleOnboardingDone() {
    await markOnboardingSeen();
    setView('scanner');
  }

  async function handleScanned(raw: string) {
    const qr: ScannedQr = { raw };
    const updated = await addHistoryEntry(buildHistoryEntry(qr));
    setHistory(updated);
    setScanned(qr);
    setView('result');
  }

  async function handleClearHistory() {
    await clearHistory();
    setHistory([]);
  }

  return (
    <View style={styles.container}>
      {view === 'onboarding' && <OnboardingScreen onDone={handleOnboardingDone} />}
      {view === 'scanner' && (
        <ScannerScreen onScanned={handleScanned} onOpenHistory={() => setView('history')} />
      )}
      {view === 'result' && scanned && (
        <ResultScreen qr={scanned} onRescan={() => setView('scanner')} />
      )}
      {view === 'history' && (
        <HistoryScreen entries={history} onBack={() => setView('scanner')} onClear={handleClearHistory} />
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
