import type { OperatorId } from '@/core/wallet-engine/types';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as React from 'react';

import { PaymentOutcome } from '@/components/payment-outcome';
import { FocusAwareStatusBar } from '@/components/ui';
import { OPERATORS } from '@/core/wallet-engine/operators';

/**
 * Portefeuille relié — réutilise la mise en scène de résultat portée de
 * BlueWallet (`screen/send/success.tsx`, licence MIT), pour que toutes les
 * fins de parcours d'EasyPay se ressemblent.
 *
 * Le signe est DESSINÉ, plus un caractère « ✓ » : un emoji change d'aspect
 * selon le téléphone et casse l'alignement.
 */
export default function AddWalletSuccessScreen() {
  const router = useRouter();
  const { operator } = useLocalSearchParams<{ operator: OperatorId }>();
  const info = OPERATORS[operator];

  return (
    <>
      <FocusAwareStatusBar />
      <PaymentOutcome
        issue="succes"
        titre={`${info?.label ?? 'Portefeuille'} relié`}
        message="Tu peux maintenant payer avec ce compte. Tu le retrouveras sur ton tableau de bord."
        libelleBouton="Voir mes portefeuilles"
        onBouton={() => router.replace('/(app)/wallets/')}
        libelleSecondaire="Relier un autre compte"
        onSecondaire={() => router.replace('/(app)/wallets/add')}
      />
    </>
  );
}
