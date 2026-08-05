import { useRouter } from 'expo-router';
import * as React from 'react';
import { Animated, Easing } from 'react-native';

import { formatAmount } from '@/components/transaction-format';
import { Button, FocusAwareStatusBar, Text, View } from '@/components/ui';
import { initiatePayment } from '@/core/wallet-engine/mockBackend';
import { usePaymentDraftStore } from '@/core/wallet-engine/paymentDraftStore';

/**
 * Attente de confirmation — portée de BlueWallet `screen/send/Confirm.tsx`
 * (état d'envoi en cours) et `TransactionPendingIconBig.tsx`.
 *
 * Le donneur affiche une pastille qui PULSE, pas un rond qui tourne : sur une
 * opération d'argent, une pulsation dit « ça avance », un rond qui tourne dit
 * « c'est peut-être bloqué ». Et il rappelle le montant en cours, pour que
 * l'utilisateur sache exactement ce qui se joue.
 *
 * CORRIGÉ (ETAT.md § 9.2, effet en cascade)
 * -----------------------------------------
 * Cet écran lançait `initiatePayment({ amountFcfa: amountFcfa ?? 0 })`.
 * Quand le montant manquait, il ne s'arrêtait pas : il déclenchait un
 * paiement de ZÉRO FRANC, qui « réussissait », et enregistrait une
 * transaction fantôme à 0 FCFA dans l'historique. Un montant manquant est
 * maintenant une erreur affichée, pas un paiement à zéro.
 */
export default function WaitingScreen() {
  const router = useRouter();
  const amountFcfa = usePaymentDraftStore(s => s.amountFcfa);
  const setCommission = usePaymentDraftStore(s => s.setCommission);
  const pulsation = React.useRef(new Animated.Value(0)).current;

  const montantManquant = amountFcfa === undefined || amountFcfa <= 0;

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulsation, {
          toValue: 1,
          duration: 900,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulsation, {
          toValue: 0,
          duration: 900,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [pulsation]);

  React.useEffect(() => {
    // Ne JAMAIS lancer un paiement sans montant : cela creait une transaction
    // fantome a 0 FCFA qui se declarait reussie.
    if (montantManquant)
      return;

    let annule = false;
    initiatePayment({ amountFcfa: amountFcfa as number }).then((resultat) => {
      if (annule)
        return;
      setCommission(resultat.commission);
      if (resultat.success)
        router.replace('/pay/success');
      else if (resultat.reason === 'insufficient_funds')
        router.replace('/pay/insufficient-funds');
      else router.replace('/pay/fail');
    });
    return () => {
      annule = true;
    };
  }, [amountFcfa, montantManquant, router, setCommission]);

  if (montantManquant) {
    return (
      <View className="flex-1 items-center justify-center bg-white px-8 dark:bg-black">
        <FocusAwareStatusBar />
        <Text className="text-center text-lg font-bold">Paiement impossible</Text>
        <Text className="mt-2 text-center text-base text-neutral-500 dark:text-neutral-400">
          Le montant à payer n'a pas été transmis. Rien n'a été débité.
        </Text>
        <Button
          label="Recommencer"
          onPress={() => router.replace('/(app)')}
          className="mt-8 w-full"
        />
      </View>
    );
  }

  const echelle = pulsation.interpolate({ inputRange: [0, 1], outputRange: [1, 1.18] });
  const opacite = pulsation.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.08] });

  return (
    <View className="flex-1 items-center justify-center bg-white px-8 dark:bg-black">
      <FocusAwareStatusBar />

      <View className="size-32 items-center justify-center">
        <Animated.View
          className="absolute size-32 rounded-full bg-primary-600"
          style={{ transform: [{ scale: echelle }], opacity: opacite }}
        />
        <View className="size-16 rounded-full bg-primary-800" />
      </View>

      <Text className="mt-10 text-center text-xl font-bold">Paiement en cours</Text>
      <Text className="mt-2 text-center text-base text-neutral-500 dark:text-neutral-400">
        {`${formatAmount(amountFcfa as number)} FCFA · on attend la confirmation de ton opérateur.`}
      </Text>
      <Text className="mt-6 text-center text-sm text-neutral-400 dark:text-neutral-500">
        Ne ferme pas l'application.
      </Text>
    </View>
  );
}
