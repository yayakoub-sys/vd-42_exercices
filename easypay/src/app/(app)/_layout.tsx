import { Redirect, Tabs } from 'expo-router';
import * as React from 'react';

import { Text } from '@/components/ui';
import {
  Feed as HistoryIcon,
  Home as ScannerIcon,
  Settings as AccountIcon,
} from '@/components/ui/icons';
import { isOnboardingComplete } from '@/storage/authState';

// Icône simple, cohérente avec les autres (pas de nouvelle police d'icônes) : un portefeuille stylisé.
function WalletsIcon({ color }: { color: string }) {
  return <Text style={{ fontSize: 22, color }}>◫</Text>;
}

export default function TabLayout() {
  const [checking, setChecking] = React.useState(true);
  const [complete, setComplete] = React.useState(false);

  React.useEffect(() => {
    isOnboardingComplete().then((value) => {
      setComplete(value);
      setChecking(false);
    });
  }, []);

  if (checking) {
    return null;
  }

  if (!complete) {
    return <Redirect href="/(auth)/welcome" />;
  }

  return (
    <Tabs>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Scanner',
          headerShown: false,
          tabBarIcon: ({ color }) => <ScannerIcon color={color} />,
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
  );
}
