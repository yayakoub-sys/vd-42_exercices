import type { PaymentTransaction } from '@/core/wallet-engine/types';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import * as React from 'react';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { formatAmount } from '@/components/transaction-format';
import { TransactionRow } from '@/components/transaction-row';
import {
  ActivityIndicator,
  FocusAwareStatusBar,
  List,
  Text,
  TouchableOpacity,
  View,
} from '@/components/ui';
import { getTransactions } from '@/storage/transactionsState';

/**
 * Historique — carrosserie transplantée depuis BlueWallet (MIT),
 * écran `screen/wallets/transactions.tsx`.
 *
 * REPRIS : le total en tête de liste, les lignes plates séparées par des
 * en-têtes de jour, l'absence de cadre par ligne, l'état vide qui explique
 * quoi faire au lieu de constater le vide.
 *
 * CORRIGÉ au passage (constats d'ETAT.md § 9.4) :
 *   - l'en-tête passait sous l'heure et les icônes du téléphone : la zone
 *     sûre est désormais respectée ;
 *   - l'état vide s'affichait « Sorry! No data found » en anglais.
 */

const JOUR = 86_400_000;

type Ligne
  = | { type: 'jour'; cle: string; libelle: string }
    | { type: 'transaction'; cle: string; transaction: PaymentTransaction };

function libelleDeJour(timestamp: number): string {
  const debutDuJour = new Date().setHours(0, 0, 0, 0);
  if (timestamp >= debutDuJour)
    return 'Aujourd\'hui';
  if (timestamp >= debutDuJour - JOUR)
    return 'Hier';
  return new Date(timestamp).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

/** Aplatit les transactions en lignes, avec un en-tête à chaque changement de jour. */
function enLignes(transactions: PaymentTransaction[]): Ligne[] {
  const lignes: Ligne[] = [];
  let jourCourant = '';
  for (const t of transactions) {
    const libelle = libelleDeJour(t.timestamp);
    if (libelle !== jourCourant) {
      jourCourant = libelle;
      lignes.push({ type: 'jour', cle: `jour-${libelle}`, libelle });
    }
    lignes.push({ type: 'transaction', cle: t.id, transaction: t });
  }
  return lignes;
}

function EnTeteDeJour({ libelle }: { libelle: string }) {
  return (
    <View className="bg-white px-4 pt-5 pb-1 dark:bg-black">
      <Text className="text-xs font-semibold tracking-wide text-neutral-400 uppercase dark:text-neutral-500">
        {libelle}
      </Text>
    </View>
  );
}

function ListeVide() {
  return (
    <View className="items-center px-10 pt-24">
      <View className="mb-4 size-16 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800">
        <Text className="text-2xl">🧾</Text>
      </View>
      <Text className="text-center text-base font-semibold">Aucun paiement pour l'instant</Text>
      <Text className="mt-2 text-center text-sm text-neutral-500 dark:text-neutral-400">
        Scanne le QR d'un commerçant : tes reçus apparaîtront ici.
      </Text>
    </View>
  );
}

export default function HistoryListScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
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

  const lignes = React.useMemo(() => enLignes(transactions), [transactions]);

  // Total réellement débité : les paiements échoués n'ont rien coûté.
  const total = React.useMemo(
    () =>
      transactions
        .filter(t => t.status === 'success')
        .reduce((somme, t) => somme + t.amount + t.commission, 0),
    [transactions],
  );
  const devise = transactions[0]?.currency ?? 'FCFA';

  return (
    <View className="flex-1 bg-white dark:bg-black">
      <FocusAwareStatusBar />

      {/* En-tete : la zone sure est respectee, l'heure du telephone ne l'ecrase plus. */}
      <View style={{ paddingTop: insets.top + 8 }} className="px-4 pb-2">
        <View className="flex-row items-center justify-between">
          <Text className="text-[28px] font-bold">Historique</Text>
          <TouchableOpacity
            onPress={() => router.push('/(app)/history/filter')}
            className="rounded-full bg-neutral-100 px-4 py-2 dark:bg-neutral-800"
            accessibilityRole="button"
          >
            <Text className="text-sm font-semibold">Filtrer</Text>
          </TouchableOpacity>
        </View>

        {transactions.length > 0
          ? (
              <Text className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                {`${formatAmount(total)} ${devise} dépensés · ${transactions.length} paiement${transactions.length > 1 ? 's' : ''}`}
              </Text>
            )
          : null}
      </View>

      {isLoading
        ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator />
            </View>
          )
        : (
            <List
              data={lignes}
              keyExtractor={(item: Ligne) => item.cle}
              contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
              ListEmptyComponent={<ListeVide />}
              renderItem={({ item }: { item: Ligne }) =>
                item.type === 'jour'
                  ? <EnTeteDeJour libelle={item.libelle} />
                  : (
                      <TransactionRow
                        transaction={item.transaction}
                        onPress={() =>
                          router.push({
                            pathname: '/(app)/history/[id]',
                            params: { id: item.transaction.id },
                          })}
                      />
                    )}
            />
          )}
    </View>
  );
}
