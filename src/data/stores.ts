import { createStore, mergeDefaults } from "../lib/store";
import { DEFAULT_CONTENT } from "./defaultContent";
import { DEFAULT_ROYALTY } from "./constants";
import type { Deal, Lead, Partner, Payout, PrintRun, Rep, Sale, Settings, SiteContent, SiteEvent, Statement, Subscriber } from "./types";

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

// ---------------------------------------------------------------- the publishing deal

export const DEFAULT_DEAL: Deal = {
  publisher: "Jinnx Book Press",
  startDate: "",
  listPrice: 25,
  vendorShare: 40,
  splitBy: "investment",
  customShares: {},
  splitScope: "printed",
  lowStockAt: 50,
};
export const dealStore = createStore<Deal>("wa.deal.v1", () => DEFAULT_DEAL, (raw) => mergeDefaults(DEFAULT_DEAL, raw));

export const DEFAULT_PARTNERS: Partner[] = [
  { id: "p_owner", name: "Dr. Wilson Antoine", role: "Author", investment: 0, owner: true, createdAt: 0 },
  { id: "p_publisher", name: "Jinnx Book Press", role: "Publisher", investment: 0, createdAt: 0 },
];
export const partnersStore = createStore<Partner[]>("wa.partners.v1", () => DEFAULT_PARTNERS, (raw) => {
  const rows = list<Partner>(raw);
  return rows.length ? rows : DEFAULT_PARTNERS;
});
export const printRunsStore = createStore<PrintRun[]>("wa.printruns.v1", () => [], list<PrintRun>);
export const payoutsStore = createStore<Payout[]>("wa.payouts.v1", () => [], list<Payout>);
export const statementsStore = createStore<Statement[]>("wa.statements.v1", () => [], list<Statement>);

export const ALL_STORES = [
  contentStore,
  settingsStore,
  salesStore,
  leadsStore,
  repsStore,
  subscribersStore,
  eventsStore,
  dealStore,
  partnersStore,
  printRunsStore,
  payoutsStore,
  statementsStore,
];
const OBJECT_DEFAULTS = new Map<unknown, unknown>([
  [contentStore, DEFAULT_CONTENT],
  [settingsStore, DEFAULT_SETTINGS],
  [dealStore, DEFAULT_DEAL],
]);

/** Everything in one JSON document, for Settings → Export backup. */
export function exportBackup() {
  return {
    app: "wilson-antoine",
    version: 2,
    exportedAt: new Date().toISOString(),
    data: Object.fromEntries(ALL_STORES.map((s) => [s.key, s.get()])),
  };
}

/**
 * Restores a backup. A normal backup replaces each collection it contains. A file marked
 * `"merge": true` (a setup or statement file) adds its records instead: rows are matched by id,
 * existing ones are kept, and settings-like objects are merged field by field.
 */
export function importBackup(json: unknown): number {
  if (!json || typeof json !== "object" || (json as { app?: string }).app !== "wilson-antoine") {
    throw new Error("That file isn't a Wilson Antoine backup.");
  }
  const merge = (json as { merge?: boolean }).merge === true;
  const data = (json as { data?: Record<string, unknown> }).data ?? {};
  let restored = 0;
  for (const store of ALL_STORES) {
    if (!(store.key in data)) continue;
    const incoming = data[store.key];
    const defaults = OBJECT_DEFAULTS.get(store);
    if (defaults) {
      const base = merge ? store.get() : defaults;
      const next = mergeDefaults(base, incoming) as Record<string, unknown>;
      // a restore keeps the passcode currently in use, so a backup can't lock you out
      if (store === settingsStore) {
        const current = settingsStore.get();
        next.passHash = current.passHash;
        next.passSalt = current.passSalt;
      }
      (store.set as (v: unknown) => void)(next);
    } else {
      const rows = Array.isArray(incoming) ? (incoming as { id?: string }[]) : [];
      if (merge) {
        const current = store.get() as { id?: string }[];
        const byId = new Map(rows.map((r) => [r.id, r]));
        // records already here are kept; for partners the incoming row updates the existing one
        const kept = current.map((r) => (store === partnersStore && byId.has(r.id) ? { ...r, ...byId.get(r.id) } : r));
        const known = new Set(current.map((r) => r.id));
        (store.set as (v: unknown) => void)([...kept, ...rows.filter((r) => !known.has(r.id))]);
      } else {
        (store.set as (v: unknown) => void)(rows);
      }
    }
    restored++;
  }
  return restored;
}
