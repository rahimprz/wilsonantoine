-- Wilson Antoine — book website & sales dashboard
-- PostgreSQL schema (works as-is on Supabase / Neon / RDS).
--
-- Each table mirrors one dashboard collection (src/data/stores.ts, types in src/data/types.ts), with
-- the same field names in snake_case, so connecting the database means replacing the load/save
-- calls in src/lib/store.ts — the screens and the profit maths (src/lib/profit.ts) stay as they are.
-- Money is numeric(12,2); dates are `date`; "createdAt" timestamps become timestamptz.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------- the publishing deal

-- one row: the terms the statements are built on
create table deal (
  id             smallint primary key default 1 check (id = 1),
  publisher      text        not null default '',
  start_date     date,                                   -- "cumulative" statements run from here
  list_price     numeric(12,2) not null default 0,       -- cover price of a printed copy
  vendor_share   numeric(5,2)  not null default 40,      -- % the distribution vendor keeps
  split_by       text        not null default 'investment' check (split_by in ('investment', 'custom')),
  split_scope    text        not null default 'printed' check (split_scope in ('printed', 'all')),
  low_stock_at   integer     not null default 50,
  updated_at     timestamptz not null default now()
);

create table partners (
  id             text primary key,                       -- e.g. 'p_owner', 'p_publisher'
  name           text        not null,
  role           text        not null default '',
  investment     numeric(12,2) not null default 0 check (investment >= 0),
  is_owner       boolean     not null default false,     -- receives profit outside the shared split
  custom_share   numeric(5,2),                           -- % when deal.split_by = 'custom'
  created_at     timestamptz not null default now()
);
create unique index partners_one_owner on partners (is_owner) where is_owner;

create table print_runs (
  id             text primary key,
  printed_on     date        not null,
  format         text        not null,                   -- 'Paperback', 'Hardcover'
  quantity       integer     not null check (quantity > 0),
  unit_cost      numeric(12,2) not null check (unit_cost >= 0),
  printer        text        not null default '',
  notes          text        not null default '',
  demo           boolean     not null default false,
  created_at     timestamptz not null default now()
);

create table payouts (
  id             text primary key,
  paid_on        date        not null,
  partner_id     text        not null references partners (id),
  kind           text        not null check (kind in ('profit', 'capital')),
  amount         numeric(12,2) not null check (amount > 0),
  method         text        not null default '',
  reference      text        not null default '',
  notes          text        not null default '',
  demo           boolean     not null default false,
  created_at     timestamptz not null default now()
);

create table statements (
  id             text primary key,
  number         text        not null default '',
  issued_on      date        not null,
  period_start   date        not null,
  period_end     date        not null,
  source         text        not null check (source in ('dashboard', 'publisher')),
  notes          text        not null default '',
  snapshot       jsonb,                                  -- figures as issued: units, gross, vendor, net, cost, profit, shares[]
  created_at     timestamptz not null default now()
);

-- ---------------------------------------------------------------- sales & CRM

create table reps (
  id             text primary key,
  name           text        not null,
  email          text        not null default '',
  phone          text        not null default '',
  region         text        not null default '',
  commission     numeric(5,2) not null default 0,        -- % of sales revenue
  monthly_target integer     not null default 0,         -- copies
  active         boolean     not null default true,
  demo           boolean     not null default false,
  created_at     timestamptz not null default now()
);

create table sales (
  id             text primary key,
  sold_on        date        not null,                   -- for a publisher statement: the last day it covers
  channel        text        not null,                   -- 'Distributor', 'Amazon', 'Event / signing', 'Complimentary copy'…
  format         text        not null,
  quantity       integer     not null check (quantity > 0),
  unit_price     numeric(12,2) not null check (unit_price >= 0),
  net            numeric(12,2) not null check (net >= 0),        -- net revenue received after the distributor's share
  cost           numeric(12,2) not null default 0 check (cost >= 0), -- printing cost of these copies
  rep_id         text references reps (id) on delete set null,
  customer       text        not null default '',
  notes          text        not null default '',
  demo           boolean     not null default false,
  created_at     timestamptz not null default now()
);
create index sales_sold_on on sales (sold_on);

-- the statement's arithmetic, row by row
create view sales_profit as
select s.*,
       s.quantity * s.unit_price                 as gross,
       s.quantity * s.unit_price - s.net         as vendor_share,
       s.net - s.cost                            as profit
from sales s;

create table leads (
  id             text primary key,
  org            text        not null,
  contact        text        not null default '',
  email          text        not null default '',
  phone          text        not null default '',
  type           text        not null default '',
  stage          text        not null check (stage in ('prospect', 'contacted', 'negotiating', 'won', 'lost')),
  units          integer     not null default 0,
  value          numeric(12,2) not null default 0,
  rep_id         text references reps (id) on delete set null,
  follow_up      date,
  notes          text        not null default '',
  demo           boolean     not null default false,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create table subscribers (
  id             text primary key,
  email          text        not null unique,
  name           text        not null default '',
  source         text        not null check (source in ('website', 'excerpt', 'manual', 'import')),
  subscribed_at  timestamptz not null default now(),
  demo           boolean     not null default false
);

-- website analytics events (visit, pageview, buy_click, excerpt_open, chapter_open, subscribe)
create table site_events (
  id             bigint generated always as identity primary key,
  at             timestamptz not null default now(),
  type           text        not null,
  meta           text,
  demo           boolean     not null default false
);
create index site_events_at on site_events (at);

-- ---------------------------------------------------------------- website & settings

-- the whole public site's editable content (src/data/defaultContent.ts shape), one document
create table site_content (
  id             smallint primary key default 1 check (id = 1),
  content        jsonb       not null,
  updated_at     timestamptz not null default now()
);

create table settings (
  id             smallint primary key default 1 check (id = 1),
  owner_name     text        not null default '',
  currency       text        not null default 'USD',
  monthly_unit_target    integer       not null default 0,
  monthly_revenue_target numeric(12,2) not null default 0,
  royalty_rates  jsonb       not null default '{}'::jsonb  -- format -> % of the sale price received (non-printed formats)
  -- the passcode moves to real sign-in (e.g. Supabase Auth) when the database is connected
);

-- Row-level security: the public site only needs to read site_content and insert into
-- subscribers / site_events; everything else should require the signed-in owner.
