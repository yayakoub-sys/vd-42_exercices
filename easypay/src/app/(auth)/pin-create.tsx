import { useRouter } from 'expo-router';
import * as React from 'react';

import { FocusAwareStatusBar, Text, View } from '@/components/ui';
import { PinPad } from '@/features/auth/pin-pad';
import { verifierForcePin } from '@/features/auth/weak-pin';

/**
 * Création du code secret — utilise le pavé porté de BlueWallet
 * `screen/UnlockWith.tsx` (licence MIT), le même que celui du verrouillage et
 * de la confirmation de paiement : on apprend le geste une seule fois.
 *
 * CORRIGÉ (ETAT.md § 9.4) : l'inscription acceptait 0000 et 1234. Sur une
 * application qui donne accès à de l'argent, c'est le seul contrôle qui
 * protège vraiment — un voleur de téléphone essaie ces codes-là en premier.
 */
export default function PinCreateScreen() {
  const router = useRouter();
  const [refus, setRefus] = React.useState('');

  const valider = React.useCallback(
    async (code: string) => {
      const verdict = verifierForcePin(code);
      if (!verdict.accepte) {
        setRefus(verdict.raison);
        return false;
      }
      setRefus('');
      router.push({ pathname: '/(auth)/pin-confirm', params: { pin: code } });
      return true;
    },
    [router],
  );

  return (
    <View className="flex-1 bg-white dark:bg-black">
      <FocusAwareStatusBar />
      <PinPad
        titre="Choisis un code secret"
        sousTitre="Ce code à 4 chiffres servira à ouvrir EasyPay et à confirmer tes paiements."
        onValider={valider}
      />
      {refus
        ? (
            <View className="absolute inset-x-0 bottom-2 px-8">
              <Text className="text-center text-sm font-semibold text-warning-600">
                {refus}
              </Text>
            </View>
          )
        : null}
    </View>
  );
}
