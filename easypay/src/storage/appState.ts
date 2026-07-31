import { getItem, removeItem, setItem } from '@/lib/storage';
import type { ScanHistoryEntry } from '../core/history';

// Le "premier lancement" (accueil affiché une seule fois) est déjà géré par
// le modèle de départ via useIsFirstTime() (src/lib/hooks) — inutile de le
// dupliquer ici, on ne garde que ce qui est propre à EasyPay : l'historique.

const HISTORY_KEY = 'scan_history_v1';
const HISTORY_LIMIT = 20;

export async function getHistory(): Promise<ScanHistoryEntry[]> {
  return getItem<ScanHistoryEntry[]>(HISTORY_KEY) ?? [];
}

/** Ajoute une entrée en tête de liste et garde seulement les HISTORY_LIMIT dernières. */
export async function addHistoryEntry(entry: ScanHistoryEntry): Promise<ScanHistoryEntry[]> {
  const current = await getHistory();
  const next = [entry, ...current].slice(0, HISTORY_LIMIT);
  await setItem(HISTORY_KEY, next);
  return next;
}

export async function clearHistory(): Promise<void> {
  await removeItem(HISTORY_KEY);
}
