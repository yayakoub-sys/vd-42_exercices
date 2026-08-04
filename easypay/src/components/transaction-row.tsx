import type { PaymentTransaction } from '@/core/wallet-engine/types';
import * as React from 'react';
import { Animated, Easing, Pressable } from 'react-native';

import {
  apparencePourStatut,
  formatAmount,
  formatShortDate,
} from '@/components/transaction-format';
import { Text, View } from '@/components/ui';

/**
 * Ligne de transaction — carrosserie transplantée depuis BlueWallet (MIT),
 * composant `components/TransactionListItem.tsx`.
 *
 * REPRIS du donneur :
 *   - la composition en trois colonnes  [icône] [titre / sous-titre] [montant]
 *   - la ligne PLATE, sans carte encadrée : dans une liste financière, le
 *     cadre de chaque carte ajoute du bruit et casse le balayage vertical
 *   - la hiérarchie typographique : titre 16 / 500, sous-titre 14, montant 15 / 600
 *   - l'état porté par l'icône et la couleur du montant, pas par un badge
 *   - l'animation d'appui : mise à l'échelle 0,97, 120 ms, courbe cubique
 *
 * RETIRÉ (moteur d'origine) : Bitcoin, Lightning, on-chain / off-chain,
 * nombre de confirmations, explorateur de blocs, unités BTC / SATS.
 *
 * GREFFÉ (métier EasyPay) : le commerçant devient le titre, l'opérateur
 * (Wave, Orange Money…) devient le contexte, les montants passent en FCFA
 * avec séparateur de milliers, et les TROIS états réels sont distingués —
 * « fonds insuffisants » n'est plus affiché comme un simple échec.
 */
export function TransactionRow({
  transaction,
  onPress,
}: {
  transaction: PaymentTransaction;
  onPress: () => void;
}) {
  const echelle = React.useRef(new Animated.Value(1)).current;

  const animer = React.useCallback(
    (vers: number) => {
      Animated.timing(echelle, {
        toValue: vers,
        duration: 120,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    },
    [echelle],
  );

  const { cercle, montant, Icone, mention } = apparencePourStatut(transaction.status);
  const titre = transaction.merchantName ?? transaction.merchantProviderLabel;

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => animer(0.97)}
      onPressOut={() => animer(1)}
      accessibilityRole="button"
      accessibilityLabel={`${titre}, ${formatAmount(transaction.amount)} ${transaction.currency}, ${mention ?? 'payé'}`}
    >
      <Animated.View style={{ transform: [{ scale: echelle }] }}>
        <View className="flex-row items-center px-4 py-3">
          {/* Colonne 1 — l'etat, lisible sans lire */}
          <View className={`mr-3 size-10 items-center justify-center rounded-full ${cercle}`}>
            <Icone />
          </View>

          {/* Colonne 2 — qui, et dans quel contexte */}
          <View className="flex-1 pr-2">
            <Text className="text-base font-medium" numberOfLines={1}>
              {titre}
            </Text>
            <Text
              className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400"
              numberOfLines={1}
            >
              {transaction.sourceOperatorLabel}
              {' · '}
              {formatShortDate(transaction.timestamp)}
            </Text>
          </View>

          {/* Colonne 3 — combien */}
          <View className="items-end">
            <Text className={`text-[15px] font-semibold ${montant}`}>
              {formatAmount(transaction.amount)}
              {' '}
              {transaction.currency}
            </Text>
            {mention
              ? (
                  <Text className="mt-0.5 text-xs text-neutral-400 dark:text-neutral-500">
                    {mention}
                  </Text>
                )
              : null}
          </View>
        </View>
      </Animated.View>
    </Pressable>
  );
}
