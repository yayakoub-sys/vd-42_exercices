import type { PaymentTransaction } from '@/core/wallet-engine/types';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as React from 'react';

import { Share } from 'react-native';
import {
  apparencePourStatut,
  formatAmount,
  formatFullDate,
  libelleStatut,
} from '@/components/transaction-format';
import {
  ActivityIndicator,
  Button,
  FocusAwareStatusBar,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from '@/components/ui';
import { getTransaction } from '@/storage/transactionsState';

/**
 * Détail d'un paiement — carrosserie transplantée depuis BlueWallet (MIT),
 * écran `screen/transactions/details.tsx`.
 *
 * REPRIS : le bandeau de tête « grosse pastille d'état + montant + libellé »,
 * puis des lignes d'information PLATES separées par des filets, sans carte
 * encadrée. Le regard trouve le montant en premier, le détail ensuite.
 *
 * RETIRÉ : identifiant de transaction blockchain, confirmations, frais de
 * réseau en sat/vB, lien vers l'explorateur de blocs.
 *
 * GREFFÉ : commerçant, opérateur EasyPay, commission, total réellement
 * débité, et les TROIS états réels — « fonds insuffisants » n'est plus
 * confondu avec un échec.
 */

const QR_PREVIEW_LIMIT = 120;

function truncateQr(raw: string): string {
  if (raw.length <= QR_PREVIEW_LIMIT)
    return raw;
  return `${raw.slice(0, QR_PREVIEW_LIMIT)}…`;
}

function buildReceiptText(transaction: PaymentTransaction): string {
  const titre = transaction.merchantName ?? transaction.merchantProviderLabel;
  return [
    'Reçu EasyPay',
    `Commerçant : ${titre}`,
    `Montant : ${formatAmount(transaction.amount)} ${transaction.currency}`,
    `Payé avec : ${transaction.sourceOperatorLabel}`,
    `Commission EasyPay : ${formatAmount(transaction.commission)} ${transaction.currency}`,
    `Total débité : ${formatAmount(transaction.amount + transaction.commission)} ${transaction.currency}`,
    `Statut : ${libelleStatut(transaction.status)}`,
    `Date : ${formatFullDate(transaction.timestamp)}`,
  ].join('\n');
}

/** Ligne d'information plate, separee par un filet — pas de carte encadree. */
function InfoRow({
  label,
  value,
  fort = false,
}: {
  label: string;
  value: string;
  fort?: boolean;
}) {
  return (
    <View className="flex-row items-start justify-between border-b border-neutral-100 py-4 dark:border-neutral-800">
      <Text className="pr-4 text-sm text-neutral-500 dark:text-neutral-400">{label}</Text>
      <Text className={`flex-1 text-right text-[15px] ${fort ? 'font-bold' : 'font-medium'}`}>
        {value}
      </Text>
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
    if (!transaction)
      return;
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

  const titre = transaction.merchantName ?? transaction.merchantProviderLabel;
  const { cercle, Icone } = apparencePourStatut(transaction.status);
  const aCoute = transaction.status === 'success';

  return (
    <View className="flex-1 bg-white dark:bg-black">
      <FocusAwareStatusBar />
      <ScrollView className="flex-1 px-5" contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Bandeau de tete : etat, montant, commercant */}
        <View className="items-center py-8">
          <View className={`mb-4 size-14 items-center justify-center rounded-full ${cercle}`}>
            <Icone width={26} height={26} />
          </View>
          <Text className="text-[34px] font-bold">
            {formatAmount(transaction.amount)}
            {' '}
            {transaction.currency}
          </Text>
          <Text className="mt-1 text-base text-neutral-500 dark:text-neutral-400">
            {libelleStatut(transaction.status)}
          </Text>
          <Text className="mt-3 text-lg font-semibold">{titre}</Text>
        </View>

        <InfoRow label="Payé avec" value={transaction.sourceOperatorLabel} />
        <InfoRow
          label="Commission EasyPay"
          value={`${formatAmount(transaction.commission)} ${transaction.currency}`}
        />
        <InfoRow
          label={aCoute ? 'Total débité' : 'Aurait été débité'}
          value={`${formatAmount(transaction.amount + transaction.commission)} ${transaction.currency}`}
          fort
        />
        <InfoRow label="Date" value={formatFullDate(transaction.timestamp)} />
        <InfoRow label="QR scanné" value={truncateQr(transaction.merchantQrRaw)} />

        <Button label="Partager ce reçu" onPress={onShare} className="mt-8" />

        <TouchableOpacity
          onPress={() =>
            router.push({ pathname: '/(app)/history/report', params: { id: transaction.id } })}
          className="mt-2 items-center py-3"
          accessibilityRole="button"
        >
          <Text className="text-sm font-semibold text-danger-600">Signaler un problème</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
