import { createStore, mergeDefaults } from "../lib/store";
import { DEFAULT_CONTENT } from "./defaultContent";
import { DEFAULT_ROYALTY } from "./constants";
import type { Lead, Rep, Sale, Settings, SiteContent, SiteEvent, Subscriber } from "./types";

// One localStorage key per collection; all prefixed "wa." so backups and the usage meter can find them.
export const contentStore = createStore<SiteContent>("wa.content.v1", () => DEFAULT_CONTENT, (raw) =>
  mergeDefaults(DEFAULT_CONTENT, raw),
);

export const DEFAULT_SETTINGS: Settings = {
  ownerName: "Dr. Antoine",
  currency: "USD",
  monthlyUnitTarget: 100,
  monthlyRevenueTarget: 1500,
  royaltyRates: DEFAULT_ROYALTY,
  // salted SHA-256 of the starting passcode (see README). Changing it in Settings saves a new hash.
  passHash: "ae64a9ecce7b0519dccb32f7186c710009503e64b4049d840069b1d1b86a17c0",
  passSalt: "wa-default-v1",
};
export const settingsStore = createStore<Settings>("wa.settings.v1", () => DEFAULT_SETTINGS, (raw) =>
  mergeDefaults(DEFAULT_SETTINGS, raw),
);

const list = <T,>(raw: unknown): T[] => (Array.isArray(raw) ? (raw as T[]) : []);

export const salesStore = createStore<Sale[]>("wa.sales.v1", () => [], list<Sale>);
export const leadsStore = createStore<Lead[]>("wa.leads.v1", () => [], list<Lead>);
export const repsStore = createStore<Rep[]>("wa.reps.v1", () => [], list<Rep>);
export const subscribersStore = createStore<Subscriber[]>("wa.subscribers.v1", () => [], list<Subscriber>);
export const eventsStore = createStore<SiteEvent[]>("wa.events.v1", () => [], list<SiteEvent>);

export const ALL_STORES = [contentStore, settingsStore, salesStore, leadsStore, repsStore, subscribersStore, eventsStore];

/** Everything in one JSON document, for Settings → Export backup. */
export function exportBackup() {
  return {
    app: "wilson-antoine",
    version: 1,
    exportedAt: new Date().toISOString(),
    data: Object.fromEntries(ALL_STORES.map((s) => [s.key, s.get()])),
  };
}

export function importBackup(json: unknown): number {
  if (!json || typeof json !== "object" || (json as { app?: string }).app !== "wilson-antoine") {
    throw new Error("That file isn't a Wilson Antoine backup.");
  }
  const data = (json as { data?: Record<string, unknown> }).data ?? {};
  let restored = 0;
  for (const store of ALL_STORES) {
    if (store.key in data) {
      // a settings restore keeps the passcode currently in use, so a backup can't lock you out
      if (store === settingsStore) {
        const current = settingsStore.get();
        settingsStore.set({
          ...mergeDefaults(DEFAULT_SETTINGS, data[store.key]),
          passHash: current.passHash,
          passSalt: current.passSalt,
        });
      } else if (store === contentStore) {
        contentStore.set(mergeDefaults(DEFAULT_CONTENT, data[store.key]));
      } else {
        (store.set as (v: unknown) => void)(Array.isArray(data[store.key]) ? data[store.key] : []);
      }
      restored++;
    }
  }
  return restored;
}
