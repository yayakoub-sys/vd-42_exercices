import type { OperatorId, OperatorInfo } from './types';

/**
 * Registre des opérateurs que l'utilisateur peut lier à son portefeuille EasyPay.
 * Pour en ajouter un : une ligne ici, rien d'autre à toucher dans les écrans.
 */
export const OPERATORS: Record<OperatorId, OperatorInfo> = {
  wave: { id: 'wave', label: 'Wave', color: '#0EA5A8' },
  orange_money: { id: 'orange_money', label: 'Orange Money', color: '#D9660B' },
  push_ci: { id: 'push_ci', label: 'Push by PalmPay', color: '#7C3AED' },
  djamo: { id: 'djamo', label: 'Djamo', color: '#0F172A' },
  mtn_momo: { id: 'mtn_momo', label: 'MTN Money', color: '#FFCB05' },
  moov_money: { id: 'moov_money', label: 'Moov Money', color: '#004B93' },
};

export const OPERATOR_LIST: OperatorInfo[] = Object.values(OPERATORS);

export function getOperator(id: OperatorId): OperatorInfo {
  return OPERATORS[id];
}
