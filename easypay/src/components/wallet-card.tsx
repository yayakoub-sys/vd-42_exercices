import type { LinkedWallet } from '@/core/wallet-engine/types';
import * as React from 'react';
import {
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';

import { formatAmount } from '@/components/transaction-format';
import { Text } from '@/components/ui';
import { couleurOperateur } from '@/components/ui/theme';

/**
 * ============================================================================
 * CARTE DE PORTEFEUILLE — portée depuis BlueWallet (licence MIT)
 * ============================================================================
 *
 * Origine : `components/WalletsCarousel.tsx` (WalletCarouselItem).
 * Licence : MIT, voir `easypay/LICENSE-BLUEWALLET`.
 *
 * LA GÉOMÉTRIE EST REPRISE TELLE QUELLE — c'est elle qui fait que la carte
 * « a l'air d'une vraie application financière » :
 *
 *   coins arrondis ............ 12
 *   hauteur minimale .......... 164
 *   contenu ancré EN BAS ...... justifyContent: 'flex-end'
 *   marge interne ............. 15
 *   nom du portefeuille ....... 19 / interligne 24
 *   solde ..................... 36 gras / interligne 38
 *   zone du solde ............. hauteur minimale 40, centrée
 *   ligne du bas .............. 13 / interligne 18, puis 16 gras / 22
 *   écart entre les blocs ..... 12
 *   opacité du texte second ... 0,85
 *   largeur de carte .......... 82 % de l'écran, plafonnée à 375
 *   ombre ..................... elevation 8 (Android)
 *   appui ..................... ressort vers 0,97 (amorti 14, raideur 180)
 *
 * CE QU'ON A RETIRÉ
 * -----------------
 *   les types de portefeuille Bitcoin (HD, Lightning, multisig, watch-only) ;
 *   `react-native-linear-gradient` — dépendance NATIVE. Sur ce poste une
 *   reconstruction coûte ~45 min ; le dégradé est rendu en pur JS par une
 *   pastille claire en surimpression, pour un rendu équivalent à coût nul ;
 *   l'image décorative du donneur.
 *
 * CE QU'ON A GREFFÉ
 * -----------------
 *   la couleur vient de l'OPÉRATEUR (Wave, Orange Money, MTN…), pas du type
 *   de portefeuille : c'est ce qui permet de reconnaître sa carte sans lire ;
 *   le numéro masqué remplace l'adresse ;
 *   le solde en FCFA — il n'était affiché NULLE PART jusqu'ici, alors que
 *   c'est l'information qui permet de choisir avec quoi payer
 *   (manque relevé dans ETAT.md § 9.4).
 */

export const CARTE_HAUTEUR_MIN = 164;
export const CARROUSEL_MARGE_HAUT = 12;
export const CARROUSEL_MARGE_BAS = 20;

/** Reprend `getWalletCarouselItemWidth` du donneur. */
export function largeurCarte(largeurEcran: number): number {
  return Math.round(largeurEcran * 0.82 > 375 ? 375 : largeurEcran * 0.82);
}

/** 0787770000 → « 07 ** ** 00 00 ». Un seul masquage dans toute l'application. */
export function masquerNumero(numero: string): string {
  const n = numero.replace(/\D/g, '');
  if (n.length < 6)
    return numero;
  return `${n.slice(0, 2)} ** ** ${n.slice(-4, -2)} ${n.slice(-2)}`;
}

const styles = StyleSheet.create({
  racine: { paddingRight: 20 },
  carte: {
    borderRadius: 12,
    minHeight: CARTE_HAUTEUR_MIN,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    ...Platform.select({
      android: { elevation: 8 },
      default: {
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
      },
    }),
  },
  contenu: { padding: 15, width: '100%' },
  zoneSolde: { minHeight: 40, justifyContent: 'center' },
  nom: { backgroundColor: 'transparent', fontSize: 19, lineHeight: 24 },
  solde: { backgroundColor: 'transparent', fontWeight: 'bold', fontSize: 36, lineHeight: 38 },
  basLigne1: { backgroundColor: 'transparent', fontSize: 13, lineHeight: 18 },
  basLigne2: { backgroundColor: 'transparent', fontWeight: 'bold', fontSize: 16, lineHeight: 22 },
  ecart: { height: 12 },
  // Rend l'effet de degrade sans dependance native : une pastille claire
  // debordant en haut a droite, comme sur les cartes bancaires.
  halo: {
    position: 'absolute',
    top: -70,
    right: -50,
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
  },
  haloSecond: {
    position: 'absolute',
    bottom: -60,
    left: -40,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
  },
  puceDefaut: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    marginBottom: 6,
  },
});

const OPACITE_SECONDAIRE = 0.85;

export function WalletCard({
  wallet,
  soldeFcfa,
  onPress,
  onLongPress,
  pleineLargeur = false,
}: {
  wallet: LinkedWallet;
  /** Non fourni = solde inconnu, la carte le dit au lieu d'afficher zéro. */
  soldeFcfa?: number;
  onPress?: () => void;
  onLongPress?: () => void;
  /** Dans une liste verticale plutôt que dans le carrousel horizontal. */
  pleineLargeur?: boolean;
}) {
  const { width } = useWindowDimensions();
  const echelle = React.useRef(new Animated.Value(1)).current;

  const animer = React.useCallback(
    (vers: number) => {
      Animated.spring(echelle, {
        toValue: vers,
        damping: 14,
        stiffness: 180,
        useNativeDriver: true,
      }).start();
    },
    [echelle],
  );

  const { fond, texte } = couleurOperateur(wallet.operator);
  const nom = wallet.nickname && wallet.nickname !== wallet.operator
    ? wallet.nickname
    : etiquetteOperateur(wallet.operator);

  const enPanne = wallet.status !== 'active';

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={() => animer(0.97)}
      onPressOut={() => animer(1)}
      style={pleineLargeur ? undefined : styles.racine}
      accessibilityRole="button"
      accessibilityLabel={`${nom}, ${soldeFcfa === undefined ? 'solde inconnu' : `${formatAmount(soldeFcfa)} francs`}`}
    >
      <Animated.View
        style={[
          styles.carte,
          { backgroundColor: fond, opacity: enPanne ? 0.55 : 1 },
          pleineLargeur ? { width: '100%' } : { width: largeurCarte(width) },
          { transform: [{ scale: echelle }] },
        ]}
      >
        <View style={styles.halo} pointerEvents="none" />
        <View style={styles.haloSecond} pointerEvents="none" />

        <View style={styles.contenu}>
          {wallet.isDefault
            ? (
                <View style={styles.puceDefaut}>
                  <Text style={{ color: texte, fontSize: 11, fontWeight: '700' }}>
                    PAR DÉFAUT
                  </Text>
                </View>
              )
            : null}

          <Text style={[styles.nom, { color: texte, opacity: OPACITE_SECONDAIRE }]} numberOfLines={1}>
            {nom}
          </Text>

          <View style={styles.zoneSolde}>
            <Text style={[styles.solde, { color: texte }]} numberOfLines={1} adjustsFontSizeToFit>
              {soldeFcfa === undefined ? '— — —' : formatAmount(soldeFcfa)}
            </Text>
          </View>

          <View style={styles.ecart} />

          <Text style={[styles.basLigne1, { color: texte, opacity: OPACITE_SECONDAIRE }]}>
            {enPanne ? 'Portefeuille indisponible' : 'FCFA disponibles'}
          </Text>
          <Text style={[styles.basLigne2, { color: texte }]} numberOfLines={1}>
            {masquerNumero(wallet.phoneNumber)}
          </Text>
        </View>
      </Animated.View>
    </Pressable>
  );
}

/** Libellé lisible d'un opérateur, sans dépendre du moteur. */
function etiquetteOperateur(id: string): string {
  const table: Record<string, string> = {
    wave: 'Wave',
    orange_money: 'Orange Money',
    mtn_momo: 'MTN MoMo',
    moov_money: 'Moov Money',
    djamo: 'Djamo',
    push_ci: 'Push CI',
  };
  return table[id] ?? id;
}

