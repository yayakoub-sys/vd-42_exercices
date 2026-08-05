import type { PaymentTransaction } from '@/core/wallet-engine/types';
import { useRouter } from 'expo-router';
import * as React from 'react';

import { PaymentOutcome } from '@/components/payment-outcome';
import { formatAmount, formatFullDate } from '@/components/transaction-format';
import { FocusAwareStatusBar } from '@/components/ui';
import { resolveProvider } from '@/core/providers/registry';
import { getOperator } from '@/core/wallet-engine/operators';
import { usePaymentDraftStore } from '@/core/wallet-engine/paymentDraftStore';
import { useRunOnce } from '@/lib/use-run-once';
import { addTransaction } from '@/storage/transactionsState';

/**
 * Paiement réussi — mise en scène portée de BlueWallet `screen/send/success.tsx`
 * (licence MIT). Grande pastille, montant, détail, un seul bouton.
 *
 * GREFFÉ : un accès direct au reçu. Le donneur renvoyait vers l'explorateur de
 * blocs ; ici, l'équivalent utile est le reçu, qu'on peut partager au
 * commerçant s'il conteste.
 */
export default function SuccessScreen() {
  const router = useRouter();
  const reset = usePaymentDraftStore(s => s.reset);
  // Photo instantanee du panier au montage : `reset()` va le vider juste apres.
  const [snapshot] = React.useState(() => usePaymentDraftStore.getState());
  const { qr, amountFcfa, sourceWallet, commission } = snapshot;
  const [idTransaction, setIdTransaction] = React.useState<string | undefined>();
  const [horodatage] = React.useState(() => Date.now());

  useRunOnce(() => {
    if (qr && amountFcfa !== undefined && sourceWallet) {
      const operator = getOperator(sourceWallet.operator);
      const provider = resolveProvider(qr);
      const id = String(horodatage);
      const transaction: PaymentTransaction = {
        id,
        timestamp: horodatage,
        merchantQrRaw: qr.raw,
        merchantProviderLabel: provider?.label ?? 'Opérateur inconnu',
        merchantName: qr.emvco?.merchantName,
        amount: amountFcfa,
        currency: qr.emvco?.currency ?? 'FCFA',
        sourceWalletId: sourceWallet.id,
        sourceOperator: sourceWallet.operator,
        sourceOperatorLabel: operator.label,
        commission: commission ?? 0,
        status: 'success',
      };
      addTransaction(transaction);
      setIdTransaction(id);
    }
    reset();
  });

  const details = [
    qr?.emvco?.merchantName ? { libelle: 'Commerçant', valeur: qr.emvco.merchantName } : undefined,
    sourceWallet
      ? { libelle: 'Débité sur', valeur: getOperator(sourceWallet.operator).label }
      : undefined,
    { libelle: 'Commission EasyPay', valeur: `${formatAmount(commission ?? 0)} FCFA` },
    {
      libelle: 'Total débité',
      valeur: `${formatAmount((amountFcfa ?? 0) + (commission ?? 0))} FCFA`,
    },
    { libelle: 'Date', valeur: formatFullDate(horodatage) },
  ].filter(Boolean) as { libelle: string; valeur: string }[];

  return (
    <>
      <FocusAwareStatusBar />
      <PaymentOutcome
        issue="succes"
        montantFcfa={amountFcfa}
        details={details}
        libelleBouton="Terminer"
        onBouton={() => router.replace('/(app)')}
        libelleSecondaire={idTransaction ? 'Voir le reçu' : undefined}
        onSecondaire={
          idTransaction
            ? () =>
                router.replace({
                  pathname: '/(app)/history/[id]',
                  params: { id: idTransaction },
                })
            : undefined
        }
      />
    </>
  );
}
