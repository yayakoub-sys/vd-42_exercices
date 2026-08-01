import { Stack } from 'expo-router';

export default function AccountLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="profile" options={{ title: 'Profil' }} />
      <Stack.Screen name="edit" options={{ title: 'Modifier mes informations' }} />
      <Stack.Screen name="documents" options={{ title: "Mes documents d'identité" }} />
      <Stack.Screen name="security" options={{ title: 'Sécurité' }} />
      <Stack.Screen name="notifications" options={{ title: 'Notifications' }} />
      <Stack.Screen name="help" options={{ title: 'Aide' }} />
      <Stack.Screen name="support" options={{ title: 'Contacter le support' }} />
      <Stack.Screen name="about" options={{ title: 'À propos' }} />
    </Stack>
  );
}
