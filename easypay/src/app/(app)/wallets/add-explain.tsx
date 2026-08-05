import type { OperatorId } from '@/core/wallet-engine/types';
import { useLocalSearchParams, useRouter } from 'expo-router';

import * as React from 'react';
import { Button, FocusAwareStatusBar, SafeAreaView, Text, View } from '@/components/ui';
import { OPERATORS } from '@/core/wallet-engine/operators';

export default function AddWalletExplainScreen() {
  const router = useRouter();
  const { operator, phone } = useLocalSearchParams<{ operator: OperatorId; phone: string }>();
  const operatorInfo = OPERATORS[operator];

  return (
    <View className="flex-1 bg-white p-6 dark:bg-black">
      <FocusAwareStatusBar />
      <Text className="my-4 text-2xl font-bold">Avant de continuer</Text>
      <Text className="text-base/6 text-neutral-600 dark:text-neutral-400">
        Tu vas être redirigé vers l'appli
        {' '}
        {operatorInfo.label}
        {' '}
        pour confirmer que ce portefeuille t'appartient.
        {' '}
        Reviens ensuite ici automatiquement.
      </Text>
      <SafeAreaView className="mt-auto w-full">
        <Button
          label="Continuer"
          onPress={() =>
            router.push({
              pathname: '/(app)/wallets/add-waiting',
              params: { operator, phone },
            })}
          testID="wallet-explain-continue-button"
        />
      </SafeAreaView>
    </View>
  );
}
