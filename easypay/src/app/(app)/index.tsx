import { useRouter } from 'expo-router';
import * as React from 'react';

import { usePaymentDraftStore } from '@/core/wallet-engine/paymentDraftStore';
import { ScannerScreen } from '@/features/scanner/scanner-screen';

export default function ScannerRoute() {
  const router = useRouter();
  const setQr = usePaymentDraftStore((s) => s.setQr);
  const reset = usePaymentDraftStore((s) => s.reset);

  function handleScanned(raw: string) {
    reset();
    setQr({ raw });
    router.push('/pay/preview');
  }

  return (
    <ScannerScreen
      onScanned={handleScanned}
      onOpenHistory={() => router.push('/(app)/history')}
    />
  );
}
