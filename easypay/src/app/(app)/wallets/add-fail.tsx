import { useRouter } from 'expo-router';
import * as React from 'react';

import { PaymentOutcome } from '@/components/payment-outcome';
import { FocusAwareStatusBar } from '@/components/ui';

/**
 * Liaison refusée — même mise en scène que les autres fins de parcours.
 *
 * GREFFÉ : on dit ce qu'il faut vérifier. « Impossible de confirmer » sans
 * indication laisse l'utilisateur relancer la même chose à l'identique.
 */
export default function AddWalletFailScreen() {
  const router = useRouter();

  return (
    <>
      <FocusAwareStatusBar />
      <PaymentOutcome
        issue="echec"
        titre="Compte non relié"
        message="Ton opérateur n'a pas confirmé. Vérifie que le numéro est bien celui de ce compte mobile money, et qu'il est actif."
        libelleBouton="Réessayer"
        onBouton={() => router.replace('/(app)/wallets/add')}
        libelleSecondaire="Revenir à mes portefeuilles"
        onSecondaire={() => router.replace('/(app)/wallets/')}
      />
    </>
  );
}
