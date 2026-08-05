export type OperatorId = 'wave' | 'orange_money' | 'push_ci' | 'djamo' | 'mtn_momo' | 'moov_money';

export type OperatorInfo = {
  id: OperatorId;
  label: string;
  color: string;
};

export type LinkedWallet = {
  id: string;
  operator: OperatorId;
  phoneNumber: string;
  nickname?: string;
  isDefault: boolean;
  status: 'active' | 'pending' | 'failed';
  linkedAt: number;
};

export type TransactionStatus = 'success' | 'failed' | 'insufficient_funds';

export type PaymentTransaction = {
  id: string;
  timestamp: number;
  merchantQrRaw: string;
  merchantProviderLabel: string;
  merchantName?: string;
  amount: number;
  currency: string;
  sourceWalletId: string;
  sourceOperator: OperatorId;
  sourceOperatorLabel: string;
  commission: number;
  status: TransactionStatus;
};

export type KycStatus = 'not_started' | 'pending' | 'verified' | 'rejected';

export type KycProfile = {
  fullName?: string;
  birthDate?: string;
  idDocumentType?: string;
  status: KycStatus;
};

export type AuthState = {
  phoneNumber?: string;
  pinSet: boolean;
  consentAccepted: boolean;
};
