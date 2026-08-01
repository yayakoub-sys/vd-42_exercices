import { useRouter } from 'expo-router';
import * as React from 'react';

import { ActivityIndicator, FocusAwareStatusBar, Text, View } from '@/components/ui';
import { initiatePayment } from '@/core/wallet-engine/mockBackend';
import { usePaymentDraftStore } from '@/core/wallet-engine/paymentDraftStore';

export default function WaitingScreen() {
  const router = useRouter();
  const amountFcfa = usePaymentDraftStore((s) => s.amountFcfa);
  const setCommission = usePaymentDraftStore((s) => s.setCommission);

  React.useEffect(() => {
    let cancelled = false;
    initiatePayment({ amountFcfa: amountFcfa ?? 0 }).then((result) => {
      if (cancelled) return;
      setCommission(result.commission);
      if (result.success) {
        router.replace('/pay/success');
      } else if (result.reason === 'insufficient_funds') {
        router.replace('/pay/insufficient-funds');
      } else {
        router.replace('/pay/fail');
      }
    });
    return () => {
      cancelled = true;
    };
  }, [amountFcfa, router, setCommission]);

  return (
    <View className="flex-1 items-center justify-center gap-4 bg-white p-6 dark:bg-black">
      <FocusAwareStatusBar />
      <ActivityIndicator size="large" />
      <Text className="text-center text-lg">En attente de la confirmation...</Text>
    </View>
  );
}
