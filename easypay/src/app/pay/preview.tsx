import { useRouter } from 'expo-router';
import * as React from 'react';

import {
  Button,
  FocusAwareStatusBar,
  ScrollView,
  Text,
  View,
} from '@/components/ui';
import { formatEmvcoAmount, looksLikeEmvco, parseEmvcoPayment } from '@/core/emvco';
import { resolveProvider } from '@/core/providers/registry';
import type { ScannedQr } from '@/core/providers/types';
import { usePaymentDraftStore } from '@/core/wallet-engine/paymentDraftStore';

export default function PreviewScreen() {
  const router = useRouter();
  const qr = usePaymentDraftStore((s) => s.qr);
  const setQr = usePaymentDraftStore((s) => s.setQr);
  const setAmount = usePaymentDraftStore((s) => s.setAmount);

  React.useEffect(() => {
    if (!qr) {
      router.replace('/(app)');
      return;
    }
    if (!qr.emvco && looksLikeEmvco(qr.raw)) {
      const enriched: ScannedQr = { ...qr, emvco: parseEmvcoPayment(qr.raw) };
      setQr(enriched);
      return;
    }
    if (!resolveProvider(qr)) {
      router.replace('/pay/unrecognized');
    }
  }, [qr, setQr, router]);

  const provider = qr ? resolveProvider(qr) : undefined;

  if (!qr || !provider) {
    return (
      <View className="flex-1 bg-white p-6 dark:bg-black">
        <FocusAwareStatusBar />
      </View>
    );
  }

  const amountLabel = formatEmvcoAmount(qr.emvco?.amount, qr.emvco?.currency);

  function handleContinue() {
    // Quand le QR porte déjà son montant, on saute l'écran de saisie — mais il
    // faut alors recopier ce montant dans le panier ici, car c'est l'écran de
    // saisie qui s'en chargeait. Sans ça, le récapitulatif attend un montant qui
    // n'arrive jamais et reste bloqué à charger : le paiement est impossible.
    const qrAmount = Number(qr?.emvco?.amount);
    if (Number.isFinite(qrAmount) && qrAmount > 0) {
      setAmount(qrAmount);
      router.push('/pay/choose-source');
    } else {
      router.push('/pay/amount');
    }
  }

  return (
    <View className="flex-1 bg-white p-6 dark:bg-black">
      <FocusAwareStatusBar />
      <ScrollView className="flex-1" contentContainerClassName="flex-grow items-center justify-center gap-4">
        <View
          className="rounded-full px-4 py-2"
          style={{ backgroundColor: provider.color }}
        >
          <Text className="text-base font-semibold text-white">{provider.label}</Text>
        </View>
        {qr.emvco?.merchantName && (
          <Text className="text-center text-xl font-semibold">{qr.emvco.merchantName}</Text>
        )}
        {amountLabel
          ? (
              <Text className="text-center text-3xl font-bold">{amountLabel}</Text>
            )
          : (
              <Text className="text-center text-base text-gray-600 dark:text-neutral-400">
                Ce QR ne contient pas de montant, tu vas le saisir toi-même.
              </Text>
            )}
      </ScrollView>
      <View className="mt-auto w-full">
        <Button
          label="Continuer"
          onPress={handleContinue}
          testID="preview-continue-button"
        />
      </View>
    </View>
  );
}
