import { useRouter } from 'expo-router';
import * as React from 'react';

import { ResultScreen } from '@/features/scanner/result-screen';
import { ScannerScreen } from '@/features/scanner/scanner-screen';
import { buildHistoryEntry } from '@/core/history';
import type { ScannedQr } from '@/core/providers/types';
import { addHistoryEntry } from '@/storage/appState';

export default function ScannerRoute() {
  const router = useRouter();
  const [scanned, setScanned] = React.useState<ScannedQr | null>(null);

  async function handleScanned(raw: string) {
    const qr: ScannedQr = { raw };
    await addHistoryEntry(buildHistoryEntry(qr));
    setScanned(qr);
  }

  if (scanned) {
    return <ResultScreen qr={scanned} onRescan={() => setScanned(null)} />;
  }

  return (
    <ScannerScreen
      onScanned={handleScanned}
      onOpenHistory={() => router.push('/history')}
    />
  );
}
