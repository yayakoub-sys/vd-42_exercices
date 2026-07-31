import { Redirect, Tabs } from 'expo-router';
import * as React from 'react';

import {
  Feed as HistoryIcon,
  Home as ScannerIcon,
  Settings as SettingsIcon,
} from '@/components/ui/icons';
import { useIsFirstTime } from '@/lib/hooks/use-is-first-time';

export default function TabLayout() {
  const [isFirstTime] = useIsFirstTime();

  if (isFirstTime) {
    return <Redirect href="/onboarding" />;
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
        name="history"
        options={{
          title: 'Historique',
          headerShown: false,
          tabBarIcon: ({ color }) => <HistoryIcon color={color} />,
          tabBarButtonTestID: 'history-tab',
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Réglages',
          headerShown: false,
          tabBarIcon: ({ color }) => <SettingsIcon color={color} />,
          tabBarButtonTestID: 'settings-tab',
        }}
      />
    </Tabs>
  );
}
