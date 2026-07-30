import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface Props {
  onDone: () => void;
}

/** Écran affiché une seule fois, au tout premier lancement. */
export function OnboardingScreen({ onDone }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.body}>
        <Text style={styles.emoji}>◱</Text>
        <Text style={styles.title}>Un seul geste pour payer</Text>
        <Text style={styles.paragraph}>
          Vise n'importe quel QR de paiement (Wave, Orange Money...). L'appli reconnaît
          tout de suite à qui il appartient et ouvre directement la bonne appli pour toi.
        </Text>
        <Text style={styles.paragraph}>
          Tu n'as plus besoin de chercher quelle appli ouvrir : tu scannes, elle s'ouvre.
        </Text>
      </View>
      <TouchableOpacity style={styles.primaryButton} onPress={onDone}>
        <Text style={styles.primaryButtonText}>Commencer</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    padding: 24,
    justifyContent: 'space-between',
  },
  body: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  emoji: { fontSize: 48, color: '#111827' },
  title: { fontSize: 26, fontWeight: '700', textAlign: 'center' },
  paragraph: { fontSize: 16, textAlign: 'center', color: '#374151', lineHeight: 22 },
  primaryButton: {
    backgroundColor: '#111827',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: { color: 'white', fontSize: 17, fontWeight: '600' },
});
