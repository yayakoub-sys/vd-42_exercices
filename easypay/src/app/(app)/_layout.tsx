import { Redirect, Tabs } from 'expo-router';
import * as React from 'react';

import {
  AccountIcon,
  HistoryIcon,
  ScanIcon,
  WalletsIcon,
} from '@/components/ui/icons/tabs';
import { AppLock } from '@/features/auth/app-lock';
import { isOnboardingComplete } from '@/storage/authState';

/**
 * Le verrou d'ouverture enveloppe TOUTE la partie connectée : tant que le code
 * n'est pas donné, aucun onglet n'est monté, donc aucun montant n'apparaît,
 * même une fraction de seconde.
 */
export default function TabLayout() {
  const [verification, setVerification] = React.useState(true);
  const [inscriptionFaite, setInscriptionFaite] = React.useState(false);

  React.useEffect(() => {
    isOnboardingComplete().then((fait) => {
      setInscriptionFaite(fait);
      setVerification(false);
    });
  }, []);

  if (verification)
    return null;
  if (!inscriptionFaite)
    return <Redirect href="/(auth)/welcome" />;

  return (
    <AppLock>
      <Tabs>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Scanner',
            headerShown: false,
            tabBarIcon: ({ color }) => <ScanIcon color={color} />,
            tabBarButtonTestID: 'scanner-tab',
          }}
        />
        <Tabs.Screen
          name="wallets"
          options={{
            title: 'Portefeuilles',
            headerShown: false,
            tabBarIcon: ({ color }) => <WalletsIcon color={color} />,
            tabBarButtonTestID: 'wallets-tab',
          }}
        />
        <Tabs.Screen
          name="history"
          options={{
            title: 'Historique',
            headerShown: false,
            tabBarIcon: ({ color }) => <HistoryIcon color={color} />,
            tabBarButtonTestID: 'history-tab',
          }}
        />
        <Tabs.Screen
          name="account"
          options={{
            title: 'Compte',
            headerShown: false,
            tabBarIcon: ({ color }) => <AccountIcon color={color} />,
            tabBarButtonTestID: 'account-tab',
          }}
        />
      </Tabs>
    </AppLock>
  );
}
