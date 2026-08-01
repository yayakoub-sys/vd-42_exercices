import { useRouter } from 'expo-router';
import * as React from 'react';

import {
  FocusAwareStatusBar,
  Input,
  Text,
  View,
} from '@/components/ui';

export default function PinCreateScreen() {
  const router = useRouter();
  const [pin, setPin] = React.useState('');

  const onChangePin = (value: string) => {
    const digits = value.replace(/\D/g, '');
    setPin(digits);
    if (digits.length === 4) {
      router.push({ pathname: '/(auth)/pin-confirm', params: { pin: digits } });
    }
  };

  return (
    <View className="flex-1 bg-white p-6 dark:bg-black">
      <FocusAwareStatusBar />
      <Text className="mb-2 mt-4 text-2xl font-bold">
        Choisis un code secret
      </Text>
      <Text className="mb-6 text-base text-gray-600 dark:text-neutral-400">
        Ce code à 4 chiffres te servira à ouvrir EasyPay et à confirmer tes
        paiements. Choisis-le facile à retenir, mais que toi seul connais.
      </Text>
      <Input
        label="Code secret (4 chiffres)"
        placeholder="••••"
        keyboardType="number-pad"
        secureTextEntry
        maxLength={4}
        value={pin}
        onChangeText={onChangePin}
        testID="pin-create-input"
      />
    </View>
  );
}
