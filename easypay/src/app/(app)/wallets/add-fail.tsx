import { useRouter } from 'expo-router';
import * as React from 'react';

import { Button, FocusAwareStatusBar, SafeAreaView, Text, View } from '@/components/ui';

export default function AddWalletFailScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 items-center justify-center bg-white p-6 dark:bg-black">
      <FocusAwareStatusBar />
      <View className="mb-6 size-20 items-center justify-center rounded-full bg-danger-500">
        <Text className="text-4xl font-bold text-white">✕</Text>
      </View>
      <Text className="mb-2 text-center text-2xl font-bold">
        Impossible de confirmer ce portefeuille.
      </Text>
      <Text className="mb-8 text-center text-base text-neutral-500 dark:text-neutral-400">
        Vérifie le numéro et réessaie, ou annule pour revenir à tes portefeuilles.
      </Text>
      <SafeAreaView className="w-full gap-3">
        <Button
          label="Réessayer"
          onPress={() => router.replace('/(app)/wallets/add')}
          testID="wallet-add-fail-retry-button"
        />
        <Button
          label="Annuler"
          variant="outline"
          onPress={() => router.replace('/(app)/wallets/')}
          testID="wallet-add-fail-cancel-button"
        />
      </SafeAreaView>
    </View>
  );
}
