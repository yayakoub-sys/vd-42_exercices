import { useRouter } from 'expo-router';
import * as React from 'react';

import {
  ActivityIndicator,
  Button,
  FocusAwareStatusBar,
  Pressable,
  ScrollView,
  Text,
  View,
} from '@/components/ui';
import { computeCommission } from '@/core/wallet-engine/mockBackend';
import { getOperator } from '@/core/wallet-engine/operators';
import { usePaymentDraftStore } from '@/core/wallet-engine/paymentDraftStore';
import type { LinkedWallet } from '@/core/wallet-engine/types';
import { getWallets } from '@/storage/walletsState';

function maskPhoneNumber(phoneNumber: string): string {
  const digits = phoneNumber.replace(/\D/g, '');
  if (digits.length <= 4) return phoneNumber;
  return `${'•'.repeat(digits.length - 4)}${digits.slice(-4)}`;
}

export default function ChooseSourceScreen() {
  const router = useRouter();
  const amountFcfa = usePaymentDraftStore((s) => s.amountFcfa);
  const setSourceWallet = usePaymentDraftStore((s) => s.setSourceWallet);
  const setCommission = usePaymentDraftStore((s) => s.setCommission);
  const [wallets, setWallets] = React.useState<LinkedWallet[] | undefined>();

  React.useEffect(() => {
    getWallets().then(setWallets);
  }, []);

  function handleSelect(wallet: LinkedWallet) {
    setSourceWallet(wallet);
    setCommission(computeCommission(amountFcfa ?? 0));
    router.push('/pay/recap');
  }

  if (!wallets) {
    return (
      <View className="flex-1 items-center justify-center bg-white p-6 dark:bg-black">
        <FocusAwareStatusBar />
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (wallets.length === 0) {
    return (
      <View className="flex-1 items-center justify-center gap-4 bg-white p-6 dark:bg-black">
        <FocusAwareStatusBar />
        <Text className="text-center text-base text-gray-600 dark:text-neutral-400">
          Tu n'as encore aucun portefeuille lié — ajoute-en un pour pouvoir payer.
        </Text>
        <Button
          label="Ajouter un portefeuille"
          onPress={() => router.push('/(app)/wallets/add')}
          testID="choose-source-add-wallet-button"
        />
      </View>
    );
  }

  const sorted = [...wallets].sort((a, b) => Number(b.isDefault) - Number(a.isDefault));

  return (
    <View className="flex-1 bg-white p-6 dark:bg-black">
      <FocusAwareStatusBar />
      <Text className="mb-4 text-base text-gray-600 dark:text-neutral-400">
        Choisis avec quel portefeuille tu payes.
      </Text>
      <ScrollView className="flex-1" contentContainerClassName="gap-3">
        {sorted.map((wallet) => {
          const operator = getOperator(wallet.operator);
          return (
            <Pressable
              key={wallet.id}
              onPress={() => handleSelect(wallet)}
              testID={`choose-source-wallet-${wallet.id}`}
              className={`flex-row items-center justify-between rounded-xl border p-4 ${
                wallet.isDefault
                  ? 'border-primary-800 dark:border-primary-300'
                  : 'border-neutral-300 dark:border-neutral-700'
              }`}
            >
              <View className="flex-row items-center gap-3">
                <View className="size-3 rounded-full" style={{ backgroundColor: operator.color }} />
                <View>
                  <Text className="text-base font-semibold">
                    {wallet.nickname ?? operator.label}
                  </Text>
                  <Text className="text-sm text-gray-600 dark:text-neutral-400">
                    {operator.label}
                    {' · '}
                    {maskPhoneNumber(wallet.phoneNumber)}
                  </Text>
                </View>
              </View>
              {wallet.isDefault && (
                <Text className="text-xs font-semibold text-primary-800 dark:text-primary-300">
                  Par défaut
                </Text>
              )}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
