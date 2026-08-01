import { useLocalSearchParams, useRouter } from 'expo-router';
import * as React from 'react';

import { Button, FocusAwareStatusBar, SafeAreaView, Text, View } from '@/components/ui';
import { setDefaultWallet } from '@/storage/walletsState';

export default function SetDefaultWalletScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const onConfirm = async () => {
    await setDefaultWallet(id);
    router.back();
  };

  return (
    <View className="flex-1 justify-end bg-white p-6 dark:bg-black">
      <FocusAwareStatusBar />
      <Text className="mb-2 text-xl font-bold">
        Faire de ce portefeuille ta source de paiement par défaut ?
      </Text>
      <Text className="mb-6 text-base text-neutral-500 dark:text-neutral-400">
        Ce sera le portefeuille proposé en premier à chaque paiement.
      </Text>
      <SafeAreaView className="w-full gap-3">
        <Button label="Confirmer" onPress={onConfirm} testID="set-default-confirm-button" />
        <Button
          label="Annuler"
          variant="outline"
          onPress={() => router.back()}
          testID="set-default-cancel-button"
        />
      </SafeAreaView>
    </View>
  );
}
