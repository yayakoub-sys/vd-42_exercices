/**
 * Bouchon JS de `react-native-mmkv` pour la visite des ecrans dans Expo Go.
 *
 * MMKV est un module natif : il n'existe pas dans Expo Go. Ce fichier fournit
 * la meme surface d'API, adossee a une simple Map en memoire vive.
 * Limite assumee : rien n'est persiste, l'app repart "neuve" a chaque relance.
 *
 * Actif UNIQUEMENT quand EXPO_PUBLIC_GO=1 (voir metro.config.js).
 */
const { useCallback, useEffect, useState } = require('react');

function createInstance() {
  const map = new Map();
  const listeners = new Set();

  const notify = (key) => {
    listeners.forEach((listener) => {
      try {
        listener(key);
      }
      catch {}
    });
  };

  const read = (key) => (map.has(key) ? map.get(key) : undefined);

  return {
    getString: read,
    getNumber: read,
    getBoolean: read,
    getBuffer: read,
    contains: key => map.has(key),
    getAllKeys: () => [...map.keys()],
    set: (key, value) => {
      map.set(key, value);
      notify(key);
    },
    remove: (key) => {
      map.delete(key);
      notify(key);
    },
    delete: (key) => {
      map.delete(key);
      notify(key);
    },
    clearAll: () => {
      const keys = [...map.keys()];
      map.clear();
      keys.forEach(notify);
    },
    recrypt: () => {},
    trim: () => {},
    addOnValueChangedListener: (listener) => {
      listeners.add(listener);
      return { remove: () => listeners.delete(listener) };
    },
    size: 0,
    isReadOnly: false,
  };
}

const defaultInstance = createInstance();

function createMMKV() {
  return createInstance();
}

// Certaines versions exposent une classe `MMKV`.
function MMKV() {
  return createInstance();
}

function useTypedMMKV(key, instance) {
  const store = instance || defaultInstance;
  const [value, setValue] = useState(() => store.getString(key));

  useEffect(() => {
    setValue(store.getString(key));
    const sub = store.addOnValueChangedListener((changedKey) => {
      if (changedKey === key)
        setValue(store.getString(key));
    });
    return () => sub.remove();
  }, [key, store]);

  const set = useCallback((next) => {
    const resolved = typeof next === 'function' ? next(store.getString(key)) : next;
    if (resolved === undefined || resolved === null)
      store.remove(key);
    else
      store.set(key, resolved);
  }, [key, store]);

  return [value, set];
}

module.exports = {
  createMMKV,
  MMKV,
  Mode: { SINGLE_PROCESS: 'SINGLE_PROCESS', MULTI_PROCESS: 'MULTI_PROCESS' },
  useMMKV: instance => instance || defaultInstance,
  useMMKVString: useTypedMMKV,
  useMMKVNumber: useTypedMMKV,
  useMMKVBoolean: useTypedMMKV,
  useMMKVBuffer: useTypedMMKV,
  useMMKVObject: (key, instance) => {
    const [raw, setRaw] = useTypedMMKV(key, instance);
    const parsed = raw === undefined ? undefined : JSON.parse(raw);
    return [parsed, next => setRaw(next === undefined ? undefined : JSON.stringify(next))];
  },
  useMMKVListener: (listener, instance) => {
    const store = instance || defaultInstance;
    useEffect(() => {
      const sub = store.addOnValueChangedListener(listener);
      return () => sub.remove();
    }, [listener, store]);
  },
};
