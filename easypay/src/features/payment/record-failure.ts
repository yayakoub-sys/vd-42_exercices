import type { PaymentTransaction, TransactionStatus } from '@/core/wallet-engine/types';

import { resolveProvider } from '@/core/providers/registry';
import { getOperator } from '@/core/wallet-engine/operators';
import { addTransaction } from '@/storage/transactionsState';

type Panier = {
  qr?: { raw: string; emvco?: { merchantName?: string; currency?: string } };
  amountFcfa?: number;
  sourceWallet?: { id: string; operator: PaymentTransaction['sourceOperator'] };
  commission?: number;
};

/**
 * Enregistre un paiement qui n'a PAS abouti.
 *
 * Pourquoi ça existe : les écrans d'échec et de solde insuffisant
 * n'enregistraient rien. Un paiement raté n'existait nulle part, alors que
 * c'est exactement ce qu'on cherche à relire quand on se demande « est-ce que
 * ça a été débité ou pas ? ». Le modèle de données savait déjà représenter ces
 * deux états (`failed`, `insufficient_funds`) — personne ne les écrivait.
 */
export function enregistrerEchec(panier: Panier, statut: TransactionStatus): void {
  const { qr, amountFcfa, sourceWallet, commission } = panier;
  if (!qr || amountFcfa === undefined || !sourceWallet)
    return;

  const operateur = getOperator(sourceWallet.operator);
  const fournisseur = resolveProvider(qr as never);

  const transaction: PaymentTransaction = {
    id: String(Date.now()),
    timestamp: Date.now(),
    merchantQrRaw: qr.raw,
    merchantProviderLabel: fournisseur?.label ?? 'Opérateur inconnu',
    merchantName: qr.emvco?.merchantName,
    amount: amountFcfa,
    currency: qr.emvco?.currency ?? 'FCFA',
    sourceWalletId: sourceWallet.id,
    sourceOperator: sourceWallet.operator,
    sourceOperatorLabel: operateur.label,
    commission: commission ?? 0,
    status: statut,
  };

  void addTransaction(transaction);
}
