import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Supabase connection: the project URL and its public (anon / publishable) key. vite.config.ts picks
 * them from the environment at build time — VITE_*, NEXT_PUBLIC_* or the plain SUPABASE_* names the
 * Vercel integration creates. Without them the whole site runs on browser storage exactly as before.
 */
export const SUPABASE_URL = __SUPABASE_URL__;
export const SUPABASE_KEY = __SUPABASE_KEY__;

export const hasDatabase = !!(SUPABASE_URL && SUPABASE_KEY);

let client: Promise<SupabaseClient> | null = null;

/** The full client, loaded on demand (only the dashboard needs it). */
export function getSupabase(): Promise<SupabaseClient> | null {
  if (!hasDatabase) return null;
  client ??= import("@supabase/supabase-js").then(({ createClient }) =>
    createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, storageKey: "wa-auth" },
    }),
  );
  return client;
}

// ---------------------------------------------------------------- what the public site needs

/** New-format keys (sb_publishable_…) go only in `apikey`; legacy anon keys are also the bearer token. */
function headers(extra: Record<string, string> = {}) {
  const h: Record<string, string> = { apikey: SUPABASE_KEY, ...extra };
  if (!SUPABASE_KEY.startsWith("sb_")) h.Authorization = `Bearer ${SUPABASE_KEY}`;
  return h;
}

/** The website content as last published from the dashboard, or null if none (or offline). */
export async function fetchPublishedContent(): Promise<unknown | null> {
  if (!hasDatabase) return null;
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/app_documents?key=eq.content&select=data`, { headers: headers() });
    if (!res.ok) return null;
    const rows = (await res.json()) as { data: unknown }[];
    return rows[0]?.data ?? null;
  } catch {
    return null;
  }
}

/** Visitors can add rows to `subscribers` and `site_events` — never read them. Fire and forget. */
export function insertPublic(table: "subscribers" | "site_events", row: Record<string, unknown>) {
  if (!hasDatabase) return;
  fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: "POST",
    keepalive: true,
    headers: headers({ "Content-Type": "application/json", Prefer: "return=minimal" }),
    body: JSON.stringify(row),
  }).catch(() => {
    /* offline or blocked: the visit simply isn't counted */
  });
}
