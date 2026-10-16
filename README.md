# Wilson Antoine — book website & sales dashboard

The website for *Postmortem Life Continuation* by Dr. Wilson Antoine, MD, rebuilt from the WordPress
site at wilsonantoine.com, plus a private sales dashboard at `/admin`.

React 19 + TypeScript + Vite + Tailwind CSS v4, GSAP (ScrollTrigger) and Lenis smooth scrolling.

```bash
npm install
npm run dev        # http://localhost:5173  ·  dashboard at /admin
npm run build      # production build in dist/
npm run preview
```

**Deploying on Vercel:** import the repo — Vercel detects Vite (build `npm run build`, output `dist`).
`vercel.json` already routes `/admin` (and any other path) to the app.

---

## The website

A classic author-site layout in his original colours: deep space navy (`#0A1015` / `#2A3663`), royal
blue (`#1836A5` / `#3354D2`), gold (`#B59F78`) and a touch of the logo's cyan (`#2AC4EA`). Playfair Display
headings, Jost text, his WA quill logo and the real book images throughout.

| Section | What it shows |
|---|---|
| **Header** | A slim announcement line (tucks away on scroll), the WA quill logo, letter-spaced links with a gold underline for the section you're in, an Admin pill and *Get the Book*. A gold line along the bottom fills as you read. |
| **Hero** | Galaxy photo, the nebula video loop and live twinkling stars. Tag, the title word by word (*Continuation* in shimmering gold), subtitle, byline, availability chips, **Buy the Book** + **Read an Excerpt**, a reader quote. On the right the five-book spread inside slowly turning orbit rings, standing on a pool of light, with the reader rating and theme count beneath. The spread tilts toward the cursor; the sky drifts as you scroll. |
| **At a glance** | Years of practice, chapters, themes and reader rating between gold hairlines, counting up as they arrive. |
| **I. About the book** | The hardcover floating in a ringed halo beside a slowly turning gold seal; drop-cap description, highlights, a colophon line (author · format · inside · subject), buy + “Know About Author”. |
| **Themes ribbon** | His six themes scrolling past in gold italic. |
| **II. Inside the book** | Chapters I–V as a lit table of contents: a gold thread draws down the list as you read, each numeral medallion glows as it passes the middle of the screen. Beside it (desktop) a 3D book made from the flat cover — spine, pages and shadow — that follows the cursor and stays pinned while you read. |
| **III. What this book explores** | The Earth backdrop and the six themes as gold medallions flying in from both sides, each reaching toward the tilted book in the centre. |
| **The premise** | Full-screen quote over the rising-light video; the words light up one by one as you scroll. |
| **IV. Why this book matters** | The front-and-back pair inside orbit rings; Comfort, Clarity, Reassurance. |
| **V. The author** | An arched portrait revealed like a curtain with a gold offset arch, bio, highlights counting up, his name signed in italic. |
| **VI. Reviews** | One reader's words at a time, large and centred, turning over every few seconds (pauses on hover); pick a reader to jump to them. |
| **VII. FAQ** | Numbered questions on gold hairlines that open in place; a “Still curious?” note. |
| **Begin the journey** | The light-tunnel video, the 3D book, one row per store/format, share links. |
| **Footer** | His original footer, refined: centred logo, newsletter pill, links, gold social circles, a faint giant wordmark. |

Section numbers (I, II, III…) follow whichever sections are switched on. Phones get a sticky Buy pill;
with `prefers-reduced-motion` every animation is skipped and videos show their still frame.

### Background videos

`public/videos/` holds three seamless loops (MP4 + WebM + poster), ~1.3 MB in total as WebM:
`nebula-drift` (hero), `rising-light` (premise) and `light-tunnel` (buy section). They are original —
rendered from GLSL shaders in `scripts/render-videos/` — so there's no stock licence to track. To tweak
and re-render: `npx playwright install chromium && npm run render:videos` (needs ffmpeg).

Any video can be swapped for your own `.mp4`/`.webm` URL from **Dashboard → Website**.

### Images

The book images and logo are bundled in `public/books/`. The author portrait and the hero/Earth
backdrops still load from the WordPress uploads folder (`media:` references, see `src/lib/media.ts`).
**Before WordPress is switched off:**

```bash
npm run fetch-media          # copies them into public/media
echo "VITE_MEDIA_BASE=/media" > .env   # or set it in Vercel's environment variables
npm run build
```

---

## The dashboard (`/admin`)

Without a database it opens with a passcode — the starting one was shared privately (it isn't written
in this repo); change it under **Settings → Security**. With Supabase connected it uses account
sign-in instead (see *Where the data lives* below).
(A changed passcode is saved in that browser; other devices keep using the starting one until changed there
too. To change the starting passcode for everyone, update `passHash` in `src/data/stores.ts` — it's
`sha256("wa-default-v1:" + passcode)`.)

The dashboard wears the same brand: his logo and the book's cover on the lock screen and in the
sidebar, and a *Your book* banner on the overview with lifetime copies, earnings, buy clicks and readers.

Pages:

- **Overview** — the publisher's Book Sales & Profit Distribution Report, kept live and cumulative to
  date: total investment, books printed, printing cost and selling price per book; books sold, total
  sales revenue (with the distributor share and net received), total net profit and Dr. Antoine's
  profit; revenue per book; the profit distribution by partner; and the sales entries the figures are
  added up from. Every figure recalculates as soon as a sale, the print run or the deal changes.
- **Sales** — the ledger. Record/edit/duplicate/delete (with undo), search and filter, CSV export and
  import. Each sale shows revenue → distributor share → net received → printing cost → profit; the
  share, net and printing cost fill in from the deal and print runs, and can be overridden per sale.
  A publisher statement can go in as one entry (copies for the period, dated its last day).
- **Profit & split** — laid out like the publisher's *Book Sales & Profit Distribution Report*:
  sales performance for any period (with where the revenue went), investment summary, printing & stock,
  revenue per copy, profit distribution by partner, payments made and what's still outstanding, and an
  outlook (investment recovered, break-even copies, profit if every printed copy sells). The deal —
  publisher, cover price, distributor share, partners and investments, split by investment or custom
  percentages, printed-only or every format — is edited here. A partner can also have a total
  investment that Dr. Antoine repays from his share of the profit (Jinnx Book Press's $17,500): until
  it is repaid, his profit share goes to that partner, and the Overview, balances and statements show
  what has been repaid and what is left.
- **Print & stock** — print runs (copies, cost per copy, printer), copies left per format with a
  low-stock alert, review copies given away, stock value at cost, and a reprint planner.
- **Statements** — generates the report itself for any period, in the publisher's layout (sections
  01–06, plus *Investment Repayment* when a repayment is set). A cumulative report runs to the latest
  sale and is dated that day unless another report date is picked. Print it or save it as a PDF,
  download the figures as CSV, and keep issued statements on file; a statement on file keeps its
  figures as issued and flags it if sales for that period change.
- **Subscribers** — newsletter sign-ups from the site; copy all emails or export CSV.
- **Website** — edit every section of the public site: copy, images, videos, chapters, reviews, buy
  links (with prices and a main link), the excerpt, socials, SEO, and which sections show. Edits are a
  draft until **Publish**.
- **Settings** — name, currency, royalty rates, passcode, backup export/restore,
  demo data, erase.

**Demo data** — “Load demo data” fills the dashboard with sample records, every one badged *Demo*;
“Clear demo data” removes exactly those and keeps anything you entered.

### The publisher's figures

The figures from Jinnx Book Press's July 10, 2026 statement (investments, the print run, copies sold to
June 30) are built in, but **not readable in the public site files**: they ship encrypted with the
dashboard passcode (`src/data/seed.sealed.ts`) and are merged into a browser's data the first time
someone unlocks there. The dashboard then reproduces the report line for line, and the statement is on
file under *Statements*.

To ship the next statement the same way, write it as a setup file (backup format with `"merge": true`)
and run `node scripts/seal-seed.mjs setup.json "<passcode>" > src/data/seed.sealed.ts` with a new
`seedId`. A setup file can also simply be imported from *Profit & split* or *Statements* — it adds its
records and keeps everything already there.

### Where the data lives

The dashboard runs in one of two modes, chosen by whether Supabase keys are present at build time.

**Without a database (the default).** Everything is saved in **this browser's localStorage**: it
persists on that device only, website edits show only in that browser, and the passcode is a
convenience lock (a salted SHA-256 hash), not server security. **Settings → Export backup** downloads
everything as one JSON file; **Restore** brings it back.

**With Supabase.** Every collection lives in the database and the dashboard works from any device:

- `/admin` asks for a real **account sign-in** (email + password, or an emailed one-time link) instead
  of the passcode. Only addresses on the admin list get in; anyone else sees “Not on the admin list”.
- Each change is written to the database as it's made (only the rows that changed); the sidebar shows
  *Saved to database* / *Saving…* / *Not saved — retrying*. Returning to the tab picks up new data;
  *Settings → Sync now* does it on demand.
- **Publishing the website** saves its content to the database, and every visitor sees it.
- **Newsletter sign-ups and site analytics** from every visitor land in the database.
- The first browser to sign in to an empty database uploads what it already holds, so nothing typed
  before the switch is lost. If the publisher's figures aren't in yet, *Profit & split* offers to load
  them with the original dashboard passcode.
- **Security:** every table has row-level security. With the public key, visitors can only read the
  published website content and add sign-ups/analytics events — never read them back. All other data
  needs a signed-in admin. The passcode hash never leaves the browser.

#### Connecting Supabase (about five minutes)

1. **Create the database.** In Vercel open the project → **Storage → Create Database → Supabase**
   (or *Connect Store* for an existing Supabase project) and connect it to this project for
   Production and Preview. This adds `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
   `POSTGRES_URL_NON_POOLING` and friends to the project's environment variables — the app reads
   those names as they are.
   *Using a Supabase project made on supabase.com instead?* Add the variables yourself — see
   [`.env.example`](.env.example): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (Project Settings →
   API) and `SUPABASE_DB_URL` (Project Settings → Database → Connection string, URI).
2. **Say who may sign in.** Add an environment variable `ADMIN_EMAILS` with Dr. Antoine's address
   (comma-separate several).
3. **Redeploy.** The build runs `scripts/db-migrate.mjs` first: it creates the tables and security
   rules from [`supabase/migrations/`](supabase/migrations) (each migration once, in order) and puts
   the `ADMIN_EMAILS` addresses on the admin list. The log shows `[db] … applied`.
4. **Point sign-in emails at the site.** Supabase → Authentication → URL Configuration: set *Site URL*
   to the live address and add `https://<your-domain>/admin` under *Redirect URLs*.
5. **Sign in.** Go to `/admin`, choose *Email me a link*, open it, then set a password under
   *Settings → Account*. (Or create the user with a password in Supabase → Authentication → Users.)

No Vercel integration and no build-time database URL? Paste `supabase/migrations/*.sql` into
Supabase → SQL editor, then run `insert into admins (email) values ('you@example.com');`.

Locally, put the same variables in `.env.local` (copy `.env.example`); `npm run db:migrate` applies
migrations on demand.

Under the hood: the screens still read and write the same stores (`src/data/stores.ts`);
`src/data/remote.ts` mirrors each one to its table (columns are the field names in snake_case), and
`src/lib/supabase.ts` holds the connection. All the money maths is in `src/lib/profit.ts`, as pure
functions, and the database has a `sales_profit` view with the same arithmetic per sale.

## Content to review before launch

- **Theme card one-liners** under “What this book explores”, the chapters intro line and the FAQ are new copy, written from the site's
  existing wording — check they read right to Dr. Antoine.
- The **quote** section line is adapted from the “Why this book matters” paragraph.
- **Excerpt** is empty — paste a passage in Dashboard → Website → Excerpt to turn on the reader.
  Until then “Read an Excerpt” scrolls to the chapter previews (as on the old site).
- **Social links** were `#` placeholders on the old site, so icons are hidden until real links are added.
- **Prices** aren't shown anywhere until filled in under Buy links.

## Project layout

```
src/
  site/        Site.tsx (page + Lenis), sections/, components/ (Header, Stars, Book3D, BgVideo, SectionHead…)
  admin/       Admin.tsx (lock + shell), views/, charts.tsx, components.tsx, ui.tsx
  data/        types, defaultContent (all site copy), stores, demo data, constants
  lib/         gsap, store, supabase, metrics, profit (the statement's maths), media, format, csv, analytics, passcode
scripts/       db-migrate.mjs, fetch-media.mjs, seal-seed.mjs, render-videos/ (shaders + renderer)
supabase/      migrations/ — the database schema and security rules, applied at build time
public/videos  rendered background loops
```
