import { formatEmvcoAmount } from './emvco';
import { resolveProvider } from './providers/registry';
import type { ScannedQr } from './providers/types';

export interface ScanHistoryEntry {
  id: string;
  timestamp: number;
  raw: string;
  providerId: string;
  providerLabel: string;
  merchantName?: string;
  amount?: string;
}

/** Construit l'entrée d'historique à partir d'un QR scanné, sans toucher au stockage. */
export function buildHistoryEntry(qr: ScannedQr): ScanHistoryEntry {
  const provider = resolveProvider(qr);
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: Date.now(),
    raw: qr.raw,
    providerId: provider?.id ?? 'unknown',
    providerLabel: provider?.label ?? 'QR non reconnu',
    merchantName: qr.emvco?.merchantName,
    amount: qr.emvco ? formatEmvcoAmount(qr.emvco.amount, qr.emvco.currency) : undefined,
  };
}
