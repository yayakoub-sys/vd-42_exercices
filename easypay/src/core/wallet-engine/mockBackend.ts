import type { OperatorId } from './types';

/**
 * SIMULATION — pas de vrai serveur, pas de vraie API Wave/Orange Money/PI-SPI.
 *
 * Ce fichier fait semblant d'être le "moteur d'orchestration" (débiter une source,
 * créditer une destination, prélever une petite commission) décrit dans la fiche
 * produit EasyPay V2. En vrai, ça demande un agrément "Service d'Initiation de
 * Paiement" (BCEAO) et un contrat avec chaque opérateur ou un agrégateur qui les a
 * déjà. Ici, ça sert à donner un parcours complet et crédible à tester — pas un
 * vrai mouvement d'argent.
 *
 * Pour brancher le vrai moteur plus tard : remplacer le contenu de chaque fonction
 * par un vrai appel réseau, sans changer sa signature — aucun écran n'aura besoin
 * de bouger.
 */

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function sendOtp(_phoneNumber: string): Promise<void> {
  await delay(700);
}

export async function verifyOtp(_phoneNumber: string, code: string): Promise<boolean> {
  await delay(700);
  // Simulation : n'importe quel code à 6 chiffres est accepté.
  return /^\d{6}$/.test(code);
}

export interface LinkWalletResult {
  success: boolean;
}

export async function linkWallet(_operator: OperatorId, phoneNumber: string): Promise<LinkWalletResult> {
  await delay(1400);
  // Simulation : tout réussit, sauf ce numéro précis — pour pouvoir tester l'écran d'échec.
  return { success: phoneNumber.trim() !== '0000000000' };
}

/** Solde simulé par opérateur, pour pouvoir déclencher "fonds insuffisants" de façon prévisible. */
const MOCK_BALANCE_FCFA = 50_000;

export function computeCommission(amountFcfa: number): number {
  // Simulation d'une commission de facilitation (celle que touche EasyPay au passage).
  return Math.max(15, Math.round(amountFcfa * 0.005));
}

export interface InitiatePaymentParams {
  amountFcfa: number;
}

export interface InitiatePaymentResult {
  success: boolean;
  commission: number;
  reason?: 'insufficient_funds' | 'declined';
}

export async function initiatePayment({ amountFcfa }: InitiatePaymentParams): Promise<InitiatePaymentResult> {
  await delay(1600);
  const commission = computeCommission(amountFcfa);
  if (amountFcfa > MOCK_BALANCE_FCFA) {
    return { success: false, commission, reason: 'insufficient_funds' };
  }
  return { success: true, commission };
}
