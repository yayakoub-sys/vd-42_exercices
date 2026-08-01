import { useLocalSearchParams, useRouter } from 'expo-router';
import * as React from 'react';

import { Button, FocusAwareStatusBar, SafeAreaView, Text, View } from '@/components/ui';
import { OPERATORS } from '@/core/wallet-engine/operators';
import type { OperatorId } from '@/core/wallet-engine/types';

export default function AddWalletSuccessScreen() {
  const router = useRouter();
  const { operator } = useLocalSearchParams<{ operator: OperatorId }>();
  const operatorInfo = OPERATORS[operator];

  return (
    <View className="flex-1 items-center justify-center bg-white p-6 dark:bg-black">
      <FocusAwareStatusBar />
      <View className="mb-6 size-20 items-center justify-center rounded-full bg-success-500">
        <Text className="text-4xl font-bold text-white">✓</Text>
      </View>
      <Text className="mb-2 text-center text-2xl font-bold">
        Portefeuille
        {' '}
        {operatorInfo.label}
        {' '}
        ajouté !
      </Text>
      <Text className="mb-8 text-center text-base text-neutral-500 dark:text-neutral-400">
        Tu peux maintenant l'utiliser pour payer avec EasyPay.
      </Text>
      <SafeAreaView className="w-full">
        <Button
          label="Terminer"
          onPress={() => router.replace('/(app)/wallets/')}
          testID="wallet-add-success-finish-button"
        />
      </SafeAreaView>
    </View>
  );
}
