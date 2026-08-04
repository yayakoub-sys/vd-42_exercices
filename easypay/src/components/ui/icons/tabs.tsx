import type { SvgProps } from 'react-native-svg';
import * as React from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

/**
 * Icônes de la barre d'onglets.
 *
 * Style repris du jeu d'icônes de BlueWallet (licence MIT, `components/icons/`) :
 * un seul gabarit 24×24, tracé au trait de 1,8, extrémités arrondies. C'est
 * cette cohérence de gabarit qui fait qu'une barre d'onglets « tient »
 * visuellement, bien plus que le dessin de chaque icône pris isolément.
 *
 * Corrige deux défauts relevés dans ETAT.md § 9.4 :
 *   - l'onglet « Scanner » affichait une MAISON ;
 *   - l'onglet « Portefeuilles » affichait le caractère « ◫ », visuellement
 *     étranger au reste.
 */

const TRAIT = 1.8;

export function ScanIcon({ color = '#000', ...props }: SvgProps) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" {...props}>
      {/* Les quatre coins d'un viseur : c'est le symbole universel du scan. */}
      <Path
        d="M3 8V5.5A2.5 2.5 0 0 1 5.5 3H8M16 3h2.5A2.5 2.5 0 0 1 21 5.5V8M21 16v2.5a2.5 2.5 0 0 1-2.5 2.5H16M8 21H5.5A2.5 2.5 0 0 1 3 18.5V16"
        stroke={color}
        strokeWidth={TRAIT}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M3 12h18" stroke={color} strokeWidth={TRAIT} strokeLinecap="round" />
    </Svg>
  );
}

export function WalletsIcon({ color = '#000', ...props }: SvgProps) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" {...props}>
      <Rect
        x={3}
        y={6}
        width={18}
        height={13}
        rx={2.5}
        stroke={color}
        strokeWidth={TRAIT}
      />
      <Path
        d="M3 10h18"
        stroke={color}
        strokeWidth={TRAIT}
        strokeLinecap="round"
      />
      <Circle cx={17} cy={14.5} r={1.4} fill={color} />
    </Svg>
  );
}

export function HistoryIcon({ color = '#000', ...props }: SvgProps) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" {...props}>
      <Circle cx={12} cy={12} r={9} stroke={color} strokeWidth={TRAIT} />
      <Path
        d="M12 7v5.2l3.2 2"
        stroke={color}
        strokeWidth={TRAIT}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function AccountIcon({ color = '#000', ...props }: SvgProps) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" {...props}>
      <Circle cx={12} cy={8.5} r={3.7} stroke={color} strokeWidth={TRAIT} />
      <Path
        d="M4.5 20c.9-3.6 3.9-5.6 7.5-5.6s6.6 2 7.5 5.6"
        stroke={color}
        strokeWidth={TRAIT}
        strokeLinecap="round"
      />
    </Svg>
  );
}
