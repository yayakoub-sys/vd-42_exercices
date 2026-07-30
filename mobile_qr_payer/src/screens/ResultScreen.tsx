import { useMemo, useState } from 'react';
import { Alert, Linking, Platform, StyleSheet, View } from 'react-native';
import { Button, Card, Chip, HelperText, Text } from 'react-native-paper';
import { formatEmvcoAmount } from '../core/emvco';
import { resolveProvider } from '../core/providers/registry';
import type { ScannedQr } from '../core/providers/types';

interface Props {
  qr: ScannedQr;
  onRescan: () => void;
}

/** Essaie une liste de liens dans l'ordre, s'arrête au premier qui s'ouvre. */
async function openFirstWorkingUrl(urls: string[]): Promise<boolean> {
  for (const url of urls) {
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
        return true;
      }
    } catch {
      // On essaie simplement le lien suivant.
    }
  }
  return false;
}

export function ResultScreen({ qr, onRescan }: Props) {
  const [opening, setOpening] = useState(false);
  const provider = useMemo(() => resolveProvider(qr), [qr]);
  const amount = qr.emvco ? formatEmvcoAmount(qr.emvco.amount, qr.emvco.currency) : undefined;
  const merchantName = qr.emvco?.merchantName;

  if (!provider) {
    return (
      <View style={styles.container}>
        <Card style={styles.card}>
          <Card.Content style={styles.cardContent}>
            <Text variant="headlineSmall" style={styles.centerText}>
              QR non reconnu
            </Text>
            <Text variant="bodyMedium" style={[styles.centerText, styles.muted]}>
              Je ne reconnais pas ce type de QR. Voici son contenu, tel que lu :
            </Text>
            <View style={styles.rawBox}>
              <Text selectable style={styles.rawText}>
                {qr.raw}
              </Text>
            </View>
          </Card.Content>
        </Card>
        <Button mode="contained" onPress={onRescan} style={styles.spacedButton}>
          Scanner à nouveau
        </Button>
      </View>
    );
  }

  const action = provider.getAction(qr);
  const providerLabel = provider.label;

  async function handleOpenPress() {
    if (action.type !== 'deeplink') return;
    setOpening(true);
    const opened = await openFirstWorkingUrl([action.url, ...(action.fallbackUrls ?? [])]);
    if (!opened) {
      const storeUrl = Platform.OS === 'ios' ? action.storeFallback?.ios : action.storeFallback?.android;
      if (storeUrl) {
        await Linking.openURL(storeUrl);
      } else {
        Alert.alert(
          "Impossible d'ouvrir automatiquement",
          `Ouvre toi-même l'appli ${providerLabel} pour terminer le paiement.`,
        );
      }
    }
    setOpening(false);
  }

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Content style={styles.cardContent}>
          <View style={styles.pillRow}>
            <Chip style={{ backgroundColor: provider.color }} textStyle={styles.pillText}>
              {provider.label}
            </Chip>
            {action.type === 'deeplink' && (
              <Chip
                compact
                mode="outlined"
                style={action.confidence === 'confirmed' ? styles.confirmedChip : styles.bestEffortChip}
              >
                {action.confidence === 'confirmed' ? 'Confirmé' : 'Best effort'}
              </Chip>
            )}
          </View>

          {merchantName && (
            <Text variant="titleMedium" style={styles.centerText}>
              {merchantName}
            </Text>
          )}
          {amount && (
            <Text variant="headlineSmall" style={styles.centerText}>
              {amount}
            </Text>
          )}

          {action.type === 'deeplink' ? (
            action.confidence === 'best_effort' && (
              <HelperText type="info" visible style={styles.centerText}>
                ⚠️ L'ouverture automatique n'est pas encore garantie pour {provider.label} sur
                tous les téléphones. Si rien ne s'ouvre, lance {provider.label} toi-même.
              </HelperText>
            )
          ) : (
            <Text variant="bodyMedium" style={[styles.centerText, styles.muted]}>
              {action.reason}
            </Text>
          )}
        </Card.Content>
      </Card>

      {action.type === 'deeplink' && (
        <Button
          mode="contained"
          onPress={handleOpenPress}
          loading={opening}
          disabled={opening}
          style={styles.spacedButton}
          buttonColor={provider.color}
        >
          {opening ? 'Ouverture…' : `Ouvrir ${provider.label}`}
        </Button>
      )}

      <Button mode="text" onPress={onRescan}>
        Scanner à nouveau
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    gap: 14,
    backgroundColor: 'white',
  },
  card: { borderRadius: 16 },
  cardContent: { gap: 10, paddingVertical: 8 },
  pillRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, flexWrap: 'wrap' },
  pillText: { color: 'white', fontWeight: '700' },
  confirmedChip: { backgroundColor: '#DCFCE7' },
  bestEffortChip: { backgroundColor: '#FEF3C7' },
  centerText: { textAlign: 'center' },
  muted: { color: '#6B7280' },
  rawBox: { backgroundColor: '#F3F4F6', borderRadius: 8, padding: 12 },
  rawText: { fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace' }), fontSize: 12 },
  spacedButton: { marginTop: 4 },
});
