import { useRouter } from 'expo-router';
import * as React from 'react';

import {
  Button,
  FocusAwareStatusBar,
  Input,
  Text,
  View,
} from '@/components/ui';
import { formatEmvcoAmount } from '@/core/emvco';
import { usePaymentDraftStore } from '@/core/wallet-engine/paymentDraftStore';

export default function AmountScreen() {
  const router = useRouter();
  const setAmount = usePaymentDraftStore((s) => s.setAmount);
  const [rawValue, setRawValue] = React.useState('');

  const numeric = Number(rawValue.replace(/\D/g, '') || '0');
  const preview = numeric > 0 ? formatEmvcoAmount(String(numeric), '952') : undefined;

  function handleContinue() {
    if (numeric <= 0) return;
    setAmount(numeric);
    router.push('/pay/choose-source');
  }

  return (
    <View className="flex-1 bg-white p-6 dark:bg-black">
      <FocusAwareStatusBar />
      <Text className="mb-2 mt-4 text-2xl font-bold">
        Combien veux-tu payer ?
      </Text>
      <Text className="mb-6 text-base text-gray-600 dark:text-neutral-400">
        Ce QR ne précise pas de montant, entre-le toi-même.
      </Text>
      <Input
        label="Montant en FCFA"
        placeholder="0"
        keyboardType="number-pad"
        value={rawValue}
        onChangeText={setRawValue}
        testID="amount-input"
      />
      <Text className="mt-2 text-2xl font-bold">
        {preview ?? '0 FCFA'}
      </Text>
      <View className="mt-auto w-full">
        <Button
          label="Continuer"
          onPress={handleContinue}
          disabled={numeric <= 0}
          testID="amount-continue-button"
        />
      </View>
    </View>
  );
}
