import type { SvgProps } from 'react-native-svg';
import * as React from 'react';
import Svg, { Path } from 'react-native-svg';

/**
 * Icônes d'état de transaction.
 *
 * Motif repris de BlueWallet (MIT) : dans une liste financière, c'est
 * l'ICÔNE qui porte l'état, pas une étiquette de texte. L'œil lit la
 * colonne d'icônes en diagonale et comprend l'historique sans lire un mot.
 *
 * Concept d'origine  →  concept EasyPay
 *   sortant confirmé  →  paiement réussi
 *   échec / expiré    →  paiement échoué
 *   en attente        →  fonds insuffisants
 */

export function PaymentSentIcon({ color = '#FFF', ...props }: SvgProps) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        d="M7 17 17 7M17 7H9M17 7v8"
        stroke={color}
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function PaymentFailedIcon({ color = '#FFF', ...props }: SvgProps) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        d="M7 7l10 10M17 7L7 17"
        stroke={color}
        strokeWidth={2.4}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function PaymentNoFundsIcon({ color = '#FFF', ...props }: SvgProps) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        d="M12 7v6"
        stroke={color}
        strokeWidth={2.4}
        strokeLinecap="round"
      />
      <Path
        d="M12 17h.01"
        stroke={color}
        strokeWidth={2.6}
        strokeLinecap="round"
      />
    </Svg>
  );
}
