import { useRouter } from 'expo-router';
import * as React from 'react';
import { Switch } from 'react-native';

import { colors, FocusAwareStatusBar, Pressable, Text, View } from '@/components/ui';

function Row({ children }: { children: React.ReactNode }) {
  return (
    <View className="flex-row items-center justify-between border-b border-neutral-200 py-4 dark:border-neutral-700">
      {children}
    </View>
  );
}

export default function SecurityScreen() {
  const router = useRouter();
  const [biometryEnabled, setBiometryEnabled] = React.useState(false);

  return (
    <View className="flex-1 bg-white px-4 pt-4 dark:bg-black">
      <FocusAwareStatusBar />

      <Pressable onPress={() => router.push('/(auth)/pin-create')}>
        <Row>
          <Text className="text-base">Changer mon code secret</Text>
          <Text className="text-neutral-400">›</Text>
        </Row>
      </Pressable>

      <Row>
        <Text className="text-base">Activer la biométrie</Text>
        <Switch
          value={biometryEnabled}
          onValueChange={setBiometryEnabled}
          trackColor={{ true: colors.primary[800] }}
        />
      </Row>

      <Row>
        <Text className="text-base">Appareils connectés</Text>
        <Text className="text-neutral-500 dark:text-neutral-400">1 appareil — celui-ci</Text>
      </Row>
    </View>
  );
}
