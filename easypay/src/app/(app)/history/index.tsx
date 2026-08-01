import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import * as React from 'react';

import {
  ActivityIndicator,
  EmptyList,
  FocusAwareStatusBar,
  List,
  Pressable,
  SafeAreaView,
  Text,
  TouchableOpacity,
  View,
} from '@/components/ui';
import type { PaymentTransaction } from '@/core/wallet-engine/types';
import { getTransactions } from '@/storage/transactionsState';

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function StatusBadge({ status }: { status: PaymentTransaction['status'] }) {
  const isSuccess = status === 'success';
  return (
    <View
      className={
        isSuccess
          ? 'rounded-full bg-success-100 px-3 py-1 dark:bg-success-900'
          : 'rounded-full bg-danger-100 px-3 py-1 dark:bg-danger-900'
      }
    >
      <Text
        className={
          isSuccess
            ? 'text-xs font-semibold text-success-700 dark:text-success-300'
            : 'text-xs font-semibold text-danger-700 dark:text-danger-300'
        }
      >
        {isSuccess ? 'Réussi' : 'Échoué'}
      </Text>
    </View>
  );
}

function TransactionRow({ transaction, onPress }: { transaction: PaymentTransaction; onPress: () => void }) {
  const title = transaction.merchantName ?? transaction.merchantProviderLabel;
  return (
    <Pressable
      onPress={onPress}
      className="mb-3 rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-900"
    >
      <View className="mb-2 flex-row items-start justify-between">
        <Text className="flex-1 pr-2 text-base font-semibold">{title}</Text>
        <StatusBadge status={transaction.status} />
      </View>
      <View className="flex-row items-center justify-between">
        <Text className="text-sm text-neutral-500 dark:text-neutral-400">
          {transaction.sourceOperatorLabel}
        </Text>
        <Text className="text-base font-bold">
          {transaction.amount}
          {' '}
          {transaction.currency}
        </Text>
      </View>
      <Text className="mt-1 text-xs text-neutral-400 dark:text-neutral-500">
        {formatDate(transaction.timestamp)}
      </Text>
    </Pressable>
  );
}

export default function HistoryListScreen() {
  const router = useRouter();
  const [transactions, setTransactions] = React.useState<PaymentTransaction[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  const load = React.useCallback(() => {
    setIsLoading(true);
    getTransactions()
      .then(setTransactions)
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
        <Text className="text-2xl font-bold">Historique</Text>
        <TouchableOpacity
          onPress={() => router.push('/(app)/history/filter')}
          className="rounded-full bg-primary-800 px-4 py-2"
        >
          <Text className="text-sm font-semibold text-white">Filtrer</Text>
        </TouchableOpacity>
      </View>

      {isLoading
        ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator />
            </View>
          )
        : (
            <List
              data={transactions}
              keyExtractor={(item: PaymentTransaction) => item.id}
              contentContainerStyle={{ padding: 16 }}
              ListEmptyComponent={<EmptyList isLoading={isLoading} />}
              renderItem={({ item }: { item: PaymentTransaction }) => (
                <TransactionRow
                  transaction={item}
                  onPress={() =>
                    router.push({ pathname: '/(app)/history/[id]', params: { id: item.id } })}
                />
              )}
            />
          )}
      <SafeAreaView />
    </View>
  );
}
