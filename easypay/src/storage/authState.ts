import type { AuthState } from '@/core/wallet-engine/types';

import * as Crypto from 'expo-crypto';
import { getItem, setItem } from '@/lib/storage';

const AUTH_KEY = 'auth_state_v1';
// Le code secret n'est jamais stocké en clair : on garde un sel aléatoire propre à
// l'appareil (PIN_SALT_KEY) et l'empreinte SHA-256 de "sel + code" (PIN_HASH_KEY).
// Vérifier un code revient à refaire le même calcul et comparer les empreintes.
const PIN_SALT_KEY = 'auth_pin_salt_v1';
const PIN_HASH_KEY = 'auth_pin_hash_v1';

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

async function hashPin(pin: string, salt: string): Promise<string> {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, `${salt}:${pin}`);
}

export async function getAuthState(): Promise<AuthState> {
  return getItem<AuthState>(AUTH_KEY) ?? { pinSet: false, consentAccepted: false };
}

export async function setPhoneNumber(phoneNumber: string): Promise<void> {
  const state = await getAuthState();
  await setItem(AUTH_KEY, { ...state, phoneNumber });
}

export async function setPin(pin: string): Promise<void> {
  const state = await getAuthState();
  const salt = bytesToHex(await Crypto.getRandomBytesAsync(16));
  const hash = await hashPin(pin, salt);
  await setItem(AUTH_KEY, { ...state, pinSet: true });
  await setItem(PIN_SALT_KEY, salt);
  await setItem(PIN_HASH_KEY, hash);
}

export async function verifyPin(pin: string): Promise<boolean> {
  const salt = getItem<string>(PIN_SALT_KEY);
  const storedHash = getItem<string>(PIN_HASH_KEY);
  if (!salt || !storedHash)
    return false;
  const hash = await hashPin(pin, salt);
  return hash === storedHash;
}

export async function setConsentAccepted(): Promise<void> {
  const state = await getAuthState();
  await setItem(AUTH_KEY, { ...state, consentAccepted: true });
}

export async function isOnboardingComplete(): Promise<boolean> {
  const state = await getAuthState();
  return Boolean(state.phoneNumber && state.pinSet && state.consentAccepted);
}
