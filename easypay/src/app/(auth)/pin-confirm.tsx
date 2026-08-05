import { useLocalSearchParams, useRouter } from 'expo-router';
import * as React from 'react';

import { FocusAwareStatusBar, View } from '@/components/ui';
import { PinPad } from '@/features/auth/pin-pad';
import { setPin as enregistrerPin } from '@/storage/authState';

/**
 * Confirmation du code à la création — même pavé que partout ailleurs.
 *
 * Le code n'est jamais affiché, seulement les points. La secousse du pavé dit
 * « ce n'est pas le même » sans qu'on ait besoin de lire.
 */
export default function PinConfirmScreen() {
  const router = useRouter();
  const { pin: codeChoisi } = useLocalSearchParams<{ pin: string }>();

  const valider = React.useCallback(
    async (code: string) => {
      if (code !== codeChoisi)
        return false;
      await enregistrerPin(code);
      router.push('/(auth)/consent');
      return true;
    },
    [codeChoisi, router],
  );

  return (
    <View className="flex-1 bg-white dark:bg-black">
      <FocusAwareStatusBar />
      <PinPad
        titre="Confirme ton code"
        sousTitre="Ressaisis le même code pour être sûr de ne pas t'être trompé."
        onValider={valider}
      />
    </View>
  );
}
