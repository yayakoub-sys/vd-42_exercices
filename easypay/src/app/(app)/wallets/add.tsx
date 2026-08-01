import { useRouter } from 'expo-router';
import * as React from 'react';

import { FocusAwareStatusBar, Pressable, ScrollView, Text, View } from '@/components/ui';
import { OPERATOR_LIST } from '@/core/wallet-engine/operators';

export default function AddWalletScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-white dark:bg-black">
      <FocusAwareStatusBar />
      <ScrollView className="flex-1 px-4 pt-4" contentContainerStyle={{ paddingBottom: 32 }}>
        <Text className="mb-2 text-2xl font-bold">Quel portefeuille veux-tu lier ?</Text>
        <Text className="mb-6 text-base text-neutral-500 dark:text-neutral-400">
          Choisis l'opérateur mobile money que tu utilises.
        </Text>
        {OPERATOR_LIST.map((operator) => (
          <Pressable
            key={operator.id}
            onPress={() =>
              router.push({ pathname: '/(app)/wallets/add-phone', params: { operator: operator.id } })}
            className="mb-3 flex-row items-center rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-900"
          >
            <View
              className="mr-4 size-12 items-center justify-center rounded-full"
              style={{ backgroundColor: operator.color }}
            >
              <Text className="text-lg font-bold text-white">{operator.label.charAt(0)}</Text>
            </View>
            <Text className="text-base font-semibold">{operator.label}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}
