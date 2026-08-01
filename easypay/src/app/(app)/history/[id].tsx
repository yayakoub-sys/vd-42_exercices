import { useLocalSearchParams, useRouter } from 'expo-router';
import * as React from 'react';
import { Share } from 'react-native';

import {
  ActivityIndicator,
  Button,
  FocusAwareStatusBar,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from '@/components/ui';
import type { PaymentTransaction } from '@/core/wallet-engine/types';
import { getTransaction } from '@/storage/transactionsState';

const QR_PREVIEW_LIMIT = 120;

function formatFullDate(timestamp: number): string {
  return new Date(timestamp).toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function truncateQr(raw: string): string {
  if (raw.length <= QR_PREVIEW_LIMIT) return raw;
  return `${raw.slice(0, QR_PREVIEW_LIMIT)}…`;
}

function buildReceiptText(transaction: PaymentTransaction): string {
  const title = transaction.merchantName ?? transaction.merchantProviderLabel;
  const statusLabel = transaction.status === 'success' ? 'Réussi' : 'Échoué';
  return [
    'Reçu EasyPay',
    `Commerçant : ${title}`,
    `Montant : ${transaction.amount} ${transaction.currency}`,
    `Payé avec : ${transaction.sourceOperatorLabel}`,
    `Commission EasyPay : ${transaction.commission} ${transaction.currency}`,
    `Statut : ${statusLabel}`,
    `Date : ${formatFullDate(transaction.timestamp)}`,
  ].join('\n');
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="mb-4 flex-row items-start justify-between">
      <Text className="pr-4 text-sm text-neutral-500 dark:text-neutral-400">{label}</Text>
      <Text className="flex-1 text-right text-base font-semibold">{value}</Text>
    </View>
  );
}

export default function TransactionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [transaction, setTransaction] = React.useState<PaymentTransaction | undefined>(undefined);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    if (!id) {
      setIsLoading(false);
      return;
    }
    getTransaction(id)
      .then(setTransaction)
      .finally(() => setIsLoading(false));
  }, [id]);

  const onShare = React.useCallback(() => {
    if (!transaction) return;
    Share.share({ message: buildReceiptText(transaction) });
  }, [transaction]);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-black">
        <FocusAwareStatusBar />
        <ActivityIndicator />
      </View>
    );
  }

  if (!transaction) {
    return (
      <View className="flex-1 items-center justify-center bg-white px-8 dark:bg-black">
        <FocusAwareStatusBar />
        <Text className="text-center text-base text-neutral-500 dark:text-neutral-400">
          Ce reçu est introuvable.
        </Text>
      </View>
    );
  }

  const title = transaction.merchantName ?? transaction.merchantProviderLabel;
  const isSuccess = transaction.status === 'success';

  return (
    <View className="flex-1 bg-white dark:bg-black">
      <FocusAwareStatusBar />
      <ScrollView className="flex-1 px-4 pt-4" contentContainerStyle={{ paddingBottom: 32 }}>
        <View className="mb-6 items-center">
          <Text className="text-3xl font-bold">
            {transaction.amount}
            {' '}
            {transaction.currency}
          </Text>
          <View
            className={
              isSuccess
                ? 'mt-2 rounded-full bg-success-100 px-3 py-1 dark:bg-success-900'
                : 'mt-2 rounded-full bg-danger-100 px-3 py-1 dark:bg-danger-900'
            }
          >
            <Text
              className={
                isSuccess
                  ? 'text-xs font-semibold text-success-700 dark:text-success-300'
                  : 'text-xs font-semibold text-danger-700 dark:text-danger-300'
              }
            >
              {isSuccess ? 'Paiement réussi' : 'Paiement échoué'}
            </Text>
          </View>
        </View>

        <View className="rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-900">
          <InfoRow label="Commerçant" value={title} />
          <InfoRow label="Payé avec" value={transaction.sourceOperatorLabel} />
          <InfoRow label="Commission EasyPay" value={`${transaction.commission} ${transaction.currency}`} />
          <InfoRow label="Date" value={formatFullDate(transaction.timestamp)} />
          <InfoRow label="QR scanné" value={truncateQr(transaction.merchantQrRaw)} />
        </View>

        <Button
          label="Partager ce reçu"
          onPress={onShare}
          className="mt-6"
        />

        <TouchableOpacity
          onPress={() => router.push({ pathname: '/(app)/history/report', params: { id: transaction.id } })}
          className="mt-2 items-center py-3"
        >
          <Text className="text-sm font-semibold text-danger-600">Signaler un problème</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
