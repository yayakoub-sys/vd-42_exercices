import { useRouter } from 'expo-router';
import * as React from 'react';

import {
  Button,
  FocusAwareStatusBar,
  Input,
  SafeAreaView,
  Text,
  View,
} from '@/components/ui';
import { sendOtp } from '@/core/wallet-engine/mockBackend';
import { setPhoneNumber } from '@/storage/authState';

export default function PhoneScreen() {
  const router = useRouter();
  const [phoneNumber, setPhoneNumberValue] = React.useState('');
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const onContinue = async () => {
    const digits = phoneNumber.replace(/\D/g, '');
    if (digits.length < 8) {
      setError('Entre un numéro valide (au moins 8 chiffres).');
      return;
    }
    setError('');
    setLoading(true);
    await sendOtp(phoneNumber);
    await setPhoneNumber(phoneNumber);
    setLoading(false);
    router.push('/(auth)/otp');
  };

  return (
    <View className="flex-1 bg-white p-6 dark:bg-black">
      <FocusAwareStatusBar />
      <Text className="mb-2 mt-4 text-2xl font-bold">
        Quel est ton numéro ?
      </Text>
      <Text className="mb-6 text-base text-gray-600 dark:text-neutral-400">
        On va t'envoyer un code par SMS pour vérifier que c'est bien toi.
      </Text>
      <Input
        label="Numéro de téléphone"
        placeholder="Ex : 07 00 00 00 00"
        keyboardType="number-pad"
        value={phoneNumber}
        onChangeText={setPhoneNumberValue}
        error={error}
        testID="phone-input"
      />
      <SafeAreaView className="mt-auto w-full">
        <Button
          label="Continuer"
          onPress={onContinue}
          loading={loading}
          testID="phone-continue-button"
        />
      </SafeAreaView>
    </View>
  );
}
