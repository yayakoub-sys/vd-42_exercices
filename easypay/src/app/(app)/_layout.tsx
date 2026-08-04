import { Redirect, Tabs } from 'expo-router';
import * as React from 'react';

import {
  AccountIcon,
  HistoryIcon,
  ScanIcon,
  WalletsIcon,
} from '@/components/ui/icons/tabs';
import { isOnboardingComplete } from '@/storage/authState';

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
  );
}
