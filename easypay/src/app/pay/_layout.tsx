import { Stack } from 'expo-router';

export default function PayLayout() {
  return (
    <Stack>
      <Stack.Screen name="manual-entry" options={{ title: 'Coller un code' }} />
      <Stack.Screen name="preview" options={{ headerShown: false }} />
      <Stack.Screen name="unrecognized" options={{ headerShown: false }} />
      <Stack.Screen name="amount" options={{ title: 'Montant' }} />
      <Stack.Screen name="choose-source" options={{ title: 'Payer avec' }} />
      <Stack.Screen name="recap" options={{ title: 'Récapitulatif' }} />
      <Stack.Screen name="redirect" options={{ headerShown: false, gestureEnabled: false }} />
      <Stack.Screen name="waiting" options={{ headerShown: false, gestureEnabled: false }} />
      <Stack.Screen name="success" options={{ headerShown: false, gestureEnabled: false }} />
      <Stack.Screen name="fail" options={{ headerShown: false }} />
      <Stack.Screen name="insufficient-funds" options={{ headerShown: false }} />
    </Stack>
  );
}
