import { useFocusEffect } from '@react-navigation/native';
import * as React from 'react';

import type { ScanHistoryEntry } from '@/core/history';
import { HistoryScreen } from '@/features/history/history-screen';
import { clearHistory, getHistory } from '@/storage/appState';

export default function HistoryRoute() {
  const [entries, setEntries] = React.useState<ScanHistoryEntry[]>([]);

  useFocusEffect(
    React.useCallback(() => {
      getHistory().then(setEntries);
    }, []),
  );

  async function handleClear() {
    await clearHistory();
    setEntries([]);
  }

  return <HistoryScreen entries={entries} onClear={handleClear} />;
}
