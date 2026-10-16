-- Wilson Antoine — book website & sales dashboard: initial schema for Supabase (PostgreSQL).
--
-- One table per dashboard collection. Column names are the app's field names in snake_case
-- (src/data/types.ts), so rows map one-to-one onto the records the screens already use; the
-- mapping lives in src/data/remote.ts. Timestamps the app keeps as epoch milliseconds stay bigint.
--
-- Security: every table has row-level security. Visitors (the anon key) may only read the published
-- website content and add newsletter sign-ups and analytics events. Everything else is limited to
-- signed-in users listed in public.admins.
--
-- Applied automatically at build time by scripts/db-migrate.mjs, or paste into Supabase → SQL editor.

-- ---------------------------------------------------------------- admins

create table if not exists public.admins (
  email      text primary key,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admins a
    where lower(a.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

-- ---------------------------------------------------------------- documents (site content, settings, deal)

create table if not exists public.app_documents (
  key        text primary key check (key in ('content', 'settings', 'deal', 'sync')),
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------- the publishing deal

create table if not exists public.partners (
  id         text primary key,
  name       text not null,
  role       text not null default '',
  investment numeric(12,2) not null default 0 check (investment >= 0),
  owner      boolean not null default false,
  created_at bigint not null default 0
);

create table if not exists public.print_runs (
  id         text primary key,
  date       date not null,
  format     text not null,
  quantity   integer not null check (quantity > 0),
  unit_cost  numeric(12,2) not null check (unit_cost >= 0),
  printer    text not null default '',
  notes      text not null default '',
  demo       boolean not null default false,
  created_at bigint not null default 0
);

create table if not exists public.payouts (
  id         text primary key,
  date       date not null,
  partner_id text not null,
  kind       text not null check (kind in ('profit', 'capital')),
  amount     numeric(12,2) not null check (amount > 0),
  method     text not null default '',
  reference  text not null default '',
  notes      text not null default '',
  demo       boolean not null default false,
  created_at bigint not null default 0
);

create table if not exists public.statements (
  id           text primary key,
  number       text not null default '',
  issued_on    date not null,
  period_start date not null,
  period_end   date not null,
  source       text not null check (source in ('dashboard', 'publisher')),
  notes        text not null default '',
  snapshot     jsonb,
  created_at   bigint not null default 0
);

-- ---------------------------------------------------------------- sales & CRM

create table if not exists public.reps (
  id             text primary key,
  name           text not null,
  email          text not null default '',
  phone          text not null default '',
  region         text not null default '',
  commission     numeric(6,2) not null default 0,
  monthly_target integer not null default 0,
  active         boolean not null default true,
  demo           boolean not null default false,
  created_at     bigint not null default 0
);

create table if not exists public.sales (
  id         text primary key,
  date       date not null,
  channel    text not null,
  format     text not null,
  quantity   integer not null check (quantity > 0),
  unit_price numeric(12,2) not null check (unit_price >= 0),
  net        numeric(12,2) not null check (net >= 0),
  cost       numeric(12,2) not null default 0 check (cost >= 0),
  rep_id     text not null default '',
  customer   text not null default '',
  notes      text not null default '',
  demo       boolean not null default false,
  created_at bigint not null default 0
);
create index if not exists sales_date_idx on public.sales (date);

create table if not exists public.leads (
  id         text primary key,
  org        text not null,
  contact    text not null default '',
  email      text not null default '',
  phone      text not null default '',
  type       text not null default '',
  stage      text not null check (stage in ('prospect', 'contacted', 'negotiating', 'won', 'lost')),
  units      integer not null default 0,
  value      numeric(12,2) not null default 0,
  rep_id     text not null default '',
  follow_up  text not null default '',
  notes      text not null default '',
  demo       boolean not null default false,
  created_at bigint not null default 0,
  updated_at bigint not null default 0
);

create table if not exists public.subscribers (
  id     text primary key,
  email  text not null,
  name   text not null default '',
  source text not null check (source in ('website', 'excerpt', 'manual', 'import')),
  date   timestamptz not null default now(),
  demo   boolean not null default false
);
create unique index if not exists subscribers_email_idx on public.subscribers (lower(email));

create table if not exists public.site_events (
  id   text primary key default gen_random_uuid()::text,
  t    bigint not null,
  type text not null check (type in ('visit', 'pageview', 'buy_click', 'excerpt_open', 'chapter_open', 'subscribe')),
  meta text,
  demo boolean not null default false
);
create index if not exists site_events_t_idx on public.site_events (t);

-- the publisher statement's arithmetic, row by row
create or replace view public.sales_profit
with (security_invoker = true) as
select s.*,
       s.quantity * s.unit_price           as gross,
       s.quantity * s.unit_price - s.net   as vendor_share,
       s.net - s.cost                      as profit
from public.sales s;

-- ---------------------------------------------------------------- row-level security

do $$
declare t text;
begin
  foreach t in array array['admins', 'app_documents', 'partners', 'print_runs', 'payouts', 'statements', 'reps', 'sales', 'leads', 'subscribers', 'site_events']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "admins manage %1$s" on public.%1$I', t);
    execute format('create policy "admins manage %1$s" on public.%1$I for all to authenticated using (public.is_admin()) with check (public.is_admin())', t);
  end loop;
end $$;

-- visitors read the published website content (and nothing else in that table)
drop policy if exists "anyone reads site content" on public.app_documents;
create policy "anyone reads site content" on public.app_documents
  for select to anon, authenticated using (key = 'content');

-- visitors join the newsletter and record analytics events — insert only, never read
drop policy if exists "visitors subscribe" on public.subscribers;
create policy "visitors subscribe" on public.subscribers
  for insert to anon, authenticated with check (source = 'website' and demo = false);

drop policy if exists "visitors record events" on public.site_events;
create policy "visitors record events" on public.site_events
  for insert to anon, authenticated with check (demo = false);

-- table privileges (Supabase grants these by default; repeated here so the file is self-contained)
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant select on public.app_documents to anon;
grant insert on public.subscribers, public.site_events to anon;
grant execute on function public.is_admin() to anon, authenticated;
