import { useRouter } from 'expo-router';
import * as React from 'react';

import { formatAmount } from '@/components/transaction-format';
import {
  Button,
  FocusAwareStatusBar,
  Pressable,
  ScrollView,
  Text,
  View,
} from '@/components/ui';
import { couleurOperateur } from '@/components/ui/theme';
import { getOperator } from '@/core/wallet-engine/operators';
import { usePaymentDraftStore } from '@/core/wallet-engine/paymentDraftStore';

/**
 * ============================================================================
 * RÉCAPITULATIF AVANT PAIEMENT — porté depuis BlueWallet (licence MIT)
 * ============================================================================
 *
 * Origine : `screen/send/Confirm.tsx`. Licence MIT, voir LICENSE-BLUEWALLET.
 *
 * COMPOSITION REPRISE DU DONNEUR :
 *   le MONTANT en très gros tout en haut, puis À QUI, puis les lignes de
 *   détail à plat, le TOTAL détaché en gras, et le bouton de confirmation
 *   ancré en bas. C'est l'ordre dans lequel on relit un paiement avant de
 *   le valider : combien, à qui, avec quoi, et combien ça me coûte vraiment.
 *
 * RETIRÉ : frais de réseau en sat/vB, choix de la vitesse de confirmation,
 * adresse de change, sélection d'UTXO.
 *
 * GREFFÉ : la commission EasyPay, l'opérateur payeur avec sa couleur.
 *
 * DEUX DÉFAUTS CORRIGÉS ICI
 * -------------------------
 * § 9.2 — cet écran affichait un rond qui tourne À L'INFINI quand le panier
 *         était incomplet. Sans issue, sans explication, sans bouton retour :
 *         le paiement était simplement impossible et l'utilisateur coincé.
 *         Un panier incomplet affiche maintenant ce qui manque et propose de
 *         repartir. Un écran d'attente sans sortie est un écran cassé.
 * § 9.4 — l'écran annonçait « Total débité = montant + frais » alors que la
 *         vérification du solde ne portait que sur le montant. Corrigé dans
 *         `mockBackend.initiatePayment`, qui compare désormais le TOTAL.
 */

function LigneInfo({
  libelle,
  valeur,
  fort = false,
  detache = false,
}: {
  libelle: string;
  valeur: string;
  fort?: boolean;
  detache?: boolean;
}) {
  return (
    <View
      className={
        detache
          ? 'mt-2 flex-row items-center justify-between border-t border-neutral-200 pt-4 dark:border-neutral-700'
          : 'flex-row items-center justify-between border-b border-neutral-100 py-4 dark:border-neutral-800'
      }
    >
      <Text className="text-sm text-neutral-500 dark:text-neutral-400">{libelle}</Text>
      <Text className={fort ? 'text-lg font-bold' : 'text-[15px] font-medium'}>{valeur}</Text>
    </View>
  );
}

export default function RecapScreen() {
  const router = useRouter();
  const qr = usePaymentDraftStore(s => s.qr);
  const amountFcfa = usePaymentDraftStore(s => s.amountFcfa);
  const sourceWallet = usePaymentDraftStore(s => s.sourceWallet);
  const commission = usePaymentDraftStore(s => s.commission);

  // Panier incomplet : on le DIT, on ne fait pas tourner un rond sans fin.
  if (amountFcfa === undefined || !sourceWallet) {
    const manque = amountFcfa === undefined ? 'le montant' : 'le portefeuille à débiter';
    return (
      <View className="flex-1 items-center justify-center bg-white px-8 dark:bg-black">
        <FocusAwareStatusBar />
        <Text className="text-center text-lg font-bold">Il manque une information</Text>
        <Text className="mt-2 text-center text-base text-neutral-500 dark:text-neutral-400">
          {`Impossible de préparer ce paiement : ${manque} n'a pas été renseigné.`}
        </Text>
        <Button
          label="Recommencer le paiement"
          onPress={() => router.replace('/(app)')}
          className="mt-8 w-full"
        />
      </View>
    );
  }

  const operateur = getOperator(sourceWallet.operator);
  const couleur = couleurOperateur(sourceWallet.operator);
  const commissionFcfa = commission ?? 0;
  const totalFcfa = amountFcfa + commissionFcfa;
  const commercant = qr?.emvco?.merchantName ?? 'ce commerçant';

  return (
    <View className="flex-1 bg-white dark:bg-black">
      <FocusAwareStatusBar />
      <ScrollView className="flex-1 px-5" contentContainerStyle={{ paddingBottom: 24 }}>
        {/* Combien — la premiere chose qu'on relit */}
        <View className="items-center pt-10 pb-6">
          <Text className="text-sm text-neutral-500 dark:text-neutral-400">Tu vas payer</Text>
          <View className="mt-2 flex-row items-baseline">
            <Text className="text-[44px] leading-[48px] font-bold">{formatAmount(amountFcfa)}</Text>
            <Text className="ml-2 text-xl font-semibold text-neutral-500 dark:text-neutral-400">
              FCFA
            </Text>
          </View>
          <Text className="mt-3 text-lg font-semibold">{commercant}</Text>
        </View>

        {/* Avec quoi */}
        <View className="mb-2 flex-row items-center rounded-2xl bg-neutral-100 p-4 dark:bg-neutral-800">
          <View
            className="mr-3 size-10 items-center justify-center rounded-full"
            style={{ backgroundColor: couleur.fond }}
          >
            <Text style={{ color: couleur.texte, fontWeight: '700' }}>
              {operateur.label.slice(0, 1)}
            </Text>
          </View>
          <View className="flex-1">
            <Text className="text-xs text-neutral-500 dark:text-neutral-400">Débité sur</Text>
            <Text className="text-[15px] font-semibold">{operateur.label}</Text>
          </View>
          <Pressable
            onPress={() => router.push('/pay/choose-source')}
            accessibilityRole="button"
            className="px-2 py-1"
          >
            <Text className="text-sm font-semibold text-primary-600">Changer</Text>
          </Pressable>
        </View>

        <LigneInfo libelle="Montant" valeur={`${formatAmount(amountFcfa)} FCFA`} />
        <LigneInfo
          libelle="Commission EasyPay"
          valeur={`${formatAmount(commissionFcfa)} FCFA`}
        />
        <LigneInfo libelle="Total débité" valeur={`${formatAmount(totalFcfa)} FCFA`} fort detache />
      </ScrollView>

      <View className="border-t border-neutral-100 px-5 pt-4 pb-8 dark:border-neutral-800">
        <Button
          label={`Confirmer · ${formatAmount(totalFcfa)} FCFA`}
          // Passe desormais par le code secret. C'est la promesse faite a
          // l'inscription (« ton code servira a confirmer tes paiements »),
          // qui n'etait tenue nulle part (ETAT.md § 9.3).
          onPress={() => router.push('/pay/confirm-pin')}
          testID="recap-confirm-button"
        />
        <Pressable
          onPress={() => router.replace('/(app)')}
          className="mt-1 items-center py-3"
          accessibilityRole="button"
        >
          <Text className="text-sm font-semibold text-neutral-500 dark:text-neutral-400">
            Annuler
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
