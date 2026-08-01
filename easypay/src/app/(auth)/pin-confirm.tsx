import { useLocalSearchParams, useRouter } from 'expo-router';
import * as React from 'react';

import {
  FocusAwareStatusBar,
  Input,
  Text,
  View,
} from '@/components/ui';
import { setPin as savePin } from '@/storage/authState';

export default function PinConfirmScreen() {
  const router = useRouter();
  const { pin: originalPin } = useLocalSearchParams<{ pin: string }>();
  const [confirmPin, setConfirmPin] = React.useState('');
  const [error, setError] = React.useState('');

  const onChangeConfirmPin = async (value: string) => {
    const digits = value.replace(/\D/g, '');
    setConfirmPin(digits);
    setError('');
    if (digits.length !== 4) {
      return;
    }
    if (digits !== originalPin) {
      setError('Les deux codes ne sont pas identiques. Réessaie.');
      setConfirmPin('');
      return;
    }
    await savePin(digits);
    router.push('/(auth)/consent');
  };

  return (
    <View className="flex-1 bg-white p-6 dark:bg-black">
      <FocusAwareStatusBar />
      <Text className="mb-2 mt-4 text-2xl font-bold">
        Confirme ton code
      </Text>
      <Text className="mb-6 text-base text-gray-600 dark:text-neutral-400">
        Ressaisis le même code pour être sûr que tu ne t'es pas trompé.
      </Text>
      <Input
        label="Confirme le code secret"
        placeholder="••••"
        keyboardType="number-pad"
        secureTextEntry
        maxLength={4}
        value={confirmPin}
        onChangeText={onChangeConfirmPin}
        error={error}
        testID="pin-confirm-input"
      />
    </View>
  );
}
