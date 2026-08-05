import type { LinkedWallet } from './types';
import type { ScannedQr } from '@/core/providers/types';
import { create } from 'zustand';

/**
 * État temporaire d'un paiement en cours de préparation (du scan jusqu'à la
 * confirmation). En mémoire seulement — jamais écrit sur le disque, remis à
 * zéro dès que le parcours se termine ou est annulé.
 */
type PaymentDraftState = {
  qr?: ScannedQr;
  amountFcfa?: number;
  sourceWallet?: LinkedWallet;
  commission?: number;
  setQr: (qr: ScannedQr) => void;
  setAmount: (amountFcfa: number) => void;
  setSourceWallet: (wallet: LinkedWallet) => void;
  setCommission: (commission: number) => void;
  reset: () => void;
};

export const usePaymentDraftStore = create<PaymentDraftState>(set => ({
  qr: undefined,
  amountFcfa: undefined,
  sourceWallet: undefined,
  commission: undefined,
  setQr: qr => set({ qr }),
  setAmount: amountFcfa => set({ amountFcfa }),
  setSourceWallet: sourceWallet => set({ sourceWallet }),
  setCommission: commission => set({ commission }),
  reset: () => set({ qr: undefined, amountFcfa: undefined, sourceWallet: undefined, commission: undefined }),
}));
