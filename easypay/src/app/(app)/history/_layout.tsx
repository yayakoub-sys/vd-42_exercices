import { Stack } from 'expo-router';

export default function HistoryLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="[id]" options={{ title: 'Reçu' }} />
      <Stack.Screen name="filter" options={{ presentation: 'modal', title: 'Filtrer' }} />
      <Stack.Screen name="report" options={{ presentation: 'modal', title: 'Signaler un problème' }} />
    </Stack>
  );
}
