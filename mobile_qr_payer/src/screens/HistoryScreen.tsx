import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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

export function HistoryScreen({ entries, onBack, onClear }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.backLink}>‹ Retour</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Historique</Text>
        <View style={{ width: 60 }} />
      </View>

      {entries.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Aucun QR scanné pour l'instant.</Text>
        </View>
      ) : (
        <FlatList
          data={entries}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <View style={styles.rowTop}>
                <Text style={styles.provider}>{item.providerLabel}</Text>
                <Text style={styles.when}>{formatWhen(item.timestamp)}</Text>
              </View>
              {item.merchantName && <Text style={styles.merchant}>{item.merchantName}</Text>}
              {item.amount && <Text style={styles.amount}>{item.amount}</Text>}
            </View>
          )}
        />
      )}

      {entries.length > 0 && (
        <TouchableOpacity style={styles.clearButton} onPress={onClear}>
          <Text style={styles.clearButtonText}>Effacer l'historique</Text>
        </TouchableOpacity>
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
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 12,
  },
  backLink: { fontSize: 16, color: '#111827', width: 60 },
  title: { fontSize: 17, fontWeight: '700' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: '#6B7280', fontSize: 15 },
  list: { paddingHorizontal: 16, paddingBottom: 24, gap: 10 },
  row: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 14,
    gap: 4,
  },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between' },
  provider: { fontWeight: '700', fontSize: 15 },
  when: { color: '#6B7280', fontSize: 13 },
  merchant: { fontSize: 14, color: '#374151' },
  amount: { fontSize: 15, fontWeight: '600' },
  clearButton: { paddingVertical: 14, alignItems: 'center' },
  clearButtonText: { color: '#DC2626', fontSize: 15 },
});
