import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import * as React from 'react';

import {
  ActivityIndicator,
  FocusAwareStatusBar,
  List,
  Pressable,
  SafeAreaView,
  Text,
  TouchableOpacity,
  View,
} from '@/components/ui';
import { OPERATORS } from '@/core/wallet-engine/operators';
import type { LinkedWallet } from '@/core/wallet-engine/types';
import { getWallets } from '@/storage/walletsState';

function maskPhoneNumber(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  const groups: string[] = [];
  for (let i = 0; i < digits.length; i += 2) {
    groups.push(digits.slice(i, i + 2));
  }
  if (groups.length <= 3) return groups.join(' ');
  return groups
    .map((group, index) => (index === 0 || index >= groups.length - 2 ? group : '**'))
    .join(' ');
}

function WalletCard({ wallet, onPress }: { wallet: LinkedWallet; onPress: () => void }) {
  const operator = OPERATORS[wallet.operator];
  return (
    <Pressable
      onPress={onPress}
      className="mb-3 flex-row items-center rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-900"
    >
      <View
        className="mr-4 size-12 items-center justify-center rounded-full"
        style={{ backgroundColor: operator.color }}
      >
        <Text className="text-lg font-bold text-white">{operator.label.charAt(0)}</Text>
      </View>
      <View className="flex-1">
        <Text className="text-base font-semibold">{operator.label}</Text>
        <Text className="text-sm text-neutral-500 dark:text-neutral-400">
          {maskPhoneNumber(wallet.phoneNumber)}
        </Text>
      </View>
      {wallet.isDefault && (
        <View className="rounded-full bg-gold-500 px-3 py-1">
          <Text className="text-xs font-semibold text-primary-900">Par défaut</Text>
        </View>
      )}
    </Pressable>
  );
}

export default function WalletsListScreen() {
  const router = useRouter();
  const [wallets, setWallets] = React.useState<LinkedWallet[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  const load = React.useCallback(() => {
    setIsLoading(true);
    getWallets()
      .then(setWallets)
      .finally(() => setIsLoading(false));
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      load();
    }, [load]),
  );

  return (
    <View className="flex-1 bg-white dark:bg-black">
      <FocusAwareStatusBar />
      <View className="flex-row items-center justify-between px-4 pt-4">
        <Text className="text-2xl font-bold">Mes portefeuilles</Text>
        <TouchableOpacity
          onPress={() => router.push('/(app)/wallets/add')}
          className="rounded-full bg-primary-800 px-4 py-2"
        >
          <Text className="text-sm font-semibold text-white">+ Ajouter</Text>
        </TouchableOpacity>
      </View>

      {isLoading
        ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator />
            </View>
          )
        : wallets.length === 0
          ? (
              <View className="flex-1 items-center justify-center px-8">
                <Text className="mb-2 text-center text-lg font-semibold">
                  Aucun portefeuille lié pour l'instant
                </Text>
                <Text className="mb-6 text-center text-base text-neutral-500 dark:text-neutral-400">
                  Tu ne pourras pas payer tant que tu n'en as pas ajouté un.
                </Text>
                <TouchableOpacity
                  onPress={() => router.push('/(app)/wallets/add')}
                  className="rounded-xl bg-primary-800 px-6 py-3"
                >
                  <Text className="text-base font-semibold text-white">Ajouter un portefeuille</Text>
                </TouchableOpacity>
              </View>
            )
          : (
              <List
                data={wallets}
                keyExtractor={(item: LinkedWallet) => item.id}
                contentContainerStyle={{ padding: 16 }}
                renderItem={({ item }: { item: LinkedWallet }) => (
                  <WalletCard
                    wallet={item}
                    onPress={() =>
                      router.push({ pathname: '/(app)/wallets/[id]', params: { id: item.id } })}
                  />
                )}
              />
            )}
      <SafeAreaView />
    </View>
  );
}
