import { useRouter } from 'expo-router';
import * as React from 'react';

import { PaymentOutcome } from '@/components/payment-outcome';
import { FocusAwareStatusBar } from '@/components/ui';
import { usePaymentDraftStore } from '@/core/wallet-engine/paymentDraftStore';

const APERCU_MAX = 90;

/**
 * QR non reconnu — même mise en scène que les autres issues (PaymentOutcome),
 * pour que l'utilisateur reconnaisse immédiatement « il s'est passé quelque
 * chose, ce n'est pas passé ».
 *
 * GREFFÉ : deux sorties au lieu d'une. Le QR d'un commerçant peut être
 * illisible pour de bonnes raisons (code d'un autre pays, lien publicitaire) ;
 * proposer de coller le code à la main évite de laisser l'utilisateur bloqué
 * devant une caisse.
 */
export default function UnrecognizedScreen() {
  const router = useRouter();
  const qr = usePaymentDraftStore(s => s.qr);

  const brut = qr?.raw ?? '';
  const apercu = brut.length > APERCU_MAX ? `${brut.slice(0, APERCU_MAX)}…` : brut;

  return (
    <>
      <FocusAwareStatusBar />
      <PaymentOutcome
        issue="echec"
        message="Ce code n'est pas un QR de paiement. Rien n'a été débité."
        details={apercu ? [{ libelle: 'Ce qui a été lu', valeur: apercu }] : []}
        libelleBouton="Scanner à nouveau"
        onBouton={() => router.replace('/(app)')}
        libelleSecondaire="Saisir le code à la main"
        onSecondaire={() => router.replace('/pay/manual-entry')}
      />
    </>
  );
}
