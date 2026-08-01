import { useLocalSearchParams, useRouter } from 'expo-router';
import * as React from 'react';

import { ActivityIndicator, FocusAwareStatusBar, Text, View } from '@/components/ui';
import { linkWallet } from '@/core/wallet-engine/mockBackend';
import type { OperatorId } from '@/core/wallet-engine/types';
import { addWallet } from '@/storage/walletsState';

export default function AddWalletWaitingScreen() {
  const router = useRouter();
  const { operator, phone } = useLocalSearchParams<{ operator: OperatorId; phone: string }>();

  React.useEffect(() => {
    let cancelled = false;

    async function run() {
      const result = await linkWallet(operator, phone);
      if (cancelled) return;
      if (result.success) {
        await addWallet(operator, phone);
        router.replace({ pathname: '/(app)/wallets/add-success', params: { operator } });
      }
      else {
        router.replace('/(app)/wallets/add-fail');
      }
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [operator, phone, router]);

  return (
    <View className="flex-1 items-center justify-center bg-white dark:bg-black">
      <FocusAwareStatusBar />
      <ActivityIndicator size="large" />
      <Text className="mt-6 text-lg font-semibold">Autorisation en cours...</Text>
    </View>
  );
}
