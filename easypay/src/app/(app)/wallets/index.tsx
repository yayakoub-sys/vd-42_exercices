import type { LinkedWallet, PaymentTransaction } from '@/core/wallet-engine/types';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import * as React from 'react';

import { ScrollView, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { formatAmount } from '@/components/transaction-format';
import { TransactionRow } from '@/components/transaction-row';
import {
  ActivityIndicator,
  FocusAwareStatusBar,
  Text,
  TouchableOpacity,
  View,
} from '@/components/ui';
import { ScanIcon } from '@/components/ui/icons/tabs';
import {
  CARROUSEL_MARGE_BAS,
  CARROUSEL_MARGE_HAUT,
  largeurCarte,
  WalletCard,
} from '@/components/wallet-card';
import { getWalletBalance } from '@/core/wallet-engine/mockBackend';
import { getTransactions } from '@/storage/transactionsState';
import { getWallets } from '@/storage/walletsState';

/**
 * ============================================================================
 * DASHBOARD — porté depuis BlueWallet (licence MIT)
 * ============================================================================
 *
 * Origine : `screen/wallets/WalletsList.tsx`, `components/WalletsCarousel.tsx`
 * et `components/TotalWalletsBalance.tsx`.
 * Licence : MIT, voir `easypay/LICENSE-BLUEWALLET`.
 *
 * LA STRUCTURE EST CELLE DU DONNEUR, dans cet ordre exact :
 *   1. le TOTAL en très gros, tout en haut — la première question de
 *      l'utilisateur est toujours « combien j'ai » ;
 *   2. le CARROUSEL HORIZONTAL de cartes — on fait défiler ses comptes du
 *      pouce, on ne lit pas une liste ;
 *   3. les DERNIÈRES OPÉRATIONS juste en dessous, sans quitter l'écran.
 *
 * RETIRÉ : « importer une phrase de récupération », le total en BTC et sa
 * conversion de cours, les portefeuilles watch-only et multisig.
 *
 * GREFFÉ :
 *   le bouton SCANNER en évidence — c'est le geste numéro un d'EasyPay, il ne
 *   doit pas être caché dans un onglet ;
 *   les soldes, qui n'étaient affichés NULLE PART (ETAT.md § 9.4) ;
 *   un seul titre : l'écran affichait « Mes portefeuilles » DEUX FOIS, dans la
 *   barre du haut et dans la page (ETAT.md § 9.4).
 */

const DERNIERES_OPERATIONS = 4;

/** Le total : la premiere question de l'utilisateur, « combien j'ai ». */
function Total({ total, nbPortefeuilles }: { total: number; nbPortefeuilles: number }) {
  return (
    <View className="px-5 pb-1">
      <Text className="text-sm text-neutral-500 dark:text-neutral-400">Total disponible</Text>
      <View className="mt-1 flex-row items-baseline">
        <Text className="text-[40px] leading-[44px] font-bold">{formatAmount(total)}</Text>
        <Text className="ml-2 text-lg font-semibold text-neutral-500 dark:text-neutral-400">
          FCFA
        </Text>
      </View>
      <Text className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">
        {nbPortefeuilles === 0
          ? 'Aucun portefeuille relié'
          : `${nbPortefeuilles} portefeuille${nbPortefeuilles > 1 ? 's' : ''} relié${nbPortefeuilles > 1 ? 's' : ''}`}
      </Text>
    </View>
  );
}

function Carrousel({
  wallets,
  soldes,
  pas,
  onOuvrir,
}: {
  wallets: LinkedWallet[];
  soldes: Record<string, number>;
  pas: number;
  onOuvrir: (id: string) => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{
        paddingLeft: 20,
        paddingTop: CARROUSEL_MARGE_HAUT,
        paddingBottom: CARROUSEL_MARGE_BAS,
      }}
      snapToInterval={pas}
      decelerationRate="fast"
    >
      {wallets.map(p => (
        <WalletCard
          key={p.id}
          wallet={p}
          soldeFcfa={soldes[p.id]}
          onPress={() => onOuvrir(p.id)}
        />
      ))}
    </ScrollView>
  );
}

function DernieresOperations({
  operations,
  onOuvrir,
  onToutVoir,
}: {
  operations: PaymentTransaction[];
  onOuvrir: (id: string) => void;
  onToutVoir: () => void;
}) {
  if (operations.length === 0)
    return null;
  return (
    <View>
      <View className="mt-2 flex-row items-center justify-between px-5">
        <Text className="text-lg font-bold">Dernières opérations</Text>
        <TouchableOpacity onPress={onToutVoir} accessibilityRole="button">
          <Text className="text-sm font-semibold text-primary-600">Tout voir</Text>
        </TouchableOpacity>
      </View>
      <View className="mt-1">
        {operations.map(t => (
          <TransactionRow key={t.id} transaction={t} onPress={() => onOuvrir(t.id)} />
        ))}
      </View>
    </View>
  );
}

function SansPortefeuille() {
  return (
    <View className="mx-5 mt-3 items-center rounded-2xl bg-neutral-100 px-6 py-8 dark:bg-neutral-800">
      <Text className="text-center text-base font-semibold">
        Relie ton premier portefeuille
      </Text>
      <Text className="mt-2 text-center text-sm text-neutral-500 dark:text-neutral-400">
        Wave, Orange Money, MTN… pour pouvoir payer un commerçant.
      </Text>
    </View>
  );
}

export default function DashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const [wallets, setWallets] = React.useState<LinkedWallet[]>([]);
  const [soldes, setSoldes] = React.useState<Record<string, number>>({});
  const [transactions, setTransactions] = React.useState<PaymentTransaction[]>([]);
  const [chargement, setChargement] = React.useState(true);

  const charger = React.useCallback(() => {
    setChargement(true);
    Promise.all([getWallets(), getTransactions()])
      .then(async ([w, t]) => {
        setWallets(w);
        setTransactions(t);
        const paires = await Promise.all(
          w.map(async p => [p.id, await getWalletBalance(p.id)] as const),
        );
        setSoldes(Object.fromEntries(paires));
      })
      .finally(() => setChargement(false));
  }, []);

  useFocusEffect(React.useCallback(() => charger(), [charger]));

  const total = React.useMemo(
    () => Object.values(soldes).reduce((s, v) => s + v, 0),
    [soldes],
  );
  const recentes = transactions.slice(0, DERNIERES_OPERATIONS);
  const pas = largeurCarte(width) + 20;

  if (chargement) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-black">
        <FocusAwareStatusBar />
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white dark:bg-black">
      <FocusAwareStatusBar />
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: insets.bottom + 32 }}
        showsVerticalScrollIndicator={false}
      >
        <Total total={total} nbPortefeuilles={wallets.length} />

        {/* 2 — Le geste numero un d'EasyPay, en evidence */}
        <View className="mt-5 px-5">
          <TouchableOpacity
            onPress={() => router.push('/(app)/')}
            className="flex-row items-center justify-center rounded-2xl bg-primary-800 py-4"
            accessibilityRole="button"
            accessibilityLabel="Scanner un QR de paiement"
          >
            <ScanIcon color="#FFFFFF" width={22} height={22} />
            <Text className="ml-3 text-base font-bold text-white">
              Scanner un QR de paiement
            </Text>
          </TouchableOpacity>
        </View>

        {/* 3 — Le carrousel de cartes */}
        <View className="mt-6 flex-row items-center justify-between px-5">
          <Text className="text-lg font-bold">Mes portefeuilles</Text>
          <TouchableOpacity
            onPress={() => router.push('/(app)/wallets/add')}
            accessibilityRole="button"
          >
            <Text className="text-sm font-semibold text-primary-600">+ Ajouter</Text>
          </TouchableOpacity>
        </View>

        {wallets.length === 0
          ? <SansPortefeuille />
          : (
              <Carrousel
                wallets={wallets}
                soldes={soldes}
                pas={pas}
                onOuvrir={id => router.push({ pathname: '/(app)/wallets/[id]', params: { id } })}
              />
            )}

        {/* 4 — Les dernieres operations, sans quitter l'ecran */}
        <DernieresOperations
          operations={recentes}
          onOuvrir={id => router.push({ pathname: '/(app)/history/[id]', params: { id } })}
          onToutVoir={() => router.push('/(app)/history')}
        />
      </ScrollView>
    </View>
  );
}
