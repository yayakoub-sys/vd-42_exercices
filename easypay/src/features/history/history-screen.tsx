import * as React from 'react';

import {
  Button,
  EmptyList,
  FocusAwareStatusBar,
  List,
  Text,
  View,
} from '@/components/ui';
import type { ScanHistoryEntry } from '@/core/history';

function formatWhen(timestamp: number): string {
  return new Date(timestamp).toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function describe(entry: ScanHistoryEntry): string | undefined {
  const parts = [entry.merchantName, entry.amount].filter(Boolean);
  return parts.length ? parts.join(' · ') : undefined;
}

interface Props {
  entries: ScanHistoryEntry[];
  onClear: () => void;
}

export function HistoryScreen({ entries, onClear }: Props) {
  return (
    <View className="flex-1 bg-white pt-16 dark:bg-black">
      <FocusAwareStatusBar />
      <Text className="px-4 text-xl font-bold">Historique</Text>

      <List
        className="mt-4 flex-1 px-4"
        data={entries}
        keyExtractor={(item: ScanHistoryEntry) => item.id}
        ListEmptyComponent={<EmptyList isLoading={false} />}
        renderItem={({ item }: { item: ScanHistoryEntry }) => (
          <View className="mb-2 rounded-xl bg-neutral-100 p-3.5 dark:bg-neutral-800">
            <View className="flex-row justify-between">
              <Text className="text-base font-bold">{item.providerLabel}</Text>
              <Text className="text-xs text-neutral-500">{formatWhen(item.timestamp)}</Text>
            </View>
            {describe(item) && (
              <Text className="text-sm text-neutral-600 dark:text-neutral-300">
                {describe(item)}
              </Text>
            )}
          </View>
        )}
      />

      {entries.length > 0 && (
        <View className="px-4 pb-4">
          <Button label="Effacer l'historique" variant="ghost" onPress={onClear} />
        </View>
      )}
    </View>
  );
}
