import { useRouter } from 'expo-router';
import * as React from 'react';

import {
  Button,
  FocusAwareStatusBar,
  SafeAreaView,
  Text,
  View,
} from '@/components/ui';
import { Cover } from '@/features/onboarding/components/cover';
import { useIsFirstTime } from '@/lib/hooks';

export default function WelcomeScreen() {
  const [_, setIsFirstTime] = useIsFirstTime();
  const router = useRouter();
  return (
    <View className="flex h-full items-center justify-center">
      <FocusAwareStatusBar />
      <View className="w-full flex-1">
        <Cover />
      </View>
      <View className="justify-end px-6">
        <Text className="my-3 text-center text-5xl font-bold">
          EasyPay
        </Text>
        <Text className="mb-2 text-center text-lg text-gray-600">
          Ton portefeuille, tous tes moyens de paiement
        </Text>

        <Text className="my-1 pt-6 text-left text-lg">
          Vise n'importe quel QR de paiement (Wave, Orange Money...).
        </Text>
        <Text className="my-1 text-left text-lg">
          Choisis toi-même avec quel portefeuille tu payes.
        </Text>
        <Text className="my-1 text-left text-lg">
          Peu importe lequel le commerçant te présente.
        </Text>
      </View>
      <SafeAreaView className="mt-6 w-full px-6">
        <Button
          label="Commencer"
          onPress={() => {
            setIsFirstTime(false);
            router.push('/(auth)/phone');
          }}
        />
      </SafeAreaView>
    </View>
  );
}
