import { useRouter } from 'expo-router';
import * as React from 'react';

import { Button, FocusAwareStatusBar, Text, View } from '@/components/ui';
import { usePaymentDraftStore } from '@/core/wallet-engine/paymentDraftStore';

export default function InsufficientFundsScreen() {
  const router = useRouter();
  const reset = usePaymentDraftStore((s) => s.reset);

  function handleCancel() {
    reset();
    router.replace('/(app)');
  }

  return (
    <View className="flex-1 items-center justify-center gap-4 bg-white p-6 dark:bg-black">
      <FocusAwareStatusBar />
      <Text className="text-center text-2xl font-bold text-danger-600">
        Fonds insuffisants sur ce portefeuille.
      </Text>
      <Text className="text-center text-base text-gray-600 dark:text-neutral-400">
        Choisis un autre portefeuille pour continuer ce paiement.
      </Text>
      <View className="mt-6 w-full gap-2">
        <Button
          label="Choisir un autre portefeuille"
          onPress={() => router.replace('/pay/choose-source')}
          testID="insufficient-funds-retry-button"
        />
        <Button
          label="Annuler"
          variant="outline"
          onPress={handleCancel}
          testID="insufficient-funds-cancel-button"
        />
      </View>
    </View>
  );
}
