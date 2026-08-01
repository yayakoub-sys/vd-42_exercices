import { useLocalSearchParams, useRouter } from 'expo-router';
import * as React from 'react';

import { Button, FocusAwareStatusBar, SafeAreaView, Text, View } from '@/components/ui';
import { removeWallet } from '@/storage/walletsState';

export default function RemoveWalletScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const onRemove = async () => {
    await removeWallet(id);
    router.replace('/(app)/wallets/');
  };

  return (
    <View className="flex-1 justify-end bg-white p-6 dark:bg-black">
      <FocusAwareStatusBar />
      <Text className="mb-2 text-xl font-bold">Retirer ce portefeuille de EasyPay ?</Text>
      <Text className="mb-6 text-base text-neutral-500 dark:text-neutral-400">
        Tu ne pourras plus payer avec depuis l'appli.
      </Text>
      <SafeAreaView className="w-full gap-3">
        <Button
          label="Retirer"
          variant="destructive"
          onPress={onRemove}
          testID="remove-wallet-confirm-button"
        />
        <Button
          label="Annuler"
          variant="outline"
          onPress={() => router.back()}
          testID="remove-wallet-cancel-button"
        />
      </SafeAreaView>
    </View>
  );
}
