import type { AuthState, KycProfile } from '@/core/wallet-engine/types';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';

import * as React from 'react';
import { Button, FocusAwareStatusBar, SafeAreaView, Text, View } from '@/components/ui';
import { getAuthState } from '@/storage/authState';
import { getKycProfile } from '@/storage/kycState';

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="border-b border-neutral-200 py-3 dark:border-neutral-700">
      <Text className="text-sm text-neutral-500 dark:text-neutral-400">{label}</Text>
      <Text className="mt-1 text-base font-medium">{value}</Text>
    </View>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const [auth, setAuth] = React.useState<AuthState | null>(null);
  const [kyc, setKyc] = React.useState<KycProfile | null>(null);

  const load = React.useCallback(() => {
    getAuthState().then(setAuth);
    getKycProfile().then(setKyc);
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      load();
    }, [load]),
  );

  return (
    <View className="flex-1 bg-white px-4 dark:bg-black">
      <FocusAwareStatusBar />
      <View className="mt-4 rounded-md border border-neutral-200 px-4 dark:border-neutral-700">
        <InfoRow label="Nom complet" value={kyc?.fullName ?? 'Non renseigné'} />
        <InfoRow label="Numéro de téléphone" value={auth?.phoneNumber ?? 'Non renseigné'} />
        <InfoRow label="Date de naissance" value={kyc?.birthDate ?? 'Non renseignée'} />
      </View>

      <SafeAreaView className="mt-auto w-full pb-4">
        <Button
          label="Modifier"
          onPress={() => router.push('/(app)/account/edit')}
          testID="profile-edit-button"
        />
      </SafeAreaView>
    </View>
  );
}
