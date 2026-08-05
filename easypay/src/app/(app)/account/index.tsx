import type { AuthState, KycProfile } from '@/core/wallet-engine/types';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import * as React from 'react';

import { Alert } from 'react-native';
import {
  FocusAwareStatusBar,
  Pressable,
  ScrollView,
  Text,
  View,
} from '@/components/ui';
import { ArrowRight } from '@/components/ui/icons';
import { LanguageItem } from '@/features/settings/components/language-item';
import { SettingsContainer } from '@/features/settings/components/settings-container';
import { ThemeItem } from '@/features/settings/components/theme-item';
import { getAuthState } from '@/storage/authState';
import { getKycProfile } from '@/storage/kycState';

function getInitials(name?: string): string {
  if (!name)
    return '?';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0)
    return '?';
  const first = parts[0].charAt(0);
  const last = parts.length > 1 ? parts[parts.length - 1].charAt(0) : '';
  return (first + last).toUpperCase();
}

function SectionTitle({ children }: { children: string }) {
  return <Text className="pt-4 pb-2 text-lg">{children}</Text>;
}

function AccountItem({
  label,
  onPress,
  danger,
}: {
  label: string;
  onPress?: () => void;
  danger?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      pointerEvents={onPress ? 'auto' : 'none'}
      className="flex-1 flex-row items-center justify-between px-4 py-3"
    >
      <Text className={danger ? 'text-danger-600' : undefined}>{label}</Text>
      {onPress
        ? (
            <ArrowRight />
          )
        : null}
    </Pressable>
  );
}

export default function AccountHomeScreen() {
  const router = useRouter();
  const [auth, setAuth] = React.useState<AuthState | null>(null);
  const [kyc, setKyc] = React.useState<KycProfile | null>(null);

  const load = React.useCallback(() => {
    getAuthState().then(setAuth);
    getKycProfile().then(setKyc);
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      load();
    }, [load]),
  );

  const isVerified = kyc?.status === 'verified';

  const onLogout = () => {
    Alert.alert(
      'Se déconnecter',
      'Tu devras te reconnecter pour utiliser EasyPay la prochaine fois.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Se déconnecter',
          style: 'destructive',
          onPress: () => router.replace('/(auth)/welcome'),
        },
      ],
    );
  };

  const onDeleteAccount = () => {
    Alert.alert(
      'Supprimer mon compte',
      'Cette action est définitive : toutes tes informations seraient supprimées. Veux-tu continuer ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () =>
            Alert.alert(
              'Demande enregistrée',
              'Ta demande de suppression a bien été prise en compte.',
            ),
        },
      ],
    );
  };

  return (
    <>
      <FocusAwareStatusBar />
      <ScrollView>
        <View className="flex-1 px-4 pt-16 pb-10">
          <Text className="text-xl font-bold">Compte</Text>

          <View className="mt-4 flex-row items-center rounded-md border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-800">
            <View className="mr-4 size-14 items-center justify-center rounded-full bg-primary-800 dark:bg-primary-600">
              <Text className="text-lg font-bold text-white">
                {getInitials(kyc?.fullName)}
              </Text>
            </View>
            <View className="flex-1">
              <Text className="text-base font-semibold">
                {kyc?.fullName ?? 'Nom non renseigné'}
              </Text>
              <Text className="text-sm text-neutral-500 dark:text-neutral-400">
                {auth?.phoneNumber ?? 'Numéro non renseigné'}
              </Text>
              <View
                className={
                  isVerified
                    ? 'mt-2 self-start rounded-full bg-success-100 px-3 py-1 dark:bg-success-900'
                    : 'mt-2 self-start rounded-full bg-warning-100 px-3 py-1 dark:bg-warning-900'
                }
              >
                <Text
                  className={
                    isVerified
                      ? 'text-xs font-semibold text-success-700 dark:text-success-300'
                      : 'text-xs font-semibold text-warning-700 dark:text-warning-300'
                  }
                >
                  {isVerified ? 'Identité vérifiée ✓' : 'Vérification en attente'}
                </Text>
              </View>
            </View>
          </View>

          <SectionTitle>Mon compte</SectionTitle>
          <SettingsContainer>
            <AccountItem label="Profil" onPress={() => router.push('/(app)/account/profile')} />
            <AccountItem
              label="Mes documents"
              onPress={() => router.push('/(app)/account/documents')}
            />
            <AccountItem label="Sécurité" onPress={() => router.push('/(app)/account/security')} />
            <AccountItem
              label="Notifications"
              onPress={() => router.push('/(app)/account/notifications')}
            />
          </SettingsContainer>

          <SectionTitle>Général</SectionTitle>
          <SettingsContainer>
            <LanguageItem />
            <ThemeItem />
          </SettingsContainer>

          <SectionTitle>Assistance</SectionTitle>
          <SettingsContainer>
            <AccountItem label="Aide" onPress={() => router.push('/(app)/account/help')} />
            <AccountItem
              label="Contacter le support"
              onPress={() => router.push('/(app)/account/support')}
            />
            <AccountItem label="À propos" onPress={() => router.push('/(app)/account/about')} />
          </SettingsContainer>

          <View className="mt-8 items-center">
            <Pressable onPress={onLogout} className="py-3">
              <Text className="text-base font-semibold text-danger-600">Se déconnecter</Text>
            </Pressable>
            <Pressable onPress={onDeleteAccount} className="py-2">
              <Text className="text-sm text-neutral-400 dark:text-neutral-500">
                Supprimer mon compte
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </>
  );
}
