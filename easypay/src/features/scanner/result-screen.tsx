import * as React from 'react';
import { Alert, Linking, Platform } from 'react-native';

import { ActivityIndicator, Button, Pressable, Text, View } from '@/components/ui';
import { formatEmvcoAmount } from '@/core/emvco';
import { resolveProvider } from '@/core/providers/registry';
import type { ScannedQr } from '@/core/providers/types';

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
    }
    catch {
      // On essaie simplement le lien suivant.
    }
  }
  return false;
}

export function ResultScreen({ qr, onRescan }: Props) {
  const [opening, setOpening] = React.useState(false);
  const provider = React.useMemo(() => resolveProvider(qr), [qr]);
  const amount = qr.emvco ? formatEmvcoAmount(qr.emvco.amount, qr.emvco.currency) : undefined;
  const merchantName = qr.emvco?.merchantName;

  if (!provider) {
    return (
      <View className="flex-1 justify-center gap-4 bg-white p-6 dark:bg-black">
        <Text className="text-center text-2xl font-bold">QR non reconnu</Text>
        <Text className="text-center text-base text-neutral-600 dark:text-neutral-300">
          Je ne reconnais pas ce type de QR. Voici son contenu, tel que lu :
        </Text>
        <View className="rounded-lg bg-neutral-100 p-3 dark:bg-neutral-800">
          <Text selectable className="font-mono text-xs">
            {qr.raw}
          </Text>
        </View>
        <Button label="Scanner à nouveau" onPress={onRescan} />
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
      }
      else {
        Alert.alert(
          "Impossible d'ouvrir automatiquement",
          `Ouvre toi-même l'appli ${providerLabel} pour terminer le paiement.`,
        );
      }
    }
    setOpening(false);
  }

  return (
    <View className="flex-1 justify-center gap-4 bg-white p-6 dark:bg-black">
      <View
        className="items-center gap-3 rounded-2xl border border-neutral-200 p-5 dark:border-neutral-700"
        style={{ borderTopWidth: 6, borderTopColor: provider.color }}
      >
        <View className="rounded-full px-3 py-1.5" style={{ backgroundColor: provider.color }}>
          <Text className="text-sm font-bold text-white">{provider.label}</Text>
        </View>
        {merchantName && <Text className="text-lg font-semibold">{merchantName}</Text>}
        {amount && <Text className="text-2xl font-bold">{amount}</Text>}

        {action.type === 'deeplink'
          ? (
              action.confidence === 'best_effort' && (
                <Text className="text-center text-sm text-warning-800 dark:text-warning-400">
                  ⚠️ L'ouverture automatique n'est pas encore garantie pour
                  {' '}
                  {provider.label}
                  . Si rien ne s'ouvre, lance
                  {' '}
                  {provider.label}
                  {' '}
                  toi-même.
                </Text>
              )
            )
          : (
              <Text className="text-center text-base text-neutral-600 dark:text-neutral-300">
                {action.reason}
              </Text>
            )}
      </View>

      {action.type === 'deeplink' && (
        <Pressable
          className="h-12 items-center justify-center rounded-md"
          style={{ backgroundColor: provider.color }}
          onPress={handleOpenPress}
          disabled={opening}
        >
          {opening
            ? (
                <ActivityIndicator color="white" />
              )
            : (
                <Text className="text-base font-semibold text-white">
                  {`Ouvrir ${provider.label}`}
                </Text>
              )}
        </Pressable>
      )}

      <Button label="Scanner à nouveau" variant="outline" onPress={onRescan} />
    </View>
  );
}
