import { useLocalSearchParams, useRouter } from 'expo-router';
import * as React from 'react';
import { ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, FocusAwareStatusBar, Text, View } from '@/components/ui';

/**
 * Conditions d'utilisation et politique de confidentialité.
 *
 * CORRIGÉ (ETAT.md § 9.4) : les deux liens ouvraient une boîte disant « le
 * texte complet sera bientôt disponible ici ». Faire accepter des conditions
 * que personne ne peut lire, c'est demander une signature sur une feuille
 * blanche.
 *
 * ⚠️ CE QUI SUIT N'EST PAS UN TEXTE JURIDIQUE. C'est une description honnête,
 * en français simple, de ce que l'application fait réellement aujourd'hui —
 * vérifiable dans le code. Le document juridique devra être rédigé par un
 * juriste avant toute mise en service réelle, et cet écran le dit clairement
 * à l'utilisateur plutôt que de le laisser croire le contraire.
 */

type Bloc = { titre: string; texte: string };

const CONDITIONS: Bloc[] = [
  {
    titre: 'Ce que fait EasyPay',
    texte:
      "EasyPay lit le QR de paiement d'un commerçant et te laisse choisir avec "
      + "lequel de tes comptes mobile money tu veux payer — quel que soit "
      + 'celui que le commerçant affiche.',
  },
  {
    titre: 'Ce que ça te coûte',
    texte:
      'EasyPay prélève une commission sur chaque paiement. Elle est affichée '
      + 'avant que tu valides, jamais après. Le total débité est toujours '
      + 'annoncé en toutes lettres sur le récapitulatif.',
  },
  {
    titre: 'Ton accord',
    texte:
      'Aucun paiement ne part sans ton code secret. Tu peux annuler à chaque '
      + "étape tant que tu n'as pas saisi ce code.",
  },
  {
    titre: 'Tes comptes',
    texte:
      "Relier un compte ne donne pas à EasyPay le droit d'y puiser librement : "
      + "chaque paiement est autorisé un par un. Tu peux retirer un compte à "
      + "tout moment depuis l'écran de ce compte.",
  },
  {
    titre: 'Ce qui reste à faire',
    texte:
      "Cette version est un prototype. Les paiements sont simulés : aucun "
      + "argent réel ne circule. Le texte juridique définitif sera publié avant "
      + 'toute mise en service.',
  },
];

const CONFIDENTIALITE: Bloc[] = [
  {
    titre: 'Ce qui reste sur ton téléphone',
    texte:
      'Ton code secret, tes comptes reliés et ton historique de paiements sont '
      + "enregistrés sur ton téléphone. Le code n'est jamais enregistré tel "
      + "quel : seule une empreinte est conservée, qui ne permet pas de le "
      + 'retrouver.',
  },
  {
    titre: 'Le QR que tu scannes',
    texte:
      'Le code du commerçant est lu sur ton téléphone. La caméra ne '
      + "photographie rien et n'envoie rien.",
  },
  {
    titre: 'Ce que nous ne faisons pas',
    texte:
      "EasyPay ne revend aucune donnée, n'affiche aucune publicité, et ne "
      + 'partage ton historique avec personne.',
  },
  {
    titre: 'Effacer tes données',
    texte:
      "Depuis l'écran Compte, « Supprimer mon compte » efface tes informations. "
      + 'Retirer un compte mobile money efface aussi le lien avec ce compte.',
  },
];

export default function LegalScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { doc } = useLocalSearchParams<{ doc?: string }>();

  const confidentialite = doc === 'privacy';
  const blocs = confidentialite ? CONFIDENTIALITE : CONDITIONS;
  const titre = confidentialite
    ? 'Politique de confidentialité'
    : "Conditions d'utilisation";

  return (
    <View className="flex-1 bg-white dark:bg-black">
      <FocusAwareStatusBar />
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 12,
          paddingBottom: 24,
          paddingHorizontal: 20,
        }}
      >
        <Text className="text-2xl font-bold">{titre}</Text>

        <View className="mt-4 rounded-2xl bg-warning-100 p-4 dark:bg-warning-900">
          <Text className="text-sm text-warning-800 dark:text-warning-200">
            Version prototype. Ce texte décrit ce que l'application fait
            réellement, en français simple. Il ne remplace pas un document
            juridique, qui sera publié avant toute mise en service.
          </Text>
        </View>

        {blocs.map(b => (
          <View key={b.titre} className="mt-7">
            <Text className="text-base font-bold">{b.titre}</Text>
            <Text className="mt-1.5 text-[15px] leading-6 text-neutral-600 dark:text-neutral-300">
              {b.texte}
            </Text>
          </View>
        ))}
      </ScrollView>

      <View style={{ paddingBottom: insets.bottom + 16 }} className="px-5">
        <Button label="J'ai lu" onPress={() => router.back()} />
      </View>
    </View>
  );
}
