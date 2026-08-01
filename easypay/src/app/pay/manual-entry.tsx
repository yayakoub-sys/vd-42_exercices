import { useRouter } from 'expo-router';
import * as React from 'react';

import {
  Button,
  FocusAwareStatusBar,
  Input,
  Text,
  View,
} from '@/components/ui';
import { usePaymentDraftStore } from '@/core/wallet-engine/paymentDraftStore';

export default function ManualEntryScreen() {
  const router = useRouter();
  const setQr = usePaymentDraftStore((s) => s.setQr);
  const reset = usePaymentDraftStore((s) => s.reset);
  const [text, setText] = React.useState('');

  function handleTest() {
    if (!text.trim()) return;
    reset();
    setQr({ raw: text.trim() });
    router.push('/pay/preview');
  }

  return (
    <View className="flex-1 bg-white p-6 dark:bg-black">
      <FocusAwareStatusBar />
      <Text className="mb-2 mt-4 text-2xl font-bold">
        Coller un code de paiement
      </Text>
      <Text className="mb-6 text-base text-gray-600 dark:text-neutral-400">
        Colle ou tape ici le texte brut d'un QR de paiement pour le tester.
      </Text>
      <Input
        label="Contenu du QR"
        placeholder="00020101021126..."
        value={text}
        onChangeText={setText}
        multiline
        numberOfLines={6}
        testID="manual-entry-input"
        style={{ minHeight: 120, textAlignVertical: 'top' }}
      />
      <View className="mt-auto w-full">
        <Button
          label="Tester"
          onPress={handleTest}
          disabled={!text.trim()}
          testID="manual-entry-test-button"
        />
      </View>
    </View>
  );
}
