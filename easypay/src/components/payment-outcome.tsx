import * as React from 'react';
import Svg, { Path } from 'react-native-svg';

import { formatAmount } from '@/components/transaction-format';
import { Button, Pressable, ScrollView, Text, View } from '@/components/ui';

/**
 * RÉSULTAT D'UN PAIEMENT — porté depuis BlueWallet `screen/send/success.tsx`
 * et `components/BlueBigCheckmark.tsx` (licence MIT, voir LICENSE-BLUEWALLET).
 *
 * CE QU'ON REPREND :
 *   une GRANDE pastille colorée avec un signe dessiné (pas un emoji), le
 *   montant juste dessous, puis le détail, et un seul bouton clair en bas.
 *   Sur un écran de résultat, l'utilisateur doit comprendre en un dixième de
 *   seconde si c'est passé ou non — avant même de lire un mot.
 *
 * Le même composant sert aux trois issues : réussi, refusé, solde
 * insuffisant. Trois écrans qui se ressemblent rassurent ; trois écrans
 * dessinés séparément finissent toujours par diverger.
 */

export type Issue = 'succes' | 'echec' | 'solde';

const APPARENCES = {
  succes: { cercle: 'bg-success-600', titre: 'Paiement réussi' },
  echec: { cercle: 'bg-danger-600', titre: 'Paiement refusé' },
  solde: { cercle: 'bg-warning-500', titre: 'Solde insuffisant' },
} as const;

function Signe({ issue }: { issue: Issue }) {
  const d
    = issue === 'succes'
      ? 'M5 12.5 10 17.5 19 7'
      : issue === 'echec'
        ? 'M6 6l12 12M18 6L6 18'
        : 'M12 6v7M12 17.5h.01';
  return (
    <Svg width={44} height={44} viewBox="0 0 24 24" fill="none">
      <Path
        d={d}
        stroke="#FFFFFF"
        strokeWidth={2.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function Ligne({ libelle, valeur }: { libelle: string; valeur: string }) {
  return (
    <View className="flex-row items-start justify-between border-b border-neutral-100 py-4 dark:border-neutral-800">
      <Text className="pr-4 text-sm text-neutral-500 dark:text-neutral-400">{libelle}</Text>
      <Text className="flex-1 text-right text-[15px] font-medium">{valeur}</Text>
    </View>
  );
}

export function PaymentOutcome({
  issue,
  titre: titrePersonnalise,
  montantFcfa,
  message,
  details = [],
  libelleBouton,
  onBouton,
  libelleSecondaire,
  onSecondaire,
}: {
  issue: Issue;
  /** Remplace le titre par défaut — le même composant sert aussi hors paiement. */
  titre?: string;
  montantFcfa?: number;
  message?: string;
  details?: { libelle: string; valeur: string }[];
  libelleBouton: string;
  onBouton: () => void;
  libelleSecondaire?: string;
  onSecondaire?: () => void;
}) {
  const { cercle, titre: titreParDefaut } = APPARENCES[issue];
  const titre = titrePersonnalise ?? titreParDefaut;

  return (
    <View className="flex-1 bg-white dark:bg-black">
      <ScrollView className="flex-1 px-5" contentContainerStyle={{ paddingBottom: 24 }}>
        <View className="items-center pt-14 pb-6">
          <View className={`size-20 items-center justify-center rounded-full ${cercle}`}>
            <Signe issue={issue} />
          </View>

          <Text className="mt-6 text-2xl font-bold">{titre}</Text>

          {montantFcfa !== undefined
            ? (
                <View className="mt-3 flex-row items-baseline">
                  <Text className="text-[38px] leading-[42px] font-bold">
                    {formatAmount(montantFcfa)}
                  </Text>
                  <Text className="ml-2 text-lg font-semibold text-neutral-500 dark:text-neutral-400">
                    FCFA
                  </Text>
                </View>
              )
            : null}

          {message
            ? (
                <Text className="mt-3 px-4 text-center text-base text-neutral-500 dark:text-neutral-400">
                  {message}
                </Text>
              )
            : null}
        </View>

        {details.map(d => (
          <Ligne key={d.libelle} libelle={d.libelle} valeur={d.valeur} />
        ))}
      </ScrollView>

      <View className="px-5 pt-4 pb-8">
        <Button label={libelleBouton} onPress={onBouton} testID="outcome-primary-button" />
        {libelleSecondaire && onSecondaire
          ? (
              <Pressable
                onPress={onSecondaire}
                className="mt-1 items-center py-3"
                accessibilityRole="button"
              >
                <Text className="text-sm font-semibold text-primary-600">
                  {libelleSecondaire}
                </Text>
              </Pressable>
            )
          : null}
      </View>
    </View>
  );
}
