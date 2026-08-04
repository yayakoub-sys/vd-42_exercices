import type { TransactionStatus } from '@/core/wallet-engine/types';
import {
  PaymentFailedIcon,
  PaymentNoFundsIcon,
  PaymentSentIcon,
} from '@/components/ui/icons/transaction';

/**
 * Mise en forme et apparence des transactions.
 *
 * Ce fichier existe séparément du composant pour une raison précise :
 * mélanger des composants et des fonctions utilitaires dans un même fichier
 * CASSE le Fast Refresh (règle `react-refresh/only-export-components`).
 * Sur ce poste, où une reconstruction native coûte une dizaine de minutes,
 * le Fast Refresh est ce qui rend la boucle de développement supportable.
 */

/** 1500 → « 1 500 ». Pas d'Intl : Hermes ne l'embarque pas partout. */
export function formatAmount(value: number): string {
  return Math.round(value)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

export function formatShortDate(timestamp: number): string {
  return new Date(timestamp).toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatFullDate(timestamp: number): string {
  return new Date(timestamp).toLocaleString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function libelleStatut(statut: TransactionStatus): string {
  if (statut === 'success')
    return 'Paiement réussi';
  if (statut === 'insufficient_funds')
    return 'Solde insuffisant';
  return 'Paiement échoué';
}

export type Apparence = {
  /** Classe de fond de la pastille ronde qui porte l'icône. */
  cercle: string;
  /** Classe de couleur du montant. */
  montant: string;
  Icone: typeof PaymentSentIcon;
  /** Mention courte sous le montant, absente quand le paiement a abouti. */
  mention?: string;
};

/**
 * Motif repris de BlueWallet (MIT) : dans une liste financière, c'est
 * l'ICÔNE et la COULEUR DU MONTANT qui portent l'état, pas une étiquette.
 * L'œil balaie la colonne d'icônes et comprend l'historique sans lire.
 */
export function apparencePourStatut(statut: TransactionStatus): Apparence {
  switch (statut) {
    case 'success':
      return {
        cercle: 'bg-success-600',
        montant: 'text-neutral-900 dark:text-white',
        Icone: PaymentSentIcon,
      };
    case 'insufficient_funds':
      return {
        cercle: 'bg-warning-500',
        montant: 'text-neutral-400 dark:text-neutral-500',
        Icone: PaymentNoFundsIcon,
        mention: 'Solde insuffisant',
      };
    default:
      return {
        cercle: 'bg-danger-600',
        montant: 'text-neutral-400 dark:text-neutral-500',
        Icone: PaymentFailedIcon,
        mention: 'Échoué',
      };
  }
}
