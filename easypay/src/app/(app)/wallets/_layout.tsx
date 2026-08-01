import { Stack } from 'expo-router';

export default function WalletsLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Mes portefeuilles' }} />
      <Stack.Screen name="add" options={{ title: 'Ajouter un portefeuille' }} />
      <Stack.Screen name="add-phone" options={{ title: 'Numéro du portefeuille' }} />
      <Stack.Screen name="add-explain" options={{ title: 'Autorisation' }} />
      <Stack.Screen name="add-waiting" options={{ headerShown: false }} />
      <Stack.Screen name="add-success" options={{ headerShown: false }} />
      <Stack.Screen name="add-fail" options={{ headerShown: false }} />
      <Stack.Screen name="[id]" options={{ title: 'Portefeuille' }} />
      <Stack.Screen name="set-default" options={{ presentation: 'modal', title: 'Par défaut' }} />
      <Stack.Screen name="remove" options={{ presentation: 'modal', title: 'Retirer' }} />
    </Stack>
  );
}
