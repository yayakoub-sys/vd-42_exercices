import { useRouter } from 'expo-router';
import * as React from 'react';

import {
  Button,
  FocusAwareStatusBar,
  SafeAreaView,
  Text,
  View,
} from '@/components/ui';
import { useIsFirstTime } from '@/lib/hooks';
import { Cover } from './components/cover';

export function OnboardingScreen() {
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
          Un seul geste pour payer
        </Text>

        <Text className="my-1 pt-6 text-left text-lg">
          Vise n'importe quel QR de paiement (Wave, Orange Money...).
        </Text>
        <Text className="my-1 text-left text-lg">
          EasyPay reconnaît tout de suite à qui il appartient.
        </Text>
        <Text className="my-1 text-left text-lg">
          Et ouvre directement la bonne appli pour toi.
        </Text>
      </View>
      <SafeAreaView className="mt-6">
        <Button
          label="Commencer"
          onPress={() => {
            setIsFirstTime(false);
            router.replace('/(app)');
          }}
        />
      </SafeAreaView>
    </View>
  );
}
