import { useRouter } from 'expo-router';
import * as React from 'react';

import { PaymentOutcome } from '@/components/payment-outcome';
import { formatAmount } from '@/components/transaction-format';
import { FocusAwareStatusBar } from '@/components/ui';
import { getOperator } from '@/core/wallet-engine/operators';
import { usePaymentDraftStore } from '@/core/wallet-engine/paymentDraftStore';
import { enregistrerEchec } from '@/features/payment/record-failure';
import { useRunOnce } from '@/lib/use-run-once';

/**
 * Solde insuffisant — même mise en scène que les autres issues, en orange :
 * ce n'est ni une réussite ni une panne, c'est une situation que
 * l'utilisateur peut corriger lui-même.
 *
 * CORRIGÉ : l'échec pour solde insuffisant ne laissait aucune trace dans
 * l'historique, et n'affichait ni le montant manquant ni le portefeuille
 * concerné. On dit maintenant COMBIEN il manque : c'est la seule information
 * qui permet d'agir.
 */
export default function InsufficientFundsScreen() {
  const router = useRouter();
  const reset = usePaymentDraftStore(s => s.reset);
  const [snapshot] = React.useState(() => usePaymentDraftStore.getState());
  const { amountFcfa, sourceWallet, commission } = snapshot;

  useRunOnce(() => {
    enregistrerEchec(snapshot, 'insufficient_funds');
    reset();
  });

  const total = (amountFcfa ?? 0) + (commission ?? 0);
  const operateur = sourceWallet ? getOperator(sourceWallet.operator).label : undefined;

  return (
    <>
      <FocusAwareStatusBar />
      <PaymentOutcome
        issue="solde"
        montantFcfa={amountFcfa}
        message={
          operateur
            ? `Ton compte ${operateur} ne couvre pas ce paiement. Rien n'a été débité.`
            : 'Ce portefeuille ne couvre pas ce paiement. Rien n\'a été débité.'
        }
        details={[
          { libelle: 'Total nécessaire', valeur: `${formatAmount(total)} FCFA` },
          operateur ? { libelle: 'Portefeuille', valeur: operateur } : undefined,
          { libelle: 'Débité', valeur: '0 FCFA' },
        ].filter(Boolean) as { libelle: string; valeur: string }[]}
        libelleBouton="Payer avec un autre portefeuille"
        onBouton={() => router.replace('/pay/choose-source')}
        libelleSecondaire="Abandonner ce paiement"
        onSecondaire={() => router.replace('/(app)')}
      />
    </>
  );
}
