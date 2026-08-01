import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack>
      <Stack.Screen name="welcome" options={{ headerShown: false }} />
      <Stack.Screen name="phone" options={{ title: 'Numéro de téléphone' }} />
      <Stack.Screen name="otp" options={{ title: 'Code reçu par SMS' }} />
      <Stack.Screen name="pin-create" options={{ title: 'Code secret', headerBackVisible: false }} />
      <Stack.Screen name="pin-confirm" options={{ title: 'Confirmer le code' }} />
      <Stack.Screen name="consent" options={{ title: 'Avant de continuer' }} />
      <Stack.Screen name="personal-info" options={{ title: 'Tes informations' }} />
      <Stack.Screen name="kyc-status" options={{ headerShown: false }} />
    </Stack>
  );
}
