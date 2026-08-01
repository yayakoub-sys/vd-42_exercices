import { useRouter } from 'expo-router';
import * as React from 'react';

import {
  Button,
  FocusAwareStatusBar,
  ScrollView,
  Text,
  View,
} from '@/components/ui';
import { formatEmvcoAmount } from '@/core/emvco';
import { resolveProvider } from '@/core/providers/registry';
import { getOperator } from '@/core/wallet-engine/operators';
import { usePaymentDraftStore } from '@/core/wallet-engine/paymentDraftStore';
import type { PaymentTransaction } from '@/core/wallet-engine/types';
import { addTransaction } from '@/storage/transactionsState';

export default function SuccessScreen() {
  const router = useRouter();
  const reset = usePaymentDraftStore((s) => s.reset);
  // Photo instantanée du panier au montage : `reset()` va vider le store juste
  // après, il ne faut donc plus lire le store en direct pour afficher le reçu.
  const [snapshot] = React.useState(() => usePaymentDraftStore.getState());
  const { qr, amountFcfa, sourceWallet, commission } = snapshot;

  React.useEffect(() => {
    if (qr && amountFcfa !== undefined && sourceWallet) {
      const operator = getOperator(sourceWallet.operator);
      const provider = resolveProvider(qr);
      const transaction: PaymentTransaction = {
        id: String(Date.now()),
        timestamp: Date.now(),
        merchantQrRaw: qr.raw,
        merchantProviderLabel: provider?.label ?? 'Opérateur inconnu',
        merchantName: qr.emvco?.merchantName,
        amount: amountFcfa,
        currency: qr.emvco?.currency ?? '952',
        sourceWalletId: sourceWallet.id,
        sourceOperator: sourceWallet.operator,
        sourceOperatorLabel: operator.label,
        commission: commission ?? 0,
        status: 'success',
      };
      addTransaction(transaction);
    }
    reset();
    // Ne doit tourner qu'une fois, au montage.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const amountLabel = amountFcfa !== undefined
    ? (formatEmvcoAmount(String(amountFcfa), '952') ?? `${amountFcfa} FCFA`)
    : '';
  const dateLabel = new Date().toLocaleString('fr-FR');

  return (
    <View className="flex-1 bg-white p-6 dark:bg-black">
      <FocusAwareStatusBar />
      <ScrollView className="flex-1" contentContainerClassName="flex-grow justify-center gap-4">
        <Text className="text-center text-2xl font-bold text-success-600">
          Paiement réussi ✓
        </Text>
        <View className="gap-3 rounded-xl border border-neutral-300 p-4 dark:border-neutral-700">
          <View className="flex-row justify-between">
            <Text className="text-gray-600 dark:text-neutral-400">Montant</Text>
            <Text className="font-semibold">{amountLabel}</Text>
          </View>
          {qr?.emvco?.merchantName && (
            <View className="flex-row justify-between">
              <Text className="text-gray-600 dark:text-neutral-400">Commerçant</Text>
              <Text className="font-semibold">{qr.emvco.merchantName}</Text>
            </View>
          )}
          {sourceWallet && (
            <View className="flex-row justify-between">
              <Text className="text-gray-600 dark:text-neutral-400">Depuis</Text>
              <Text className="font-semibold">{getOperator(sourceWallet.operator).label}</Text>
            </View>
          )}
          <View className="flex-row justify-between">
            <Text className="text-gray-600 dark:text-neutral-400">Frais EasyPay</Text>
            <Text className="font-semibold">{commission ?? 0} FCFA</Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-gray-600 dark:text-neutral-400">Date</Text>
            <Text className="font-semibold">{dateLabel}</Text>
          </View>
        </View>
      </ScrollView>
      <View className="mt-auto w-full">
        <Button
          label="Terminer"
          onPress={() => router.replace('/(app)')}
          testID="success-finish-button"
        />
      </View>
    </View>
  );
}
