import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ScanHistoryEntry } from '../core/history';

const ONBOARDING_KEY = 'onboarding_seen_v1';
const HISTORY_KEY = 'scan_history_v1';
const HISTORY_LIMIT = 20;

export async function hasSeenOnboarding(): Promise<boolean> {
  return (await AsyncStorage.getItem(ONBOARDING_KEY)) === 'true';
}

export async function markOnboardingSeen(): Promise<void> {
  await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
}

export async function getHistory(): Promise<ScanHistoryEntry[]> {
  const raw = await AsyncStorage.getItem(HISTORY_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as ScanHistoryEntry[];
  } catch {
    return [];
  }
}

/** Ajoute une entrée en tête de liste et garde seulement les HISTORY_LIMIT dernières. */
export async function addHistoryEntry(entry: ScanHistoryEntry): Promise<ScanHistoryEntry[]> {
  const current = await getHistory();
  const next = [entry, ...current].slice(0, HISTORY_LIMIT);
  await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  return next;
}

export async function clearHistory(): Promise<void> {
  await AsyncStorage.removeItem(HISTORY_KEY);
}
