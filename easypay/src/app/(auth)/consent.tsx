import { useRouter } from 'expo-router';
import * as React from 'react';
import { Alert } from 'react-native';

import {
  Button,
  FocusAwareStatusBar,
  SafeAreaView,
  Text,
  View,
} from '@/components/ui';
import { setConsentAccepted } from '@/storage/authState';

export default function ConsentScreen() {
  const router = useRouter();

  const onAccept = async () => {
    await setConsentAccepted();
    router.push('/(auth)/personal-info');
  };

  return (
    <View className="flex-1 bg-white p-6 dark:bg-black">
      <FocusAwareStatusBar />
      <Text className="mt-4 mb-2 text-2xl font-bold">
        Avant de continuer
      </Text>
      <Text className="mb-4 text-base text-gray-600 dark:text-neutral-400">
        EasyPay va relier tes portefeuilles mobile money (Wave, Orange Money,
        Push, Djamo...) à ton compte, un peu comme un porte-clés qui regroupe
        toutes tes cartes.
      </Text>
      <Text className="mb-4 text-base text-gray-600 dark:text-neutral-400">
        Avant chaque paiement, EasyPay te demandera toujours ton accord. Rien
        ne part jamais de ton argent sans que tu confirmes.
      </Text>
      <Text
        className="mb-2 text-base font-semibold text-primary-800 dark:text-primary-300"
        onPress={() => Alert.alert('Conditions d\'utilisation', 'Le texte complet sera bientôt disponible ici.')}
      >
        Conditions d'utilisation
      </Text>
      <Text
        className="mb-6 text-base font-semibold text-primary-800 dark:text-primary-300"
        onPress={() => Alert.alert('Politique de confidentialité', 'Le texte complet sera bientôt disponible ici.')}
      >
        Politique de confidentialité
      </Text>
      <SafeAreaView className="mt-auto w-full">
        <Button
          label="J'accepte et je continue"
          onPress={onAccept}
          testID="consent-accept-button"
        />
      </SafeAreaView>
    </View>
  );
}
