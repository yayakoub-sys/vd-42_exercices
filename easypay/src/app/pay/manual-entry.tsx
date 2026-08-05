import { useRouter } from 'expo-router';
import * as React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  Button,
  FocusAwareStatusBar,
  Input,
  Text,
  View,
} from '@/components/ui';
import { looksLikeEmvco } from '@/core/emvco';
import { usePaymentDraftStore } from '@/core/wallet-engine/paymentDraftStore';

/**
 * Saisie manuelle du code — la sortie de secours quand la caméra n'y arrive
 * pas : QR abîmé, écran du commerçant trop brillant, objectif rayé.
 *
 * Cet écran existait déjà mais AUCUN bouton de l'application n'y menait
 * (ETAT.md § 9.4) : on ne pouvait l'atteindre que par un lien direct. Il est
 * désormais accessible depuis le scanner.
 *
 * GREFFÉ : un retour immédiat sur ce qui est collé. L'écran acceptait
 * n'importe quel texte sans rien dire, et l'utilisateur ne découvrait qu'à
 * l'écran suivant que ce n'était pas un code de paiement.
 */
export default function ManualEntryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const setQr = usePaymentDraftStore(s => s.setQr);
  const reset = usePaymentDraftStore(s => s.reset);
  const [texte, setTexte] = React.useState('');

  const propre = texte.trim();
  const ressemble = propre.length > 0 && looksLikeEmvco(propre);

  function tester() {
    if (!propre)
      return;
    reset();
    setQr({ raw: propre });
    router.push('/pay/preview');
  }

  return (
    <View className="flex-1 bg-white dark:bg-black">
      <FocusAwareStatusBar />
      <View style={{ paddingTop: insets.top + 8 }} className="flex-1 px-5">
        <Text className="text-2xl font-bold">Coller un code</Text>
        <Text className="mt-1 mb-6 text-base text-neutral-500 dark:text-neutral-400">
          Si la caméra n'arrive pas à lire le QR, colle ici le code que le
          commerçant t'a donné.
        </Text>

        <Input
          label="Contenu du code"
          placeholder="00020101021126..."
          value={texte}
          onChangeText={setTexte}
          multiline
          numberOfLines={6}
          testID="manual-entry-input"
          style={{ minHeight: 130, textAlignVertical: 'top' }}
        />

        {/* Retour immediat : on ne laisse plus decouvrir l'erreur a l'ecran suivant. */}
        <Text
          className={`mt-2 h-5 text-sm font-semibold ${
            ressemble ? 'text-success-600' : 'text-neutral-400 dark:text-neutral-500'
          }`}
        >
          {propre.length === 0
            ? ''
            : ressemble
              ? 'Ça ressemble bien à un code de paiement.'
              : 'Ce texte ne ressemble pas à un code de paiement — tu peux quand même essayer.'}
        </Text>
      </View>

      <View style={{ paddingBottom: insets.bottom + 16 }} className="px-5">
        <Button
          label="Continuer"
          onPress={tester}
          disabled={!propre}
          testID="manual-entry-test-button"
        />
      </View>
    </View>
  );
}
