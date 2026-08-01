import { getItem, setItem } from '@/lib/storage';
import type { AuthState } from '@/core/wallet-engine/types';

const AUTH_KEY = 'auth_state_v1';
// Simulation : le code secret n'est PAS stocké de façon sécurisée ici (pas de hash,
// pas de coffre système). Pour une vraie version, utiliser expo-secure-store et ne
// jamais garder le code en clair.
const PIN_KEY = 'auth_pin_v1_demo_only';

export async function getAuthState(): Promise<AuthState> {
  return getItem<AuthState>(AUTH_KEY) ?? { pinSet: false, consentAccepted: false };
}

export async function setPhoneNumber(phoneNumber: string): Promise<void> {
  const state = await getAuthState();
  await setItem(AUTH_KEY, { ...state, phoneNumber });
}

export async function setPin(pin: string): Promise<void> {
  const state = await getAuthState();
  await setItem(AUTH_KEY, { ...state, pinSet: true });
  await setItem(PIN_KEY, pin);
}

export async function verifyPin(pin: string): Promise<boolean> {
  const stored = getItem<string>(PIN_KEY);
  return stored === pin;
}

export async function setConsentAccepted(): Promise<void> {
  const state = await getAuthState();
  await setItem(AUTH_KEY, { ...state, consentAccepted: true });
}

export async function isOnboardingComplete(): Promise<boolean> {
  const state = await getAuthState();
  return Boolean(state.phoneNumber && state.pinSet && state.consentAccepted);
}
