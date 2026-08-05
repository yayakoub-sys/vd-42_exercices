import { useRouter } from 'expo-router';
import * as React from 'react';

import { formatAmount } from '@/components/transaction-format';
import { FocusAwareStatusBar, View } from '@/components/ui';
import { usePaymentDraftStore } from '@/core/wallet-engine/paymentDraftStore';
import { PinPad } from '@/features/auth/pin-pad';
import { verifyPin } from '@/storage/authState';

/**
 * Confirmation du paiement par le code secret.
 *
 * C'est l'écran qui manquait. `verifyPin` existait dans le code depuis le
 * début et n'était appelée NULLE PART (ETAT.md § 9.3), alors que deux écrans
 * d'inscription promettaient explicitement à l'utilisateur que son code lui
 * serait demandé avant chaque paiement.
 *
 * Il s'intercale entre le récapitulatif et l'exécution : on ne débite rien
 * tant que le code n'est pas bon.
 */
export default function ConfirmPinScreen() {
  const router = useRouter();
  const amountFcfa = usePaymentDraftStore(s => s.amountFcfa);
  const commission = usePaymentDraftStore(s => s.commission);
  const qr = usePaymentDraftStore(s => s.qr);

  const total = (amountFcfa ?? 0) + (commission ?? 0);
  const commercant = qr?.emvco?.merchantName;

  const valider = React.useCallback(
    async (code: string) => {
      const ok = await verifyPin(code);
      if (ok)
        router.replace('/pay/redirect');
      return ok;
    },
    [router],
  );

  return (
    <View className="flex-1 bg-white dark:bg-black">
      <FocusAwareStatusBar />
      <PinPad
        titre="Confirme avec ton code"
        sousTitre={
          amountFcfa === undefined
            ? 'Saisis ton code secret à 4 chiffres.'
            : `${formatAmount(total)} FCFA${commercant ? ` à ${commercant}` : ''}`
        }
        onValider={valider}
      />
    </View>
  );
}
