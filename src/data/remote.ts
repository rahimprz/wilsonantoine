import type { SupabaseClient } from "@supabase/supabase-js";
import { useSyncExternalStore } from "react";
import { mergeDefaults, type Store } from "../lib/store";
import { uid } from "../lib/id";
import { DEFAULT_CONTENT } from "./defaultContent";
import {
  contentStore,
  DEFAULT_DEAL,
  DEFAULT_SETTINGS,
  dealStore,
  eventsStore,
  leadsStore,
  partnersStore,
  payoutsStore,
  printRunsStore,
  repsStore,
  salesStore,
  settingsStore,
  statementsStore,
  subscribersStore,
} from "./stores";

/**
 * Keeps the dashboard's collections in Supabase.
 *
 * The screens keep reading and writing the same in-browser stores; this module loads every
 * collection from the database when the owner signs in, then watches the stores and writes each
 * change back (only the rows that changed). The browser copy doubles as a cache.
 *
 * Column names are the record field names in snake_case — see supabase/migrations.
 */

type Kind = "s" | "n" | "b" | "j";
interface Field {
  kind: Kind;
  col?: string; // column name when it isn't the snake_case field name
  def?: unknown; // written when the record has no value
  optional?: boolean; // left off the record when the column is null
}
const s = (def: unknown = undefined): Field => ({ kind: "s", def });
const n = (def: unknown = undefined): Field => ({ kind: "n", def });
const b = (def: unknown = undefined, optional = false): Field => ({ kind: "b", def, optional });

type Row = Record<string, unknown>;
type Rec = Record<string, unknown> & { id?: string };

interface TableSpec {
  table: string;
  store: Store<Rec[]>;
  fields: Record<string, Field>;
  /** Only load rows newer than this (large, append-only tables). */
  since?: { col: string; value: () => number };
  /** Rows that may be deleted from the database when they disappear here (default: all). */
  deletable?: (rowJson: string) => boolean;
}

const TABLES: TableSpec[] = [
  {
    table: "sales",
    store: salesStore as unknown as Store<Rec[]>,
    fields: { id: s(), date: s(), channel: s(), format: s(), quantity: n(), unitPrice: n(), net: n(), cost: n(0), repId: s(""), customer: s(""), notes: s(""), demo: b(false, true), createdAt: n(0) },
  },
  {
    table: "partners",
    store: partnersStore as unknown as Store<Rec[]>,
    fields: { id: s(), name: s(), role: s(""), investment: n(0), owner: b(false, true), createdAt: n(0) },
  },
  {
    table: "print_runs",
    store: printRunsStore as unknown as Store<Rec[]>,
    fields: { id: s(), date: s(), format: s(), quantity: n(), unitCost: n(), printer: s(""), notes: s(""), demo: b(false, true), createdAt: n(0) },
  },
  {
    table: "payouts",
    store: payoutsStore as unknown as Store<Rec[]>,
    fields: { id: s(), date: s(), partnerId: s(), kind: s(), amount: n(), method: s(""), reference: s(""), notes: s(""), demo: b(false, true), createdAt: n(0) },
  },
  {
    table: "statements",
    store: statementsStore as unknown as Store<Rec[]>,
    fields: {
      id: s(),
      number: s(""),
      issuedOn: s(),
      start: { kind: "s", col: "period_start" },
      end: { kind: "s", col: "period_end" },
      source: s(),
      notes: s(""),
      snapshot: { kind: "j", def: null, optional: true },
      createdAt: n(0),
    },
  },
  {
    table: "reps",
    store: repsStore as unknown as Store<Rec[]>,
    fields: { id: s(), name: s(), email: s(""), phone: s(""), region: s(""), commission: n(0), monthlyTarget: n(0), active: b(true), demo: b(false, true), createdAt: n(0) },
  },
  {
    table: "leads",
    store: leadsStore as unknown as Store<Rec[]>,
    fields: {
      id: s(),
      org: s(),
      contact: s(""),
      email: s(""),
      phone: s(""),
      type: s(""),
      stage: s(),
      units: n(0),
      value: n(0),
      repId: s(""),
      followUp: s(""),
      notes: s(""),
      demo: b(false, true),
      createdAt: n(0),
      updatedAt: n(0),
    },
  },
  {
    table: "subscribers",
    store: subscribersStore as unknown as Store<Rec[]>,
    fields: { id: s(), email: s(), name: s(""), source: s(), date: s(), demo: b(false, true) },
  },
  {
    table: "site_events",
    store: eventsStore as unknown as Store<Rec[]>,
    fields: { id: s(), t: n(), type: s(), meta: { kind: "s", def: null, optional: true }, demo: b(false, true) },
    // visitors' events only ever accumulate: the dashboard reads the last ~13 months and only
    // removes demo events it added itself
    since: { col: "t", value: () => Date.now() - 400 * 864e5 },
    deletable: (json) => json.includes('"demo":true'),
  },
];

const snake = (k: string) => k.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`);

export function toRow(spec: TableSpec, rec: Rec): Row {
  const row: Row = {};
  for (const [key, f] of Object.entries(spec.fields)) {
    const v = rec[key];
    row[f.col ?? snake(key)] = v === undefined || v === null ? (f.def ?? null) : v;
  }
  return row;
}

export function fromRow(spec: TableSpec, row: Row): Rec {
  const rec: Rec = {};
  for (const [key, f] of Object.entries(spec.fields)) {
    const v = row[f.col ?? snake(key)];
    if (v === null || v === undefined) {
      if (!f.optional && f.def !== undefined && f.def !== null) rec[key] = f.def;
      continue;
    }
    rec[key] = f.kind === "n" && typeof v === "string" ? Number(v) : v;
  }
  return rec;
}

// ---------------------------------------------------------------- documents

interface DocSpec {
  key: "content" | "settings" | "deal";
  store: Store<Record<string, unknown>>;
  defaults: unknown;
  /** fields that never leave this browser */
  local?: string[];
}

const DOCS: DocSpec[] = [
  { key: "content", store: contentStore as unknown as Store<Record<string, unknown>>, defaults: DEFAULT_CONTENT },
  { key: "settings", store: settingsStore as unknown as Store<Record<string, unknown>>, defaults: DEFAULT_SETTINGS, local: ["passHash", "passSalt"] },
  { key: "deal", store: dealStore as unknown as Store<Record<string, unknown>>, defaults: DEFAULT_DEAL },
];

const docData = (d: DocSpec, value: Record<string, unknown>) => {
  const out = { ...value };
  for (const k of d.local ?? []) delete out[k];
  return out;
};

// ---------------------------------------------------------------- status for the UI

export interface SyncStatus {
  state: "off" | "loading" | "saved" | "saving" | "error";
  message?: string;
  at?: number;
}
let status: SyncStatus = { state: "off" };
const statusListeners = new Set<() => void>();
function setStatus(next: SyncStatus) {
  status = next;
  statusListeners.forEach((l) => l());
}
export function useSyncStatus() {
  return useSyncExternalStore(
    (l) => {
      statusListeners.add(l);
      return () => statusListeners.delete(l);
    },
    () => status,
  );
}

// ---------------------------------------------------------------- the sync loop

const PAGE = 1000;
const CHUNK = 500;

async function fetchAll(sb: SupabaseClient, spec: TableSpec): Promise<Row[]> {
  const rows: Row[] = [];
  for (let from = 0; ; from += PAGE) {
    let query = sb.from(spec.table).select("*");
    if (spec.since) query = query.gte(spec.since.col, spec.since.value());
    const { data, error } = await query.order("id").range(from, from + PAGE - 1);
    if (error) throw new Error(`${spec.table}: ${error.message}`);
    rows.push(...(data as Row[]));
    if (!data || data.length < PAGE) break;
  }
  return rows;
}

let applying = false;
/** Puts database values into a store without echoing them back to the database. */
function applyRemote<T>(store: Store<T>, value: T) {
  applying = true;
  try {
    store.set(value);
  } finally {
    applying = false;
  }
}

const stable = (v: unknown) => JSON.stringify(v);

export interface SyncHandle {
  stop: () => void;
  refresh: () => Promise<void>;
  flush: () => Promise<void>;
}

/**
 * Loads the database into the dashboard and starts writing changes back.
 *
 * The first browser to connect to an empty database uploads what it holds (so data entered before
 * the database existed — and the publisher's figures — move across); from then on the database is
 * the source of truth and every sign-in loads from it.
 */
export async function startSync(sb: SupabaseClient, who: string): Promise<SyncHandle> {
  setStatus({ state: "loading" });
  const snapshots = new Map<string, Map<string, string>>(); // table -> id -> row json
  const docSnapshots = new Map<string, string>();
  const timers = new Map<string, ReturnType<typeof setTimeout>>();
  const running = new Map<string, Promise<void>>();
  let stopped = false;

  const { data: marker, error: markerError } = await sb.from("app_documents").select("data").eq("key", "sync").maybeSingle();
  if (markerError) throw new Error(markerError.message);
  let firstConnection = !marker;

  // ---- pull everything
  const pullTables = async () => {
    for (const spec of TABLES) {
      const rows = await fetchAll(sb, spec);
      const snap = new Map(rows.map((r) => [String(r.id), stable(toRow(spec, fromRow(spec, r)))]));
      snapshots.set(spec.table, snap);
      const local = spec.store.get();
      if (firstConnection && rows.length === 0 && local.length > 0) {
        snapshots.set(spec.table, new Map()); // everything local is new to the database
      } else {
        applyRemote(spec.store, rows.map((r) => fromRow(spec, r)));
      }
    }
  };
  const pullDocs = async () => {
    const { data, error } = await sb.from("app_documents").select("key, data").in("key", DOCS.map((d) => d.key));
    if (error) throw new Error(error.message);
    for (const d of DOCS) {
      const found = (data as { key: string; data: unknown }[]).find((r) => r.key === d.key);
      if (found) {
        const current = d.store.get();
        const merged = mergeDefaults(d.defaults, found.data) as Record<string, unknown>;
        for (const k of d.local ?? []) merged[k] = current[k];
        applyRemote(d.store, merged);
        docSnapshots.set(d.key, stable(docData(d, merged)));
      } else {
        docSnapshots.set(d.key, ""); // not in the database yet: the local copy is uploaded below
      }
    }
  };

  // ---- push changes
  const flushTable = async (spec: TableSpec) => {
    const snap = snapshots.get(spec.table) ?? new Map<string, string>();
    let records = spec.store.get();
    // rows need ids to be matched; older analytics events were stored without one
    if (records.some((r) => !r.id)) {
      records = records.map((r) => (r.id ? r : { ...r, id: uid("ev_") }));
      applyRemote(spec.store, records);
    }
    const rows = records.map((r) => toRow(spec, r));
    const changed = rows.filter((r) => snap.get(String(r.id)) !== stable(r));
    const ids = new Set(rows.map((r) => String(r.id)));
    const removed = [...snap.keys()].filter((id) => !ids.has(id) && (!spec.deletable || spec.deletable(snap.get(id)!)));
    // rows that disappeared here but must stay in the database are simply forgotten locally
    for (const id of [...snap.keys()]) if (!ids.has(id) && !removed.includes(id)) snap.delete(id);
    if (!changed.length && !removed.length) return;
    for (let i = 0; i < changed.length; i += CHUNK) {
      const part = changed.slice(i, i + CHUNK);
      const { error } = await sb.from(spec.table).upsert(part, { onConflict: "id" });
      if (error) throw new Error(`${spec.table}: ${error.message}`);
      part.forEach((r) => snap.set(String(r.id), stable(r)));
    }
    for (let i = 0; i < removed.length; i += CHUNK) {
      const part = removed.slice(i, i + CHUNK);
      const { error } = await sb.from(spec.table).delete().in("id", part);
      if (error) throw new Error(`${spec.table}: ${error.message}`);
      part.forEach((id) => snap.delete(id));
    }
    snapshots.set(spec.table, snap);
  };
  const flushDoc = async (d: DocSpec) => {
    const data = docData(d, d.store.get());
    const json = stable(data);
    if (docSnapshots.get(d.key) === json) return;
    const { error } = await sb.from("app_documents").upsert({ key: d.key, data, updated_at: new Date().toISOString() }, { onConflict: "key" });
    if (error) throw new Error(`${d.key}: ${error.message}`);
    docSnapshots.set(d.key, json);
  };

  let pending = 0;
  let lastError = "";
  const run = (name: string, job: () => Promise<void>) => {
    // one write at a time per collection; a change during a write is picked up by the next run
    const previous = running.get(name) ?? Promise.resolve();
    pending++;
    setStatus({ state: "saving" });
    const next = previous.then(async () => {
      try {
        if (stopped) return;
        await job();
      } catch (err) {
        lastError = err instanceof Error ? err.message : String(err);
        // try again shortly: a dropped connection shouldn't lose the change
        schedule(name, job, 5000);
      } finally {
        pending--;
        if (pending === 0 && !stopped) {
          setStatus(lastError ? { state: "error", message: lastError } : { state: "saved", at: Date.now() });
          lastError = "";
        }
      }
    });
    running.set(name, next);
    return next;
  };
  const schedule = (name: string, job: () => Promise<void>, wait = 400) => {
    if (stopped) return;
    clearTimeout(timers.get(name));
    timers.set(
      name,
      setTimeout(() => void run(name, job), wait),
    );
  };

  await pullTables();
  await pullDocs();

  const jobs: { name: string; store: Store<unknown>; job: () => Promise<void> }[] = [
    ...TABLES.map((spec) => ({ name: spec.table, store: spec.store as Store<unknown>, job: () => flushTable(spec) })),
    ...DOCS.map((d) => ({ name: `doc:${d.key}`, store: d.store as Store<unknown>, job: () => flushDoc(d) })),
  ];
  // upload whatever the database doesn't have yet (first connection, or documents never saved)
  await Promise.all(jobs.map((j) => run(j.name, j.job)));
  if (status.state === "error") {
    stopped = true;
    timers.forEach((t) => clearTimeout(t));
    throw new Error(status.message);
  }
  if (firstConnection) {
    const { error } = await sb.from("app_documents").upsert({ key: "sync", data: { initializedAt: new Date().toISOString(), by: who } }, { onConflict: "key" });
    if (error) throw new Error(error.message);
    firstConnection = false;
  }
  setStatus({ state: "saved", at: Date.now() });

  const unsubscribe = jobs.map((j) =>
    j.store.subscribe(() => {
      if (!applying) schedule(j.name, j.job);
    }),
  );

  const flush = async () => {
    for (const j of jobs) {
      clearTimeout(timers.get(j.name));
      await run(j.name, j.job);
    }
  };

  return {
    flush,
    async refresh() {
      // pick up what visitors added (sign-ups, events) and edits from other devices
      await flush();
      if (stopped) return;
      await pullTables();
      await pullDocs();
    },
    stop() {
      stopped = true;
      unsubscribe.forEach((u) => u());
      timers.forEach((t) => clearTimeout(t));
      setStatus({ state: "off" });
    },
  };
}
