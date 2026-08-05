import * as React from 'react';
import { Pressable } from 'react-native';

import { Text, View } from '@/components/ui';

/**
 * PAVÉ NUMÉRIQUE — porté depuis BlueWallet `components/AmountInput.tsx`
 * (licence MIT, voir LICENSE-BLUEWALLET).
 *
 * Pourquoi un pavé plutôt qu'un champ de saisie : sur un montant, le clavier
 * système du téléphone recouvre la moitié de l'écran, cache justement le
 * montant qu'on est en train de taper, et propose des lettres qui n'ont rien
 * à faire là. Le donneur affiche son propre pavé, toujours visible, avec de
 * grandes touches. C'est ce que font toutes les applications d'argent.
 */

const TOUCHES = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '00', '0', '⌫'];

export function NumericKeypad({
  onTouche,
  desactive = false,
}: {
  onTouche: (touche: string) => void;
  desactive?: boolean;
}) {
  return (
    <View className="w-full flex-row flex-wrap">
      {TOUCHES.map(touche => (
        <Pressable
          key={touche}
          onPress={() => onTouche(touche)}
          disabled={desactive}
          className="h-[68px] w-1/3 items-center justify-center active:opacity-50"
          accessibilityRole="button"
          accessibilityLabel={touche === '⌫' ? 'Effacer' : touche}
        >
          <Text className="text-[26px] font-semibold">{touche}</Text>
        </Pressable>
      ))}
    </View>
  );
}

/** Applique une touche à un montant en cours de saisie. */
export function appliquerTouche(courant: string, touche: string): string {
  if (touche === '⌫')
    return courant.slice(0, -1);
  const suivant = (courant + touche).replace(/^0+/, '');
  // Plafond de sécurité : au-delà, c'est une faute de frappe, pas un paiement.
  if (suivant.length > 9)
    return courant;
  return suivant;
}
