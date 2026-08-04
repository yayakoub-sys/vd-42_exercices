import { Appearance } from 'react-native';

import colors from './colors';

/**
 * ============================================================================
 * SYSTÈME DE THÈME — porté depuis BlueWallet (licence MIT)
 * ============================================================================
 *
 * Origine : `components/themes.ts` du dépôt https://github.com/BlueWallet/BlueWallet
 * Licence : MIT — voir `easypay/LICENSE-BLUEWALLET` (copie conservée comme
 * l'exige la licence). Copyright (c) 2026 BlueWallet developers.
 *
 * POURQUOI CE FICHIER EXISTE
 * --------------------------
 * EasyPay style ses écrans avec Tailwind (uniwind). Mais une application
 * mobile a besoin de couleurs en JavaScript, pas seulement en classes CSS :
 * remplissage des icônes SVG, propriétés natives, barre d'état, en-têtes de
 * navigation, dégradés. C'est ce que fournit ce fichier.
 *
 * On ne reprend pas seulement des couleurs : on reprend la STRUCTURE
 * SÉMANTIQUE de BlueWallet. Chaque emplacement (« la couleur du texte d'un
 * bouton désactivé », « le fond d'une pastille de transaction sortante »)
 * a été pensé et éprouvé dans une vraie application financière. C'est
 * exactement le travail qu'on ne veut pas refaire.
 *
 * CE QU'ON A RETIRÉ DU DONNEUR
 * ----------------------------
 *   hdborderColor / hdbackgroundColor .... portefeuilles « HD » Bitcoin
 *   lnborderColor / lnbackgroundColor .... réseau Lightning
 *   feeLabel / feeValue / feeActive ...... frais de réseau en sat/vB
 *   closeImage / scanImage ............... images du donneur
 *
 * CE QU'ON A GREFFÉ
 * -----------------
 *   la palette de marque EasyPay (violet nuit + or) à la place du bleu marine ;
 *   `commission*` à la place des frais de réseau ;
 *   `operator*` : les couleurs des opérateurs mobile money ivoiriens.
 */

export type ThemeColors = {
  // --- Fondations ---
  background: string;
  elevated: string;
  modal: string;
  brandingColor: string;
  customHeader: string;
  foregroundColor: string;
  inverseForegroundColor: string;

  // --- Bordures et filets ---
  borderWidth: number;
  borderTopColor: string;
  lightBorder: string;
  formBorder: string;
  cardBorderColor: string;

  // --- Texte ---
  alternativeTextColor: string;
  alternativeTextColor2: string;
  placeholderTextColor: string;
  labelText: string;

  // --- Boutons ---
  buttonBackgroundColor: string;
  buttonTextColor: string;
  secondButtonTextColor: string;
  buttonAlternativeTextColor: string;
  buttonDisabledBackgroundColor: string;
  buttonDisabledTextColor: string;
  buttonGrayBackgroundColor: string;
  lightButton: string;
  modalButton: string;

  // --- Champs de saisie ---
  inputBorderColor: string;
  inputBackgroundColor: string;

  // --- Mouvements d'argent ---
  incomingBackgroundColor: string;
  incomingForegroundColor: string;
  outgoingBackgroundColor: string;
  outgoingForegroundColor: string;
  ballReceive: string;
  ballOutgoing: string;
  ballOutgoingExpired: string;

  // --- États ---
  successColor: string;
  failedColor: string;
  redBG: string;
  redText: string;
  receiveBackground: string;
  receiveText: string;

  // --- États d'une transaction ---
  transactionPendingColor: string;
  transactionPendingBackgroundColor: string;
  transactionPendingIconBackground: string;
  transactionSentColor: string;
  transactionReceivedColor: string;

  // --- Sections en carte ---
  cardSectionBackground: string;
  cardSectionHeaderBackground: string;

  // --- Commission EasyPay (remplace les frais de reseau du donneur) ---
  commissionText: string;
  commissionBackground: string;
  commissionValue: string;

  // --- Divers ---
  mainColor: string;
  shadowColor: string;
  androidRippleColor: string;
  darkGray: string;
  scanLabel: string;
};

const CLAIR: ThemeColors = {
  background: colors.white,
  elevated: colors.white,
  modal: colors.white,
  brandingColor: colors.white,
  customHeader: colors.white,
  foregroundColor: colors.primary[900],
  inverseForegroundColor: colors.white,

  borderWidth: 0.5,
  borderTopColor: 'rgba(0, 0, 0, 0.1)',
  lightBorder: '#ededed',
  formBorder: colors.neutral[300],
  cardBorderColor: 'rgba(0, 0, 0, 0.05)',

  alternativeTextColor: colors.neutral[400],
  alternativeTextColor2: colors.primary[500],
  placeholderTextColor: colors.neutral[500],
  labelText: colors.neutral[500],

  buttonBackgroundColor: colors.primary[100],
  buttonTextColor: colors.primary[800],
  secondButtonTextColor: colors.neutral[600],
  buttonAlternativeTextColor: colors.primary[600],
  buttonDisabledBackgroundColor: colors.neutral[100],
  buttonDisabledTextColor: colors.neutral[400],
  buttonGrayBackgroundColor: colors.neutral[100],
  lightButton: 'rgba(0, 0, 0, 0.05)',
  modalButton: colors.primary[100],

  inputBorderColor: colors.neutral[300],
  inputBackgroundColor: colors.neutral[100],

  incomingBackgroundColor: colors.success[100],
  incomingForegroundColor: colors.success[600],
  outgoingBackgroundColor: colors.danger[100],
  outgoingForegroundColor: colors.danger[600],
  ballReceive: 'rgba(34, 197, 94, 0.15)',
  ballOutgoing: 'rgba(239, 68, 68, 0.15)',
  ballOutgoingExpired: colors.neutral[100],

  successColor: colors.success[600],
  failedColor: colors.danger[600],
  redBG: colors.danger[100],
  redText: colors.danger[600],
  receiveBackground: colors.success[100],
  receiveText: colors.success[700],

  transactionPendingColor: colors.warning[600],
  transactionPendingBackgroundColor: colors.warning[100],
  transactionPendingIconBackground: 'rgba(245, 158, 11, 0.12)',
  transactionSentColor: colors.primary[900],
  transactionReceivedColor: colors.success[600],

  cardSectionBackground: '#F9F9F9',
  cardSectionHeaderBackground: '#F2F2F2',

  commissionText: colors.neutral[500],
  commissionBackground: colors.primary[50],
  commissionValue: colors.primary[600],

  mainColor: colors.primary[800],
  shadowColor: colors.black,
  androidRippleColor: '#CCCCCC',
  darkGray: colors.neutral[400],
  scanLabel: colors.neutral[400],
};

const SOMBRE: ThemeColors = {
  ...CLAIR,

  background: colors.black,
  elevated: colors.charcoal[950],
  modal: colors.charcoal[900],
  brandingColor: colors.black,
  customHeader: colors.black,
  foregroundColor: colors.white,
  inverseForegroundColor: colors.black,

  borderTopColor: colors.neutral[400],
  lightBorder: colors.charcoal[850],
  formBorder: colors.charcoal[850],
  cardBorderColor: 'rgba(255, 255, 255, 0.08)',

  alternativeTextColor: colors.neutral[400],
  alternativeTextColor2: colors.primary[300],
  placeholderTextColor: colors.neutral[500],
  labelText: colors.white,

  buttonBackgroundColor: colors.charcoal[800],
  buttonTextColor: colors.white,
  secondButtonTextColor: colors.neutral[300],
  buttonAlternativeTextColor: colors.white,
  buttonDisabledBackgroundColor: colors.charcoal[800],
  buttonDisabledTextColor: colors.neutral[500],
  buttonGrayBackgroundColor: colors.charcoal[850],
  lightButton: 'rgba(255, 255, 255, 0.1)',
  modalButton: colors.black,

  inputBackgroundColor: colors.charcoal[850],

  incomingBackgroundColor: 'rgba(22, 163, 74, 0.25)',
  outgoingBackgroundColor: 'rgba(220, 38, 38, 0.2)',
  outgoingForegroundColor: colors.danger[400],
  ballOutgoingExpired: colors.charcoal[900],

  redBG: '#5A4E4E',
  redText: colors.danger[400],
  receiveBackground: 'rgba(34, 197, 94, 0.2)',
  receiveText: colors.success[400],

  transactionPendingBackgroundColor: 'rgba(245, 158, 11, 0.18)',
  transactionPendingColor: colors.warning[400],
  transactionSentColor: colors.white,

  cardSectionBackground: colors.charcoal[900],
  cardSectionHeaderBackground: colors.charcoal[850],

  commissionBackground: colors.charcoal[900],
  commissionValue: colors.primary[300],

  mainColor: colors.primary[400],
  androidRippleColor: '#444444',
  darkGray: colors.charcoal[800],
  scanLabel: 'rgba(255, 255, 255, 0.2)',
};

export const themeClair = { dark: false, barStyle: 'dark-content' as const, colors: CLAIR };
export const themeSombre = { dark: true, barStyle: 'light-content' as const, colors: SOMBRE };

/**
 * Couleurs des opérateurs mobile money — greffe EasyPay.
 *
 * Le donneur colorait ses portefeuilles par TYPE (HD, Lightning, multisig).
 * Ici on les colore par OPÉRATEUR : c'est ce qui permet à l'utilisateur de
 * reconnaître son portefeuille Wave d'un coup d'œil, sans lire.
 */
export const couleursOperateur: Record<string, { fond: string; texte: string }> = {
  wave: { fond: '#1DC8F2', texte: colors.white },
  orange_money: { fond: '#FF7900', texte: colors.white },
  mtn_momo: { fond: '#FFCC00', texte: colors.primary[900] },
  moov_money: { fond: '#0F6DB5', texte: colors.white },
  djamo: { fond: '#0B1F3A', texte: colors.white },
  push_ci: { fond: '#7B2FF7', texte: colors.white },
};

export function couleurOperateur(id: string) {
  return couleursOperateur[id] ?? { fond: colors.primary[600], texte: colors.white };
}

/**
 * Thème courant, lisible hors composant React (pour les fills SVG, la barre
 * d'état, etc.). Repris du `BlueCurrentTheme` du donneur.
 */
export const themeCourant = {
  colors: Appearance.getColorScheme() === 'dark' ? SOMBRE : CLAIR,
  estSombre: Appearance.getColorScheme() === 'dark',
  rafraichir() {
    const sombre = Appearance.getColorScheme() === 'dark';
    themeCourant.colors = sombre ? SOMBRE : CLAIR;
    themeCourant.estSombre = sombre;
  },
};

Appearance.addChangeListener(() => themeCourant.rafraichir());
