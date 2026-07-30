import { useMemo, useState } from 'react';
import { Alert, Linking, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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
        <Text style={styles.title}>QR non reconnu</Text>
        <Text style={styles.body}>
          Je ne reconnais pas ce type de QR. Voici son contenu, tel que lu :
        </Text>
        <View style={styles.rawBox}>
          <Text selectable style={styles.rawText}>
            {qr.raw}
          </Text>
        </View>
        <TouchableOpacity style={styles.primaryButton} onPress={onRescan}>
          <Text style={styles.primaryButtonText}>Scanner à nouveau</Text>
        </TouchableOpacity>
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
          'Impossible d\'ouvrir automatiquement',
          `Ouvre toi-même l'appli ${providerLabel} pour terminer le paiement.`,
        );
      }
    }
    setOpening(false);
  }

  return (
    <View style={[styles.container, { borderTopColor: provider.color, borderTopWidth: 8 }]}>
      <Text style={[styles.title, { color: provider.color }]}>{provider.label}</Text>
      {merchantName && <Text style={styles.merchant}>{merchantName}</Text>}
      {amount && <Text style={styles.amount}>{amount}</Text>}

      {action.type === 'deeplink' ? (
        <>
          {action.confidence === 'best_effort' && (
            <Text style={styles.warning}>
              ⚠️ L'ouverture automatique n'est pas encore garantie pour {provider.label} sur tous
              les téléphones. Si rien ne s'ouvre, lance {provider.label} toi-même.
            </Text>
          )}
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: provider.color }]}
            onPress={handleOpenPress}
            disabled={opening}
          >
            <Text style={styles.primaryButtonText}>
              {opening ? 'Ouverture…' : `Ouvrir ${provider.label}`}
            </Text>
          </TouchableOpacity>
        </>
      ) : (
        <Text style={styles.body}>{action.reason}</Text>
      )}

      <TouchableOpacity style={styles.secondaryButton} onPress={onRescan}>
        <Text style={styles.secondaryButtonText}>Scanner à nouveau</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    gap: 12,
    backgroundColor: 'white',
  },
  title: { fontSize: 28, fontWeight: '700', textAlign: 'center' },
  merchant: { fontSize: 18, textAlign: 'center', color: '#374151' },
  amount: { fontSize: 22, fontWeight: '600', textAlign: 'center' },
  body: { fontSize: 15, textAlign: 'center', color: '#374151' },
  warning: { fontSize: 13, textAlign: 'center', color: '#92400E' },
  rawBox: { backgroundColor: '#F3F4F6', borderRadius: 8, padding: 12 },
  rawText: { fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace' }), fontSize: 12 },
  primaryButton: {
    backgroundColor: '#111827',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  primaryButtonText: { color: 'white', fontSize: 17, fontWeight: '600' },
  secondaryButton: { paddingVertical: 14, alignItems: 'center' },
  secondaryButtonText: { color: '#6B7280', fontSize: 15 },
});
