import type { LinkedWallet, PaymentTransaction } from '@/core/wallet-engine/types';
import { useFocusEffect } from '@react-navigation/native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as React from 'react';
import { ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { formatFullDate } from '@/components/transaction-format';
import { TransactionRow } from '@/components/transaction-row';
import {
  ActivityIndicator,
  FocusAwareStatusBar,
  Pressable,
  Text,
  View,
} from '@/components/ui';
import { masquerNumero, WalletCard } from '@/components/wallet-card';
import { getWalletBalance } from '@/core/wallet-engine/mockBackend';
import { getTransactions } from '@/storage/transactionsState';
import { getWallet } from '@/storage/walletsState';

/**
 * DÉTAIL D'UN PORTEFEUILLE — porté depuis BlueWallet
 * `screen/wallets/WalletDetails.tsx` et `WalletTransactions.tsx`
 * (licence MIT, voir LICENSE-BLUEWALLET).
 *
 * Le donneur met LA CARTE en haut, puis les opérations de ce compte, puis les
 * réglages tout en bas. C'est le bon ordre : on ouvre un compte pour voir ce
 * qui s'y est passé, pas pour le paramétrer.
 *
 * GREFFÉ : les opérations payées avec CE portefeuille. Elles n'étaient
 * visibles nulle part par compte, seulement dans l'historique global.
 *
 * RETIRÉ : export de clés, dérivation, adresses, type de portefeuille.
 */

const STATUTS: Record<LinkedWallet['status'], string> = {
  active: 'Actif',
  pending: 'En attente de confirmation',
  failed: 'Liaison échouée',
};

function Action({
  libelle,
  onPress,
  danger = false,
}: {
  libelle: string;
  onPress: () => void;
  danger?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center justify-between border-b border-neutral-100 py-4 dark:border-neutral-800"
      accessibilityRole="button"
    >
      <Text
        className={`text-base ${danger ? 'font-semibold text-danger-600' : 'font-medium'}`}
      >
        {libelle}
      </Text>
      <Text className="text-neutral-300 dark:text-neutral-600">›</Text>
    </Pressable>
  );
}

function LigneInfo({ libelle, valeur }: { libelle: string; valeur: string }) {
  return (
    <View className="flex-row items-center justify-between border-b border-neutral-100 py-4 dark:border-neutral-800">
      <Text className="text-sm text-neutral-500 dark:text-neutral-400">{libelle}</Text>
      <Text className="text-[15px] font-medium">{valeur}</Text>
    </View>
  );
}

function Operations({
  operations,
  onOuvrir,
}: {
  operations: PaymentTransaction[];
  onOuvrir: (id: string) => void;
}) {
  if (operations.length === 0) {
    return (
      <Text className="mt-7 px-5 text-base text-neutral-500 dark:text-neutral-400">
        Aucun paiement effectué avec ce portefeuille pour l'instant.
      </Text>
    );
  }
  return (
    <View className="mt-7">
      <Text className="px-5 text-lg font-bold">Opérations sur ce compte</Text>
      <View className="mt-1">
        {operations.map(t => (
          <TransactionRow key={t.id} transaction={t} onPress={() => onOuvrir(t.id)} />
        ))}
      </View>
    </View>
  );
}

export default function WalletDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [wallet, setWallet] = React.useState<LinkedWallet | undefined>();
  const [solde, setSolde] = React.useState<number | undefined>();
  const [operations, setOperations] = React.useState<PaymentTransaction[]>([]);
  const [chargement, setChargement] = React.useState(true);

  useFocusEffect(
    React.useCallback(() => {
      setChargement(true);
      Promise.all([getWallet(id), getTransactions(), getWalletBalance(id)])
        .then(([p, toutes, s]) => {
          setWallet(p);
          setSolde(s);
          setOperations(toutes.filter(t => t.sourceWalletId === id).slice(0, 6));
        })
        .finally(() => setChargement(false));
    }, [id]),
  );

  if (chargement) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-black">
        <FocusAwareStatusBar />
        <ActivityIndicator />
      </View>
    );
  }

  if (!wallet) {
    return (
      <View className="flex-1 items-center justify-center bg-white px-8 dark:bg-black">
        <FocusAwareStatusBar />
        <Text className="text-center text-base text-neutral-500 dark:text-neutral-400">
          Ce portefeuille n'existe plus.
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white dark:bg-black">
      <FocusAwareStatusBar />
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 12,
          paddingBottom: insets.bottom + 32,
        }}
      >
        {/* La carte, en haut : on reconnait son compte avant de lire quoi que ce soit. */}
        <View className="px-5">
          <WalletCard wallet={wallet} soldeFcfa={solde} pleineLargeur />
        </View>

        <Operations
          operations={operations}
          onOuvrir={id2 => router.push({ pathname: '/(app)/history/[id]', params: { id: id2 } })}
        />

        <View className="mt-8 px-5">
          <Text className="mb-1 text-xs font-semibold tracking-wide text-neutral-400 uppercase dark:text-neutral-500">
            Informations
          </Text>
          <LigneInfo libelle="Numéro" valeur={masquerNumero(wallet.phoneNumber)} />
          <LigneInfo libelle="Relié le" valeur={formatFullDate(wallet.linkedAt)} />
          <LigneInfo libelle="Statut" valeur={STATUTS[wallet.status]} />
        </View>

        <View className="mt-8 px-5">
          {!wallet.isDefault
            ? (
                <Action
                  libelle="Utiliser par défaut pour payer"
                  onPress={() =>
                    router.push({ pathname: '/(app)/wallets/set-default', params: { id: wallet.id } })}
                />
              )
            : null}
          <Action
            libelle="Retirer ce portefeuille"
            danger
            onPress={() =>
              router.push({ pathname: '/(app)/wallets/remove', params: { id: wallet.id } })}
          />
        </View>
      </ScrollView>
    </View>
  );
}
