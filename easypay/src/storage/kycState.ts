import type { KycProfile } from '@/core/wallet-engine/types';
import { getItem, setItem } from '@/lib/storage';

const KYC_KEY = 'kyc_profile_v1';

export async function getKycProfile(): Promise<KycProfile> {
  return getItem<KycProfile>(KYC_KEY) ?? { status: 'not_started' };
}

export async function saveKycInfo(info: { fullName: string; birthDate: string; idDocumentType: string }): Promise<void> {
  const current = await getKycProfile();
  await setItem(KYC_KEY, { ...current, ...info, status: 'pending' });
  // Simulation : vérification "instantanée" après un court délai, pour ne pas
  // laisser l'utilisateur bloqué sur un statut "en attente" indéfiniment en démo.
  setTimeout(async () => {
    const latest = await getKycProfile();
    await setItem(KYC_KEY, { ...latest, status: 'verified' });
  }, 3000);
}
