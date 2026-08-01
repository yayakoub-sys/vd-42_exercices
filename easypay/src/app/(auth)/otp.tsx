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
import { sendOtp, verifyOtp } from '@/core/wallet-engine/mockBackend';
import { getAuthState } from '@/storage/authState';

export default function OtpScreen() {
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = React.useState('');
  const [code, setCode] = React.useState('');
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [resending, setResending] = React.useState(false);

  React.useEffect(() => {
    getAuthState().then((state) => {
      setPhoneNumber(state.phoneNumber ?? '');
    });
  }, []);

  const onVerify = async () => {
    if (code.length !== 6) {
      setError('Le code contient 6 chiffres.');
      return;
    }
    setError('');
    setLoading(true);
    const isValid = await verifyOtp(phoneNumber, code);
    setLoading(false);
    if (!isValid) {
      setError('Ce code n\'est pas bon. Vérifie et réessaie.');
      return;
    }
    router.push('/(auth)/pin-create');
  };

  const onResend = async () => {
    setResending(true);
    await sendOtp(phoneNumber);
    setResending(false);
  };

  return (
    <View className="flex-1 bg-white p-6 dark:bg-black">
      <FocusAwareStatusBar />
      <Text className="mb-2 mt-4 text-2xl font-bold">
        Entre le code reçu
      </Text>
      <Text className="mb-6 text-base text-gray-600 dark:text-neutral-400">
        Code envoyé au
        {' '}
        {phoneNumber || 'ton numéro'}
      </Text>
      <Input
        label="Code à 6 chiffres"
        placeholder="000000"
        keyboardType="number-pad"
        maxLength={6}
        value={code}
        onChangeText={setCode}
        error={error}
        testID="otp-input"
      />
      <Button
        label="Renvoyer le code"
        variant="link"
        loading={resending}
        onPress={onResend}
        testID="otp-resend-button"
      />
      <SafeAreaView className="mt-auto w-full">
        <Button
          label="Vérifier"
          onPress={onVerify}
          loading={loading}
          testID="otp-verify-button"
        />
      </SafeAreaView>
    </View>
  );
}
