#!/usr/bin/env node
/**
 * Applies supabase/migrations/*.sql to the database, once each, in order — then makes sure every
 * address in ADMIN_EMAILS can open the dashboard.
 *
 * Runs before every build (see package.json). It does nothing unless a database URL is set, so the
 * site still builds without a database. On Vercel the Supabase integration provides the URL
 * (POSTGRES_URL_NON_POOLING); elsewhere set SUPABASE_DB_URL or DATABASE_URL.
 *
 *   npm run db:migrate            # apply pending migrations
 *   DB_MIGRATE=skip npm run build # build without touching the database
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import pg from "pg";

const url = process.env.SUPABASE_DB_URL || process.env.POSTGRES_URL_NON_POOLING || process.env.DATABASE_URL || process.env.POSTGRES_URL;
const log = (msg) => console.log(`[db] ${msg}`);

if (process.env.DB_MIGRATE === "skip") {
  log("DB_MIGRATE=skip — not touching the database.");
  process.exit(0);
}
if (!url) {
  log("No database URL set — skipping migrations (the dashboard keeps data in the browser).");
  process.exit(0);
}

const dir = join(process.cwd(), "supabase", "migrations");
const files = readdirSync(dir)
  .filter((f) => f.endsWith(".sql"))
  .sort();

// Supabase serves TLS with its own chain; local databases usually have none.
const parsed = new URL(url);
parsed.searchParams.delete("sslmode");
parsed.searchParams.delete("supa");
const local = ["localhost", "127.0.0.1", "::1"].includes(parsed.hostname);
const client = new pg.Client({ connectionString: parsed.toString(), ssl: local ? false : { rejectUnauthorized: false } });

try {
  await client.connect();
  await client.query(`create table if not exists public.schema_migrations (version text primary key, applied_at timestamptz not null default now())`);
  const done = new Set((await client.query(`select version from public.schema_migrations`)).rows.map((r) => r.version));
  let applied = 0;
  for (const file of files) {
    const version = file.replace(/\.sql$/, "");
    if (done.has(version)) continue;
    await client.query("begin");
    try {
      // one deploy at a time: concurrent builds wait here instead of applying twice
      await client.query("select pg_advisory_xact_lock(727163)");
      const again = await client.query(`select 1 from public.schema_migrations where version = $1`, [version]);
      if (!again.rowCount) {
        await client.query(readFileSync(join(dir, file), "utf8"));
        await client.query(`insert into public.schema_migrations (version) values ($1)`, [version]);
        applied++;
        log(`applied ${file}`);
      }
      await client.query("commit");
    } catch (err) {
      await client.query("rollback").catch(() => {});
      throw new Error(`${file}: ${err.message}`);
    }
  }
  log(applied ? `${applied} migration(s) applied.` : "Database schema is up to date.");

  const admins = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter((e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));
  if (admins.length) {
    await client.query(`insert into public.admins (email) select unnest($1::text[]) on conflict (email) do nothing`, [admins]);
    log(`dashboard access: ${admins.length} admin address(es) ensured.`);
  }
} catch (err) {
  console.error(`[db] Migration failed — ${err.message}`);
  console.error("[db] Fix the database settings, or set DB_MIGRATE=skip to build without migrating.");
  process.exit(1);
} finally {
  await client.end().catch(() => {});
}
