import { useRouter } from 'expo-router';
import * as React from 'react';

import {
  ActivityIndicator,
  Button,
  FocusAwareStatusBar,
  ScrollView,
  Text,
  View,
} from '@/components/ui';
import { formatEmvcoAmount } from '@/core/emvco';
import { getOperator } from '@/core/wallet-engine/operators';
import { usePaymentDraftStore } from '@/core/wallet-engine/paymentDraftStore';

export default function RecapScreen() {
  const router = useRouter();
  const qr = usePaymentDraftStore((s) => s.qr);
  const amountFcfa = usePaymentDraftStore((s) => s.amountFcfa);
  const sourceWallet = usePaymentDraftStore((s) => s.sourceWallet);
  const commission = usePaymentDraftStore((s) => s.commission);

  if (amountFcfa === undefined || !sourceWallet) {
    return (
      <View className="flex-1 items-center justify-center bg-white p-6 dark:bg-black">
        <FocusAwareStatusBar />
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const operator = getOperator(sourceWallet.operator);
  const commissionFcfa = commission ?? 0;
  const totalFcfa = amountFcfa + commissionFcfa;
  const amountLabel = formatEmvcoAmount(String(amountFcfa), '952') ?? `${amountFcfa} FCFA`;
  const commissionLabel = formatEmvcoAmount(String(commissionFcfa), '952') ?? `${commissionFcfa} FCFA`;
  const totalLabel = formatEmvcoAmount(String(totalFcfa), '952') ?? `${totalFcfa} FCFA`;
  const target = qr?.emvco?.merchantName ?? 'ce QR scanné';

  return (
    <View className="flex-1 bg-white p-6 dark:bg-black">
      <FocusAwareStatusBar />
      <ScrollView className="flex-1" contentContainerClassName="flex-grow justify-center gap-4">
        <Text className="text-center text-xl font-bold">
          Tu payes
          {' '}
          {amountLabel}
          {' '}
          à
          {' '}
          {target}
        </Text>
        <View className="gap-3 rounded-xl border border-neutral-300 p-4 dark:border-neutral-700">
          <View className="flex-row justify-between">
            <Text className="text-gray-600 dark:text-neutral-400">Depuis</Text>
            <Text className="font-semibold">{operator.label}</Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-gray-600 dark:text-neutral-400">Frais EasyPay</Text>
            <Text className="font-semibold">{commissionLabel}</Text>
          </View>
          <View className="mt-2 flex-row justify-between border-t border-neutral-300 pt-2 dark:border-neutral-700">
            <Text className="text-base font-bold">Total débité</Text>
            <Text className="text-base font-bold">{totalLabel}</Text>
          </View>
        </View>
      </ScrollView>
      <View className="mt-auto w-full">
        <Button
          label="Confirmer le paiement"
          onPress={() => router.push('/pay/redirect')}
          testID="recap-confirm-button"
        />
      </View>
    </View>
  );
}
