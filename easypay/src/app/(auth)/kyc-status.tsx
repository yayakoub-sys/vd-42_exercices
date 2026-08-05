import type { KycStatus } from '@/core/wallet-engine/types';
import { useRouter } from 'expo-router';

import * as React from 'react';
import {
  ActivityIndicator,
  Button,
  colors,
  FocusAwareStatusBar,
  SafeAreaView,
  Text,
  View,
} from '@/components/ui';
import { getKycProfile } from '@/storage/kycState';

export default function KycStatusScreen() {
  const router = useRouter();
  const [status, setStatus] = React.useState<KycStatus>('pending');

  React.useEffect(() => {
    let isActive = true;
    const checkStatus = async () => {
      const profile = await getKycProfile();
      if (isActive) {
        setStatus(profile.status);
      }
    };
    checkStatus();
    const interval = setInterval(checkStatus, 1000);
    return () => {
      isActive = false;
      clearInterval(interval);
    };
  }, []);

  const isVerified = status === 'verified';

  return (
    <View className="flex-1 items-center justify-center bg-white p-6 dark:bg-black">
      <FocusAwareStatusBar />
      {isVerified
        ? (
            <Text className="mb-4 text-2xl font-bold text-success-600">
              Identité vérifiée ✓
            </Text>
          )
        : (
            <>
              <ActivityIndicator size="large" color={colors.primary[800]} />
              <Text className="mt-6 mb-2 text-2xl font-bold">
                Vérification en cours...
              </Text>
              <Text className="text-center text-base text-gray-600 dark:text-neutral-400">
                Ça ne prend que quelques secondes.
              </Text>
            </>
          )}
      {isVerified && (
        <SafeAreaView className="mt-6 w-full">
          <Button
            label="Terminer"
            onPress={() => router.replace('/(app)')}
            testID="kyc-status-finish-button"
          />
        </SafeAreaView>
      )}
    </View>
  );
}
