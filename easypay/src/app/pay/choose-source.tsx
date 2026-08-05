import type { LinkedWallet } from '@/core/wallet-engine/types';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { formatAmount } from '@/components/transaction-format';
import {
  ActivityIndicator,
  Button,
  FocusAwareStatusBar,
  Text,
  View,
} from '@/components/ui';
import { WalletCard } from '@/components/wallet-card';
import { computeCommission, getWalletBalance } from '@/core/wallet-engine/mockBackend';
import { usePaymentDraftStore } from '@/core/wallet-engine/paymentDraftStore';
import { getWallets } from '@/storage/walletsState';

/**
 * CHOIX DU PORTEFEUILLE — porté depuis BlueWallet `screen/wallets/SelectWallet.tsx`
 * (licence MIT, voir LICENSE-BLUEWALLET).
 *
 * Le donneur présente les portefeuilles sous forme de VRAIES CARTES, avec leur
 * solde, pas sous forme de lignes de liste. C'est la bonne décision : on choisit
 * un moyen de paiement comme on choisit une carte dans son portefeuille, en la
 * reconnaissant. Une liste de textes oblige à lire.
 *
 * TROIS DÉFAUTS D'ETAT.md § 9.4 CORRIGÉS ICI :
 *   - « Wave · Wave » : le surnom reprenait le nom de l'opérateur, affiché deux
 *     fois. La carte n'affiche plus qu'un seul nom ;
 *   - LE MONTANT À PAYER N'ÉTAIT PLUS VISIBLE au moment de choisir avec quoi
 *     payer. Il est maintenant rappelé en tête ;
 *   - aucun solde n'était affiché, alors que c'est justement l'information qui
 *     permet de choisir.
 *
 * Et un portefeuille dont le solde ne couvre pas le total est marqué comme tel
 * AVANT le paiement, plutôt que de laisser aller jusqu'à l'échec.
 */
export default function ChooseSourceScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const amountFcfa = usePaymentDraftStore(s => s.amountFcfa);
  const setSourceWallet = usePaymentDraftStore(s => s.setSourceWallet);
  const setCommission = usePaymentDraftStore(s => s.setCommission);

  const [wallets, setWallets] = React.useState<LinkedWallet[] | undefined>();
  const [soldes, setSoldes] = React.useState<Record<string, number>>({});

  React.useEffect(() => {
    getWallets().then(async (w) => {
      setWallets(w);
      const paires = await Promise.all(
        w.map(async p => [p.id, await getWalletBalance(p.id)] as const),
      );
      setSoldes(Object.fromEntries(paires));
    });
  }, []);

  const montant = amountFcfa ?? 0;
  const commission = computeCommission(montant);
  const total = montant + commission;

  function choisir(wallet: LinkedWallet) {
    setSourceWallet(wallet);
    setCommission(commission);
    router.push('/pay/recap');
  }

  if (!wallets) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-black">
        <FocusAwareStatusBar />
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (wallets.length === 0) {
    return (
      <View className="flex-1 items-center justify-center bg-white px-8 dark:bg-black">
        <FocusAwareStatusBar />
        <Text className="text-center text-lg font-bold">Aucun portefeuille relié</Text>
        <Text className="mt-2 text-center text-base text-neutral-500 dark:text-neutral-400">
          Relie Wave, Orange Money ou un autre compte pour pouvoir payer.
        </Text>
        <Button
          label="Ajouter un portefeuille"
          onPress={() => router.push('/(app)/wallets/add')}
          className="mt-8 w-full"
          testID="choose-source-add-wallet-button"
        />
      </View>
    );
  }

  const tries = [...wallets].sort((a, b) => Number(b.isDefault) - Number(a.isDefault));

  return (
    <View className="flex-1 bg-white dark:bg-black">
      <FocusAwareStatusBar />

      {/* Le montant reste sous les yeux pendant qu'on choisit. */}
      <View style={{ paddingTop: insets.top + 8 }} className="px-5 pb-4">
        <Text className="text-2xl font-bold">Payer avec quoi ?</Text>
        <Text className="mt-1 text-base text-neutral-500 dark:text-neutral-400">
          {`${formatAmount(total)} FCFA seront débités (dont ${formatAmount(commission)} de commission).`}
        </Text>
      </View>

      <ScrollView
        className="flex-1 px-5"
        contentContainerStyle={{ paddingBottom: insets.bottom + 24, gap: 14 }}
      >
        {tries.map((wallet) => {
          const solde = soldes[wallet.id];
          const insuffisant = solde !== undefined && solde < total;
          return (
            <View key={wallet.id}>
              <WalletCard
                wallet={wallet}
                soldeFcfa={solde}
                pleineLargeur
                onPress={() => choisir(wallet)}
              />
              {insuffisant
                ? (
                    <Text className="mt-1.5 text-sm font-semibold text-warning-600">
                      Solde insuffisant pour ce paiement
                    </Text>
                  )
                : null}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}
