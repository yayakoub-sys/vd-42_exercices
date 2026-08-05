import * as React from 'react';
import { Animated, Pressable, Vibration } from 'react-native';

import { Text, View } from '@/components/ui';

/**
 * ============================================================================
 * PAVÉ DE CODE SECRET — porté depuis BlueWallet (licence MIT)
 * ============================================================================
 *
 * Origine : `screen/UnlockWith.tsx` et `PromptPasswordConfirmationSheet.tsx`.
 * Licence : MIT, voir `easypay/LICENSE-BLUEWALLET`.
 *
 * CE QU'ON REPREND DU DONNEUR :
 *   - la validation AUTOMATIQUE au dernier chiffre : pas de bouton « OK ».
 *     Sur un code à 4 chiffres, le bouton est une étape en trop ;
 *   - le retour d'erreur PHYSIQUE : secousse + vibration. Sur un pavé, on ne
 *     lit pas un message d'erreur, on le sent ;
 *   - de grandes cibles tactiles : on tape ce code d'une main, souvent debout,
 *     souvent pressé, à la caisse d'un commerçant ;
 *   - le code ne quitte JAMAIS l'écran en clair.
 *
 * RETIRÉ : déverrouillage biométrique et chiffrement du coffre — EasyPay ne
 * garde pas de clés privées.
 *
 * POURQUOI CE COMPOSANT EXISTE (ETAT.md § 9.3)
 * --------------------------------------------
 * `verifyPin` était écrite dans le code et n'était appelée NULLE PART. Le
 * code secret était créé, rangé sous forme d'empreinte, puis plus jamais
 * demandé. Deux écrans le promettaient pourtant noir sur blanc :
 *
 *   pin-create : « Ce code te servira à ouvrir EasyPay ET À CONFIRMER TES
 *                 PAIEMENTS. »
 *   consent    : « Avant chaque paiement, EasyPay te demandera TOUJOURS ton
 *                 accord. »
 *
 * Une promesse de sécurité non tenue est pire que pas de promesse du tout.
 */

const TOUCHES = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'];
const LONGUEUR = 4;

/** Les points : l'unique retour visuel. Le code ne s'affiche jamais en clair. */
function Points({ remplis, erreur }: { remplis: number; erreur: boolean }) {
  return (
    <View className="mt-10 flex-row">
      {Array.from({ length: LONGUEUR }).map((_, i) => (
        <View
          key={i}
          className={`mx-2.5 size-4 rounded-full ${
            erreur
              ? 'bg-danger-500'
              : i < remplis
                ? 'bg-primary-800 dark:bg-white'
                : 'bg-neutral-200 dark:bg-neutral-700'
          }`}
        />
      ))}
    </View>
  );
}

/** Grandes cibles : on tape ce code d'une main, debout, a la caisse. */
function Clavier({
  onTouche,
  desactive,
}: {
  onTouche: (touche: string) => void;
  desactive: boolean;
}) {
  return (
    <View className="w-full max-w-[320px] flex-row flex-wrap">
      {TOUCHES.map((touche, i) => (
        <Pressable
          key={`${touche}-${i}`}
          onPress={() => onTouche(touche)}
          disabled={touche === '' || desactive}
          className="h-[76px] w-1/3 items-center justify-center"
          accessibilityRole="button"
          accessibilityLabel={touche === '⌫' ? 'Effacer' : touche}
        >
          {touche === ''
            ? null
            : (
                <View
                  className={
                    touche === '⌫'
                      ? 'size-16 items-center justify-center'
                      : 'size-16 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800'
                  }
                >
                  <Text className={touche === '⌫' ? 'text-2xl' : 'text-2xl font-semibold'}>
                    {touche}
                  </Text>
                </View>
              )}
        </Pressable>
      ))}
    </View>
  );
}

export function PinPad({
  titre,
  sousTitre,
  onValider,
}: {
  titre: string;
  sousTitre?: string;
  /** Renvoie true si le code est bon. False déclenche la secousse. */
  onValider: (code: string) => Promise<boolean>;
}) {
  const [code, setCode] = React.useState('');
  const [enCours, setEnCours] = React.useState(false);
  const [erreur, setErreur] = React.useState(false);
  const decalage = React.useRef(new Animated.Value(0)).current;

  const secouer = React.useCallback(() => {
    Vibration.vibrate(200);
    Animated.sequence([
      Animated.timing(decalage, { toValue: 12, duration: 55, useNativeDriver: true }),
      Animated.timing(decalage, { toValue: -12, duration: 55, useNativeDriver: true }),
      Animated.timing(decalage, { toValue: 8, duration: 55, useNativeDriver: true }),
      Animated.timing(decalage, { toValue: 0, duration: 55, useNativeDriver: true }),
    ]).start();
  }, [decalage]);

  const soumettre = React.useCallback(
    async (complet: string) => {
      setEnCours(true);
      const ok = await onValider(complet);
      setEnCours(false);
      if (!ok) {
        setErreur(true);
        secouer();
        setCode('');
      }
    },
    [onValider, secouer],
  );

  const taper = React.useCallback(
    (touche: string) => {
      if (enCours)
        return;
      setErreur(false);

      if (touche === '⌫') {
        setCode(c => c.slice(0, -1));
        return;
      }
      if (touche === '')
        return;

      setCode((c) => {
        if (c.length >= LONGUEUR)
          return c;
        const suivant = c + touche;
        // Validation automatique au dernier chiffre : pas de bouton « OK ».
        if (suivant.length === LONGUEUR)
          void soumettre(suivant);
        return suivant;
      });
    },
    [enCours, soumettre],
  );

  return (
    <View className="flex-1 items-center justify-between bg-white px-8 pt-16 pb-10 dark:bg-black">
      <View className="items-center">
        <Text className="text-center text-2xl font-bold">{titre}</Text>
        {sousTitre
          ? (
              <Text className="mt-2 text-center text-base text-neutral-500 dark:text-neutral-400">
                {sousTitre}
              </Text>
            )
          : null}

        <Animated.View style={{ transform: [{ translateX: decalage }] }}>
          <Points remplis={code.length} erreur={erreur} />
        </Animated.View>

        <Text className="mt-4 h-5 text-sm font-semibold text-danger-600">
          {erreur ? 'Code incorrect' : ''}
        </Text>
      </View>

      <Clavier onTouche={taper} desactive={enCours} />
    </View>
  );
}
