import { useFocusEffect } from '@react-navigation/native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as React from 'react';

import { ActivityIndicator, FocusAwareStatusBar, Text, TouchableOpacity, View } from '@/components/ui';
import { OPERATORS } from '@/core/wallet-engine/operators';
import type { LinkedWallet } from '@/core/wallet-engine/types';
import { getWallet } from '@/storage/walletsState';

function formatPhoneNumber(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  const groups: string[] = [];
  for (let i = 0; i < digits.length; i += 2) {
    groups.push(digits.slice(i, i + 2));
  }
  return groups.join(' ');
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

const STATUS_LABELS: Record<LinkedWallet['status'], string> = {
  active: 'Actif',
  pending: 'En attente',
  failed: 'Échoué',
};

export default function WalletDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [wallet, setWallet] = React.useState<LinkedWallet | undefined>(undefined);
  const [isLoading, setIsLoading] = React.useState(true);

  useFocusEffect(
    React.useCallback(() => {
      setIsLoading(true);
      getWallet(id)
        .then(setWallet)
        .finally(() => setIsLoading(false));
    }, [id]),
  );

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-black">
        <FocusAwareStatusBar />
        <ActivityIndicator />
      </View>
    );
  }

  if (!wallet) {
    return (
      <View className="flex-1 items-center justify-center bg-white p-6 dark:bg-black">
        <FocusAwareStatusBar />
        <Text className="text-center text-base text-neutral-500 dark:text-neutral-400">
          Ce portefeuille n'existe plus.
        </Text>
      </View>
    );
  }

  const operator = OPERATORS[wallet.operator];

  return (
    <View className="flex-1 bg-white p-6 dark:bg-black">
      <FocusAwareStatusBar />
      <View className="mb-6 items-center">
        <View
          className="mb-3 size-16 items-center justify-center rounded-full"
          style={{ backgroundColor: operator.color }}
        >
          <Text className="text-2xl font-bold text-white">{operator.label.charAt(0)}</Text>
        </View>
        <Text className="text-2xl font-bold">{operator.label}</Text>
        {wallet.isDefault && (
          <View className="mt-2 rounded-full bg-gold-500 px-3 py-1">
            <Text className="text-xs font-semibold text-primary-900">Par défaut</Text>
          </View>
        )}
      </View>

      <View className="mb-6 rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-900">
        <View className="mb-3">
          <Text className="text-sm text-neutral-500 dark:text-neutral-400">Numéro</Text>
          <Text className="text-base font-semibold">{formatPhoneNumber(wallet.phoneNumber)}</Text>
        </View>
        <View className="mb-3">
          <Text className="text-sm text-neutral-500 dark:text-neutral-400">Lié depuis le</Text>
          <Text className="text-base font-semibold">{formatDate(wallet.linkedAt)}</Text>
        </View>
        <View>
          <Text className="text-sm text-neutral-500 dark:text-neutral-400">Statut</Text>
          <Text className="text-base font-semibold">{STATUS_LABELS[wallet.status]}</Text>
        </View>
      </View>

      {!wallet.isDefault && (
        <TouchableOpacity
          onPress={() => router.push({ pathname: '/(app)/wallets/set-default', params: { id: wallet.id } })}
          className="mb-3 rounded-xl bg-primary-800 px-6 py-3"
        >
          <Text className="text-center text-base font-semibold text-white">
            Définir par défaut
          </Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        onPress={() => router.push({ pathname: '/(app)/wallets/remove', params: { id: wallet.id } })}
        className="rounded-xl border border-danger-500 px-6 py-3"
      >
        <Text className="text-center text-base font-semibold text-danger-600">
          Retirer ce portefeuille
        </Text>
      </TouchableOpacity>
    </View>
  );
}
