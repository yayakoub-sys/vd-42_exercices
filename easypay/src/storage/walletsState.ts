import { getItem, setItem } from '@/lib/storage';
import type { LinkedWallet, OperatorId } from '@/core/wallet-engine/types';

const WALLETS_KEY = 'linked_wallets_v1';

export async function getWallets(): Promise<LinkedWallet[]> {
  return getItem<LinkedWallet[]>(WALLETS_KEY) ?? [];
}

export async function getWallet(id: string): Promise<LinkedWallet | undefined> {
  const wallets = await getWallets();
  return wallets.find((w) => w.id === id);
}

export async function addWallet(operator: OperatorId, phoneNumber: string): Promise<LinkedWallet> {
  const wallets = await getWallets();
  const wallet: LinkedWallet = {
    id: `${operator}-${Date.now()}`,
    operator,
    phoneNumber,
    isDefault: wallets.length === 0,
    status: 'active',
    linkedAt: Date.now(),
  };
  await setItem(WALLETS_KEY, [...wallets, wallet]);
  return wallet;
}

export async function removeWallet(id: string): Promise<LinkedWallet[]> {
  const wallets = await getWallets();
  const next = wallets.filter((w) => w.id !== id);
  // Si on retire le portefeuille par défaut, le suivant (s'il y en a un) le devient.
  if (next.length > 0 && !next.some((w) => w.isDefault)) {
    next[0].isDefault = true;
  }
  await setItem(WALLETS_KEY, next);
  return next;
}

export async function setDefaultWallet(id: string): Promise<LinkedWallet[]> {
  const wallets = await getWallets();
  const next = wallets.map((w) => ({ ...w, isDefault: w.id === id }));
  await setItem(WALLETS_KEY, next);
  return next;
}
