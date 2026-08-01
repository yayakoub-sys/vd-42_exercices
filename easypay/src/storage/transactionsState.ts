import { getItem, removeItem, setItem } from '@/lib/storage';
import type { PaymentTransaction } from '@/core/wallet-engine/types';

const TRANSACTIONS_KEY = 'payment_transactions_v1';
const HISTORY_LIMIT = 50;

export async function getTransactions(): Promise<PaymentTransaction[]> {
  return getItem<PaymentTransaction[]>(TRANSACTIONS_KEY) ?? [];
}

export async function getTransaction(id: string): Promise<PaymentTransaction | undefined> {
  const all = await getTransactions();
  return all.find((t) => t.id === id);
}

export async function addTransaction(transaction: PaymentTransaction): Promise<PaymentTransaction[]> {
  const current = await getTransactions();
  const next = [transaction, ...current].slice(0, HISTORY_LIMIT);
  await setItem(TRANSACTIONS_KEY, next);
  return next;
}

export async function clearTransactions(): Promise<void> {
  await removeItem(TRANSACTIONS_KEY);
}
