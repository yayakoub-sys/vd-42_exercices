import { FlatList, StyleSheet, View } from 'react-native';
import { Button, Divider, List, Text } from 'react-native-paper';
import type { ScanHistoryEntry } from '../core/history';

interface Props {
  entries: ScanHistoryEntry[];
  onBack: () => void;
  onClear: () => void;
}

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

export function HistoryScreen({ entries, onBack, onClear }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Button mode="text" onPress={onBack} compact contentStyle={styles.backButtonContent}>
          ‹ Retour
        </Button>
        <Text variant="titleMedium">Historique</Text>
        <View style={styles.headerSpacer} />
      </View>

      {entries.length === 0 ? (
        <View style={styles.empty}>
          <Text variant="bodyMedium" style={styles.muted}>
            Aucun QR scanné pour l'instant.
          </Text>
        </View>
      ) : (
        <FlatList
          data={entries}
          keyExtractor={(item) => item.id}
          ItemSeparatorComponent={Divider}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <List.Item
              title={item.providerLabel}
              description={describe(item)}
              right={() => (
                <Text variant="bodySmall" style={styles.muted}>
                  {formatWhen(item.timestamp)}
                </Text>
              )}
            />
          )}
        />
      )}

      {entries.length > 0 && (
        <Button mode="text" onPress={onClear} textColor="#DC2626" style={styles.clearButton}>
          Effacer l'historique
        </Button>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingTop: 48,
    paddingBottom: 4,
  },
  backButtonContent: { paddingHorizontal: 4 },
  headerSpacer: { width: 60 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  muted: { color: '#6B7280' },
  list: { paddingBottom: 24 },
  clearButton: { marginBottom: 8 },
});
