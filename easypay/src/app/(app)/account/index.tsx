import type { AuthState, KycProfile } from '@/core/wallet-engine/types';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { Alert, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FocusAwareStatusBar, Pressable, Text, View } from '@/components/ui';
import { masquerNumero } from '@/components/wallet-card';
import { LanguageItem } from '@/features/settings/components/language-item';
import { SettingsContainer } from '@/features/settings/components/settings-container';
import { ThemeItem } from '@/features/settings/components/theme-item';
import { getAuthState } from '@/storage/authState';
import { getKycProfile } from '@/storage/kycState';

/**
 * COMPTE — porté depuis BlueWallet `screen/settings/Settings.tsx`
 * (licence MIT, voir LICENSE-BLUEWALLET).
 *
 * REPRIS : des sections coiffées d'un titre en petites capitales grises, des
 * lignes plates séparées par des filets, et les actions dangereuses reléguées
 * tout en bas, détachées du reste. Sur un écran de réglages, ce sont les
 * SÉPARATIONS qui rendent la liste lisible, pas les cadres.
 *
 * CORRIGÉ : l'écran commençait par un `pt-16` en dur, qui ne tient pas compte
 * de l'encoche. Il respecte maintenant la zone sûre, comme les autres.
 *
 * Et le numéro de téléphone est désormais MASQUÉ ici comme partout ailleurs :
 * il était affiché en clair sur cet écran seulement, avec deux masquages
 * différents dans le reste de l'application (ETAT.md § 9.4).
 */

function initiales(nom?: string): string {
  if (!nom)
    return '?';
  const parties = nom.trim().split(/\s+/).filter(Boolean);
  if (parties.length === 0)
    return '?';
  const premiere = parties[0].charAt(0);
  const derniere = parties.length > 1 ? parties[parties.length - 1].charAt(0) : '';
  return (premiere + derniere).toUpperCase();
}

function TitreSection({ children }: { children: string }) {
  return (
    <Text className="px-1 pt-7 pb-2 text-xs font-semibold tracking-wide text-neutral-400 uppercase dark:text-neutral-500">
      {children}
    </Text>
  );
}

function Ligne({
  libelle,
  onPress,
  danger = false,
}: {
  libelle: string;
  onPress?: () => void;
  danger?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center justify-between p-4"
      accessibilityRole="button"
    >
      <Text className={danger ? 'text-base font-semibold text-danger-600' : 'text-base'}>
        {libelle}
      </Text>
      {onPress ? <Text className="text-neutral-300 dark:text-neutral-600">›</Text> : null}
    </Pressable>
  );
}

function Identite({ kyc, auth }: { kyc: KycProfile | null; auth: AuthState | null }) {
  const verifie = kyc?.status === 'verified';
  return (
    <View className="flex-row items-center rounded-2xl bg-neutral-100 p-4 dark:bg-neutral-800">
      <View className="mr-4 size-14 items-center justify-center rounded-full bg-primary-800">
        <Text className="text-lg font-bold text-white">{initiales(kyc?.fullName)}</Text>
      </View>
      <View className="flex-1">
        <Text className="text-base font-semibold">
          {kyc?.fullName ?? 'Nom non renseigné'}
        </Text>
        <Text className="text-sm text-neutral-500 dark:text-neutral-400">
          {auth?.phoneNumber ? masquerNumero(auth.phoneNumber) : 'Numéro non renseigné'}
        </Text>
        <View
          className={`mt-2 self-start rounded-full px-3 py-1 ${
            verifie
              ? 'bg-success-100 dark:bg-success-900'
              : 'bg-warning-100 dark:bg-warning-900'
          }`}
        >
          <Text
            className={`text-xs font-semibold ${
              verifie
                ? 'text-success-700 dark:text-success-300'
                : 'text-warning-700 dark:text-warning-300'
            }`}
          >
            {verifie ? 'Identité vérifiée' : 'Identité à vérifier'}
          </Text>
        </View>
      </View>
    </View>
  );
}

export default function AccountHomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [auth, setAuth] = React.useState<AuthState | null>(null);
  const [kyc, setKyc] = React.useState<KycProfile | null>(null);

  const charger = React.useCallback(() => {
    getAuthState().then(setAuth);
    getKycProfile().then(setKyc);
  }, []);

  useFocusEffect(React.useCallback(() => charger(), [charger]));

  const deconnexion = () => {
    Alert.alert('Se déconnecter', 'Tu devras te reconnecter pour utiliser EasyPay.', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Se déconnecter',
        style: 'destructive',
        onPress: () => router.replace('/(auth)/welcome'),
      },
    ]);
  };

  const suppression = () => {
    Alert.alert(
      'Supprimer mon compte',
      'Cette action est définitive : toutes tes informations seraient supprimées.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () =>
            Alert.alert('Demande enregistrée', 'Ta demande a bien été prise en compte.'),
        },
      ],
    );
  };

  return (
    <View className="flex-1 bg-white dark:bg-black">
      <FocusAwareStatusBar />
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 12,
          paddingBottom: insets.bottom + 32,
          paddingHorizontal: 16,
        }}
      >
        <Text className="pb-4 text-[28px] font-bold">Compte</Text>

        <Identite kyc={kyc} auth={auth} />

        <TitreSection>Mon compte</TitreSection>
        <SettingsContainer>
          <Ligne libelle="Profil" onPress={() => router.push('/(app)/account/profile')} />
          <Ligne libelle="Mes documents" onPress={() => router.push('/(app)/account/documents')} />
          <Ligne libelle="Sécurité" onPress={() => router.push('/(app)/account/security')} />
          <Ligne
            libelle="Notifications"
            onPress={() => router.push('/(app)/account/notifications')}
          />
        </SettingsContainer>

        <TitreSection>Général</TitreSection>
        <SettingsContainer>
          <LanguageItem />
          <ThemeItem />
        </SettingsContainer>

        <TitreSection>Assistance</TitreSection>
        <SettingsContainer>
          <Ligne libelle="Aide" onPress={() => router.push('/(app)/account/help')} />
          <Ligne
            libelle="Contacter le support"
            onPress={() => router.push('/(app)/account/support')}
          />
          <Ligne libelle="À propos" onPress={() => router.push('/(app)/account/about')} />
        </SettingsContainer>

        <View className="mt-10 items-center">
          <Pressable onPress={deconnexion} className="py-3" accessibilityRole="button">
            <Text className="text-base font-semibold text-danger-600">Se déconnecter</Text>
          </Pressable>
          <Pressable onPress={suppression} className="py-2" accessibilityRole="button">
            <Text className="text-sm text-neutral-400 dark:text-neutral-500">
              Supprimer mon compte
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}
