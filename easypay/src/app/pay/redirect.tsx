import { useRouter } from 'expo-router';
import * as React from 'react';

import { ActivityIndicator, FocusAwareStatusBar, Text, View } from '@/components/ui';
import { getOperator } from '@/core/wallet-engine/operators';
import { usePaymentDraftStore } from '@/core/wallet-engine/paymentDraftStore';

export default function RedirectScreen() {
  const router = useRouter();
  const sourceWallet = usePaymentDraftStore(s => s.sourceWallet);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      router.replace('/pay/waiting');
    }, 1200);
    return () => clearTimeout(timer);
  }, [router]);

  const operatorLabel = sourceWallet ? getOperator(sourceWallet.operator).label : 'ton opérateur';

  return (
    <View className="flex-1 items-center justify-center gap-4 bg-white p-6 dark:bg-black">
      <FocusAwareStatusBar />
      <ActivityIndicator size="large" />
      <Text className="text-center text-lg">
        On t'emmène chez
        {' '}
        {operatorLabel}
        {' '}
        pour valider...
      </Text>
    </View>
  );
}
