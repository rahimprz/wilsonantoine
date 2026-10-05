import { useSyncExternalStore } from "react";

/**
 * A tiny persistent store backed by localStorage.
 *
 * Everything the admin edits lives in this browser until a backend is connected. Each store is
 * one localStorage key, so swapping persistence later (Firebase, Supabase, an API) means replacing
 * load()/save() here and nothing in the UI.
 */
export interface Store<T> {
  get: () => T;
  set: (next: T | ((prev: T) => T)) => void;
  reset: () => void;
  subscribe: (listener: () => void) => () => void;
  key: string;
}

type Listener = () => void;
const errorListeners = new Set<(message: string) => void>();

/** Lets the admin surface "storage is full" instead of silently losing a save. */
export function onStorageError(listener: (message: string) => void) {
  errorListeners.add(listener);
  return () => {
    errorListeners.delete(listener);
  };
}

export function createStore<T>(key: string, initial: () => T, migrate?: (raw: unknown) => T): Store<T> {
  const listeners = new Set<Listener>();

  const load = (): T => {
    try {
      const raw = localStorage.getItem(key);
      if (raw != null) {
        const parsed = JSON.parse(raw) as unknown;
        return migrate ? migrate(parsed) : (parsed as T);
      }
    } catch {
      /* corrupted or unavailable storage falls back to defaults */
    }
    return initial();
  };

  let state = load();
  const emit = () => listeners.forEach((l) => l());

  const store: Store<T> = {
    key,
    get: () => state,
    set(next) {
      state = typeof next === "function" ? (next as (prev: T) => T)(state) : next;
      try {
        localStorage.setItem(key, JSON.stringify(state));
      } catch (err) {
        const msg =
          err instanceof DOMException && err.name === "QuotaExceededError"
            ? "Browser storage is full. Export a backup, then remove old records or demo data."
            : "Couldn't save to browser storage.";
        errorListeners.forEach((l) => l(msg));
      }
      emit();
    },
    reset() {
      try {
        localStorage.removeItem(key);
      } catch {
        /* ignore */
      }
      state = initial();
      emit();
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };

  // keep tabs in sync: saving in the admin updates an open copy of the site immediately
  if (typeof window !== "undefined") {
    window.addEventListener("storage", (e) => {
      if (e.key === key) {
        state = load();
        emit();
      }
    });
  }
  return store;
}

/** Subscribes a component to a store. */
export function useStore<T>(store: Store<T>): T {
  return useSyncExternalStore(store.subscribe, store.get, store.get);
}

/** Deep-merges saved data over defaults, so fields added in later versions still get values. Arrays replace. */
export function mergeDefaults<T>(defaults: T, saved: unknown): T {
  if (Array.isArray(defaults)) return (Array.isArray(saved) ? saved : defaults) as T;
  if (defaults && typeof defaults === "object") {
    if (!saved || typeof saved !== "object" || Array.isArray(saved)) return defaults;
    const out: Record<string, unknown> = { ...(defaults as Record<string, unknown>) };
    for (const [k, v] of Object.entries(saved as Record<string, unknown>)) {
      out[k] = k in out ? mergeDefaults(out[k], v) : v;
    }
    return out as T;
  }
  return (saved === undefined || (typeof saved !== typeof defaults && defaults !== null) ? defaults : saved) as T;
}

/** Rough size of everything this site keeps in localStorage, for the settings page meter. */
export function storageBytes(prefix = "wa."): number {
  let total = 0;
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(prefix)) total += (k.length + (localStorage.getItem(k)?.length ?? 0)) * 2;
    }
  } catch {
    /* ignore */
  }
  return total;
}
