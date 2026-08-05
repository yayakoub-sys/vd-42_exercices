import type { BarcodeScanningResult } from 'expo-camera';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as React from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { Button, FocusAwareStatusBar, Pressable, Text, View } from '@/components/ui';

/**
 * ============================================================================
 * SCANNER QR — porté depuis BlueWallet (licence MIT)
 * ============================================================================
 *
 * Origine : `screen/send/ScanQRCode.tsx` et `components/CameraScreen.tsx`.
 * Licence : MIT, voir `easypay/LICENSE-BLUEWALLET`.
 *
 * CE QU'ON REPREND DU DONNEUR — et pourquoi ça change tout :
 *
 *   1. UN VOILE SOMBRE AVEC UNE DÉCOUPE, pas un simple cadre blanc.
 *      L'œil va tout seul dans la zone claire. Un cadre posé sur une image
 *      nette n'oriente rien.
 *   2. DES ÉQUERRES AUX QUATRE COINS, pas un rectangle fermé. C'est le
 *      langage universel du viseur ; un rectangle plein ressemble à un bord
 *      de fenêtre.
 *   3. LA TORCHE. Un commerçant en fin de journée, un QR imprimé mal
 *      éclairé : sans torche on ne scanne pas.
 *   4. UNE SORTIE DE SECOURS quand la caméra ne veut pas : saisir le code
 *      à la main.
 *
 * CE QU'ON A RETIRÉ : import d'une image de la galerie, lecture de QR
 * animés (BC-UR, multi-parties) — c'est du transport de clés Bitcoin.
 *
 * TROIS DÉFAUTS D'ETAT.md CORRIGÉS ICI :
 *   § 9.4 — après UN scan, la caméra ne rescannait plus jamais tant que
 *           l'application n'était pas relancée : le verrou anti-double-scan
 *           n'était jamais relâché. Il l'est désormais, après un délai.
 *   § 9.4 — l'écran « Coller un code » existait mais AUCUN bouton n'y menait.
 *           Il est maintenant accessible d'ici.
 *   § 9.4 — un bouton « Historique » doublonnait l'onglet Historique déjà
 *           présent en bas. Retiré.
 */

/**
 * Le verrou se relâche après ce délai : assez pour ne pas scanner 10 fois
 *  le même QR, assez court pour pouvoir en scanner un autre juste après.
 */
const DELAI_REARMEMENT_MS = 2500;

const TAILLE_VISEUR = 0.68; // part de la largeur de l'écran
const EQUERRE = 34;
const EPAISSEUR = 4;

function Equerres({ taille }: { taille: number }) {
  const c = EQUERRE;
  const e = EPAISSEUR / 2;
  return (
    <Svg width={taille} height={taille} style={StyleSheet.absoluteFill}>
      <Path
        d={`M${e},${c} L${e},${e} L${c},${e}`}
        stroke="#FFFFFF"
        strokeWidth={EPAISSEUR}
        strokeLinecap="round"
        fill="none"
      />
      <Path
        d={`M${taille - c},${e} L${taille - e},${e} L${taille - e},${c}`}
        stroke="#FFFFFF"
        strokeWidth={EPAISSEUR}
        strokeLinecap="round"
        fill="none"
      />
      <Path
        d={`M${taille - e},${taille - c} L${taille - e},${taille - e} L${taille - c},${taille - e}`}
        stroke="#FFFFFF"
        strokeWidth={EPAISSEUR}
        strokeLinecap="round"
        fill="none"
      />
      <Path
        d={`M${c},${taille - e} L${e},${taille - e} L${e},${taille - c}`}
        stroke="#FFFFFF"
        strokeWidth={EPAISSEUR}
        strokeLinecap="round"
        fill="none"
      />
    </Svg>
  );
}

function IconeTorche({ allumee }: { allumee: boolean }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M13 2 4.5 13.5H11l-1 8.5 8.5-11.5H12l1-8.5Z"
        stroke="#FFFFFF"
        strokeWidth={1.8}
        strokeLinejoin="round"
        fill={allumee ? '#FFFFFF' : 'none'}
      />
    </Svg>
  );
}

function DemandePermission({
  onAutoriser,
  onSaisieManuelle,
}: {
  onAutoriser: () => void;
  onSaisieManuelle?: () => void;
}) {
  return (
    <View className="flex-1 items-center justify-center gap-4 bg-white p-8 dark:bg-black">
      <FocusAwareStatusBar />
      <Text className="text-center text-lg font-bold">Autoriser la caméra</Text>
      <Text className="text-center text-base text-neutral-500 dark:text-neutral-400">
        EasyPay lit le QR du commerçant avec la caméra. Rien n'est enregistré,
        rien n'est envoyé : le code est lu sur ton téléphone.
      </Text>
      <Button label="Autoriser la caméra" onPress={onAutoriser} className="mt-2" />
      {onSaisieManuelle
        ? (
            <Pressable onPress={onSaisieManuelle} className="py-3">
              <Text className="text-sm font-semibold text-primary-600">
                Ou saisir le code à la main
              </Text>
            </Pressable>
          )
        : null}
    </View>
  );
}

type Props = {
  onScanned: (rawData: string) => void;
  /** Saisie manuelle du code, quand la caméra ne s'en sort pas. */
  onSaisieManuelle?: () => void;
};

export function ScannerScreen({ onScanned, onSaisieManuelle }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const [torche, setTorche] = React.useState(false);
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const verrouille = React.useRef(false);
  const minuterie = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sans ce nettoyage, revenir sur l'ecran laisserait une minuterie orpheline.
  React.useEffect(() => () => {
    if (minuterie.current)
      clearTimeout(minuterie.current);
  }, []);

  const surCodeLu = React.useCallback(
    (resultat: BarcodeScanningResult) => {
      if (verrouille.current)
        return;
      verrouille.current = true;
      // On relache le verrou : c'est ce qui manquait, la camera restait
      // definitivement sourde apres le premier scan.
      minuterie.current = setTimeout(() => {
        verrouille.current = false;
      }, DELAI_REARMEMENT_MS);
      onScanned(resultat.data);
    },
    [onScanned],
  );

  if (!permission) {
    return <View className="flex-1 bg-black" />;
  }

  if (!permission.granted) {
    return (
      <DemandePermission
        onAutoriser={requestPermission}
        onSaisieManuelle={onSaisieManuelle}
      />
    );
  }

  const viseur = Math.round(width * TAILLE_VISEUR);

  return (
    <View className="flex-1 bg-black">
      <FocusAwareStatusBar />
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        enableTorch={torche}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={surCodeLu}
      />

      {/* Le voile sombre en quatre bandes : la decoupe centrale reste nette.
          C'est ce qui dirige l'oeil, bien mieux qu'un cadre pose sur l'image. */}
      <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' }} pointerEvents="none" />
        <View style={{ flexDirection: 'row', height: viseur }} pointerEvents="none">
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' }} />
          <View style={{ width: viseur }}>
            <Equerres taille={viseur} />
          </View>
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' }} />
        </View>
        <View style={{ flex: 1.35, backgroundColor: 'rgba(0,0,0,0.6)' }} pointerEvents="box-none">
          <View className="items-center px-8 pt-8" pointerEvents="box-none">
            <Text className="text-center text-lg font-semibold text-white">
              Vise le QR du commerçant
            </Text>
            <Text className="mt-2 text-center text-sm text-white/70">
              Le montant s'affichera avant que tu payes.
            </Text>

            {onSaisieManuelle
              ? (
                  <Pressable
                    onPress={onSaisieManuelle}
                    className="mt-7 rounded-full bg-white/15 px-5 py-3"
                    accessibilityRole="button"
                  >
                    <Text className="text-sm font-semibold text-white">
                      Saisir le code à la main
                    </Text>
                  </Pressable>
                )
              : null}
          </View>
        </View>
      </View>

      {/* La torche : sans elle, un QR imprime mal eclaire ne passe pas. */}
      <Pressable
        onPress={() => setTorche(t => !t)}
        style={{ position: 'absolute', right: 20, top: insets.top + 12 }}
        className={`size-12 items-center justify-center rounded-full ${torche ? 'bg-white/35' : 'bg-black/45'}`}
        accessibilityRole="button"
        accessibilityLabel={torche ? 'Éteindre la lampe' : 'Allumer la lampe'}
      >
        <IconeTorche allumee={torche} />
      </Pressable>
    </View>
  );
}
