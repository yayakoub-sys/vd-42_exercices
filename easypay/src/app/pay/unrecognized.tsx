import { useRouter } from 'expo-router';
import * as React from 'react';

import {
  Button,
  FocusAwareStatusBar,
  ScrollView,
  Text,
  View,
} from '@/components/ui';
import { usePaymentDraftStore } from '@/core/wallet-engine/paymentDraftStore';

export default function UnrecognizedScreen() {
  const router = useRouter();
  const qr = usePaymentDraftStore((s) => s.qr);

  return (
    <View className="flex-1 bg-white p-6 dark:bg-black">
      <FocusAwareStatusBar />
      <ScrollView className="flex-1" contentContainerClassName="flex-grow justify-center gap-4">
        <Text className="text-center text-xl font-bold">
          Ce QR n'est pas reconnu comme un QR de paiement.
        </Text>
        <Text className="text-center text-base text-gray-600 dark:text-neutral-400">
          Voici ce que la caméra a lu :
        </Text>
        <View className="rounded-xl border border-neutral-300 bg-neutral-100 p-4 dark:border-neutral-700 dark:bg-neutral-800">
          <Text selectable className="text-sm text-gray-700 dark:text-neutral-300">
            {qr?.raw ?? ''}
          </Text>
        </View>
      </ScrollView>
      <View className="mt-auto w-full">
        <Button
          label="Scanner à nouveau"
          onPress={() => router.replace('/(app)')}
          testID="unrecognized-rescan-button"
        />
      </View>
    </View>
  );
}
