import type { KycStatus } from '@/core/wallet-engine/types';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { Animated, Easing } from 'react-native';

import {
  Button,
  FocusAwareStatusBar,
  Pressable,
  Text,
  View,
} from '@/components/ui';
import { getKycProfile } from '@/storage/kycState';

/**
 * Vérification d'identité — mise en scène reprise de l'attente de paiement,
 * elle-même portée de BlueWallet `TransactionPendingIconBig.tsx` (licence MIT).
 *
 * CORRIGÉ (ETAT.md § 9.4) : cet écran n'avait AUCUNE SORTIE. Tant que le
 * statut ne passait pas à « vérifié », l'utilisateur restait devant un rond
 * qui tourne, sans bouton retour, sans explication. Si la vérification
 * échouait ou traînait, l'inscription était bloquée pour de bon.
 *
 * Désormais : au bout de 12 secondes, on propose de continuer sans attendre.
 * La vérification n'empêche pas d'utiliser EasyPay — elle conditionne
 * seulement les plafonds. Bloquer l'entrée du produit sur une vérification
 * qui traîne, c'est perdre l'utilisateur pour rien.
 */

const DELAI_AVANT_SORTIE_MS = 12_000;

export default function KycStatusScreen() {
  const router = useRouter();
  const [statut, setStatut] = React.useState<KycStatus>('pending');
  const [sortiePossible, setSortiePossible] = React.useState(false);
  const pulsation = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulsation, {
          toValue: 1,
          duration: 900,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulsation, {
          toValue: 0,
          duration: 900,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [pulsation]);

  React.useEffect(() => {
    let actif = true;
    const relire = async () => {
      const profil = await getKycProfile();
      if (actif) setStatut(profil.status);
    };
    void relire();
    const tic = setInterval(relire, 1000);
    // La porte de sortie : on ne piege jamais l'utilisateur devant une attente.
    const sortie = setTimeout(() => actif && setSortiePossible(true), DELAI_AVANT_SORTIE_MS);
    return () => {
      actif = false;
      clearInterval(tic);
      clearTimeout(sortie);
    };
  }, []);

  const verifie = statut === 'verified';
  const echoue = statut === 'rejected';

  const echelle = pulsation.interpolate({ inputRange: [0, 1], outputRange: [1, 1.18] });
  const opacite = pulsation.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.08] });

  return (
    <View className="flex-1 items-center justify-center bg-white px-8 dark:bg-black">
      <FocusAwareStatusBar />

      <View className="size-32 items-center justify-center">
        {verifie
          ? <View className="size-20 rounded-full bg-success-600" />
          : (
              <>
                <Animated.View
                  className={`absolute size-32 rounded-full ${echoue ? 'bg-danger-600' : 'bg-primary-600'}`}
                  style={{ transform: [{ scale: echelle }], opacity: opacite }}
                />
                <View
                  className={`size-16 rounded-full ${echoue ? 'bg-danger-600' : 'bg-primary-800'}`}
                />
              </>
            )}
      </View>

      <Text className="mt-10 text-center text-2xl font-bold">
        {verifie
          ? 'Identité vérifiée'
          : echoue
            ? 'Vérification refusée'
            : 'Vérification en cours'}
      </Text>
      <Text className="mt-2 text-center text-base text-neutral-500 dark:text-neutral-400">
        {verifie
          ? 'Tu peux utiliser EasyPay sans limite.'
          : echoue
            ? 'Tu peux quand même utiliser EasyPay, avec des plafonds réduits.'
            : 'Ça prend en général quelques secondes.'}
      </Text>

      {verifie || echoue || sortiePossible
        ? (
            <View className="mt-10 w-full">
              <Button
                label={verifie ? 'Commencer' : 'Continuer quand même'}
                onPress={() => router.replace('/(app)')}
                testID="kyc-status-finish-button"
              />
              {!verifie && !echoue
                ? (
                    <Pressable className="mt-1 items-center py-3">
                      <Text className="text-center text-sm text-neutral-400 dark:text-neutral-500">
                        La vérification se poursuit en arrière-plan.
                      </Text>
                    </Pressable>
                  )
                : null}
            </View>
          )
        : null}
    </View>
  );
}
