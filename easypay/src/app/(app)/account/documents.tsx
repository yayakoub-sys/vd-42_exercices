import { useFocusEffect } from '@react-navigation/native';
import * as React from 'react';

import { FocusAwareStatusBar, Text, View } from '@/components/ui';
import type { KycProfile } from '@/core/wallet-engine/types';
import { getKycProfile } from '@/storage/kycState';

function statusLabel(status: KycProfile['status']): string {
  switch (status) {
    case 'verified':
      return 'Vérifiée ✓';
    case 'pending':
      return 'En cours de vérification';
    case 'rejected':
      return 'Refusée';
    default:
      return 'Non commencée';
  }
}

function statusClasses(status: KycProfile['status']): string {
  switch (status) {
    case 'verified':
      return 'bg-success-100 dark:bg-success-900';
    case 'rejected':
      return 'bg-danger-100 dark:bg-danger-900';
    default:
      return 'bg-warning-100 dark:bg-warning-900';
  }
}

function statusTextClasses(status: KycProfile['status']): string {
  switch (status) {
    case 'verified':
      return 'text-success-700 dark:text-success-300';
    case 'rejected':
      return 'text-danger-700 dark:text-danger-300';
    default:
      return 'text-warning-700 dark:text-warning-300';
  }
}

export default function DocumentsScreen() {
  const [kyc, setKyc] = React.useState<KycProfile | null>(null);

  useFocusEffect(
    React.useCallback(() => {
      getKycProfile().then(setKyc);
    }, []),
  );

  const status = kyc?.status ?? 'not_started';

  return (
    <View className="flex-1 bg-white px-4 pt-4 dark:bg-black">
      <FocusAwareStatusBar />
      <View className="rounded-md border border-neutral-200 p-4 dark:border-neutral-700">
        <Text className="text-sm text-neutral-500 dark:text-neutral-400">
          Type de pièce d'identité
        </Text>
        <Text className="mt-1 text-base font-medium">
          {kyc?.idDocumentType ?? 'Non renseignée'}
        </Text>

        <Text className="mt-4 text-sm text-neutral-500 dark:text-neutral-400">
          Statut de vérification
        </Text>
        <View className={`mt-1 self-start rounded-full px-3 py-1 ${statusClasses(status)}`}>
          <Text className={`text-xs font-semibold ${statusTextClasses(status)}`}>
            {statusLabel(status)}
          </Text>
        </View>
      </View>

      <Text className="mt-4 text-sm text-neutral-500 dark:text-neutral-400">
        Cette pièce sert uniquement à vérifier que c'est bien toi qui payes. EasyPay ne
        partage jamais ce document sans ton accord.
      </Text>
    </View>
  );
}
