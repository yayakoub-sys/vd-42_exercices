import Env from 'env';
import * as React from 'react';
import { Alert } from 'react-native';

import { FocusAwareStatusBar, Pressable, ScrollView, Text, View } from '@/components/ui';

export default function AboutScreen() {
  return (
    <ScrollView>
      <View className="flex-1 items-center px-6 pt-8">
        <FocusAwareStatusBar />
        <Text className="text-2xl font-bold">{Env.EXPO_PUBLIC_NAME ?? 'EasyPay'}</Text>
        <Text className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          Version
          {' '}
          {Env.EXPO_PUBLIC_VERSION}
        </Text>

        <Text className="mt-6 text-center text-base text-neutral-600 dark:text-neutral-300">
          EasyPay est un service d'initiation de paiement : il transmet ton ordre de paiement
          vers le portefeuille de ton choix, sans jamais détenir ton argent.
        </Text>

        <View className="mt-8 w-full">
          <Pressable
            onPress={() => Alert.alert('Mentions légales', 'Document à venir.')}
            className="border-b border-neutral-200 py-3 dark:border-neutral-700"
          >
            <Text className="text-base text-primary-800 dark:text-primary-300">
              Mentions légales
            </Text>
          </Pressable>
          <Pressable
            onPress={() => Alert.alert('Politique de confidentialité', 'Document à venir.')}
            className="py-3"
          >
            <Text className="text-base text-primary-800 dark:text-primary-300">
              Politique de confidentialité
            </Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}
