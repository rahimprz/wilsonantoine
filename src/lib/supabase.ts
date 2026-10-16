import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Supabase connection. Set the project URL and its public (anon / publishable) key — either as
 * VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY, or the NEXT_PUBLIC_* names the Vercel Supabase
 * integration creates (vite.config.ts exposes both prefixes). Without them the whole site runs on
 * browser storage exactly as before.
 */
const env = import.meta.env as Record<string, string | undefined>;

export const SUPABASE_URL = (env.VITE_SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/$/, "");
export const SUPABASE_KEY =
  env.VITE_SUPABASE_ANON_KEY ||
  env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  "";

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
