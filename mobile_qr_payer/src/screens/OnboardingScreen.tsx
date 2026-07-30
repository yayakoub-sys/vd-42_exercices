import { StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';

interface Props {
  onDone: () => void;
}

/** Écran affiché une seule fois, au tout premier lancement. */
export function OnboardingScreen({ onDone }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.body}>
        <Text variant="displaySmall" style={styles.glyph}>
          ◱
        </Text>
        <Text variant="headlineMedium" style={styles.title}>
          Un seul geste pour payer
        </Text>
        <Text variant="bodyLarge" style={styles.paragraph}>
          Vise n'importe quel QR de paiement (Wave, Orange Money...). L'appli reconnaît
          tout de suite à qui il appartient et ouvre directement la bonne appli pour toi.
        </Text>
        <Text variant="bodyLarge" style={styles.paragraph}>
          Tu n'as plus besoin de chercher quelle appli ouvrir : tu scannes, elle s'ouvre.
        </Text>
      </View>
      <Button mode="contained" onPress={onDone} contentStyle={styles.buttonContent}>
        Commencer
      </Button>
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
  glyph: { color: '#2A1B54' },
  title: { textAlign: 'center', fontWeight: '700' },
  paragraph: { textAlign: 'center', color: '#374151' },
  buttonContent: { paddingVertical: 6 },
});
