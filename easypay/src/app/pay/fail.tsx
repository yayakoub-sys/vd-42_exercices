import { useRouter } from 'expo-router';
import * as React from 'react';

import { PaymentOutcome } from '@/components/payment-outcome';
import { formatAmount } from '@/components/transaction-format';
import { FocusAwareStatusBar } from '@/components/ui';
import { usePaymentDraftStore } from '@/core/wallet-engine/paymentDraftStore';
import { enregistrerEchec } from '@/features/payment/record-failure';
import { useRunOnce } from '@/lib/use-run-once';

/**
 * Paiement refusé — même mise en scène que la réussite (PaymentOutcome),
 * portée de BlueWallet `screen/send/success.tsx`.
 *
 * CORRIGÉ : un paiement échoué ne laissait AUCUNE TRACE dans l'historique.
 * Il n'existait nulle part, alors que c'est justement ce qu'on cherche à
 * relire quand on se demande « est-ce que ça a été débité ou pas ? ».
 */
export default function FailScreen() {
  const router = useRouter();
  const reset = usePaymentDraftStore(s => s.reset);
  const [snapshot] = React.useState(() => usePaymentDraftStore.getState());
  const { amountFcfa, commission } = snapshot;

  useRunOnce(() => {
    enregistrerEchec(snapshot, 'failed');
    reset();
  });

  return (
    <>
      <FocusAwareStatusBar />
      <PaymentOutcome
        issue="echec"
        montantFcfa={amountFcfa}
        message="Ton opérateur n'a pas confirmé le paiement. Rien n'a été débité."
        details={
          amountFcfa === undefined
            ? []
            : [
                { libelle: 'Montant tenté', valeur: `${formatAmount(amountFcfa)} FCFA` },
                { libelle: 'Débité', valeur: '0 FCFA' },
                {
                  libelle: 'Commission',
                  valeur: `${formatAmount(commission ?? 0)} FCFA — non prélevée`,
                },
              ]
        }
        libelleBouton="Réessayer"
        onBouton={() => router.replace('/pay/choose-source')}
        libelleSecondaire="Abandonner ce paiement"
        onSecondaire={() => router.replace('/(app)')}
      />
    </>
  );
}
