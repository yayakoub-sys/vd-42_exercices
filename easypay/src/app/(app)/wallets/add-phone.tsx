import { useLocalSearchParams, useRouter } from 'expo-router';
import * as React from 'react';

import { Button, FocusAwareStatusBar, Input, SafeAreaView, Text, View } from '@/components/ui';
import { OPERATORS } from '@/core/wallet-engine/operators';
import type { OperatorId } from '@/core/wallet-engine/types';

export default function AddWalletPhoneScreen() {
  const router = useRouter();
  const { operator } = useLocalSearchParams<{ operator: OperatorId }>();
  const operatorInfo = OPERATORS[operator];
  const [phoneNumber, setPhoneNumber] = React.useState('');
  const [error, setError] = React.useState('');

  const onContinue = () => {
    const digits = phoneNumber.replace(/\D/g, '');
    if (digits.length < 8) {
      setError('Entre un numéro valide (au moins 8 chiffres).');
      return;
    }
    setError('');
    router.push({
      pathname: '/(app)/wallets/add-explain',
      params: { operator, phone: phoneNumber },
    });
  };

  return (
    <View className="flex-1 bg-white p-6 dark:bg-black">
      <FocusAwareStatusBar />
      <Text className="mb-2 mt-4 text-2xl font-bold">
        Numéro
        {' '}
        {operatorInfo.label}
      </Text>
      <Text className="mb-6 text-base text-neutral-500 dark:text-neutral-400">
        Quel est le numéro de téléphone associé à ce portefeuille
        {' '}
        {operatorInfo.label}
        {' '}
        ?
      </Text>
      <Input
        label="Numéro de téléphone"
        placeholder="Ex : 07 00 00 00 00"
        keyboardType="number-pad"
        value={phoneNumber}
        onChangeText={setPhoneNumber}
        error={error}
        testID="wallet-phone-input"
      />
      <SafeAreaView className="mt-auto w-full">
        <Button label="Continuer" onPress={onContinue} testID="wallet-phone-continue-button" />
      </SafeAreaView>
    </View>
  );
}
