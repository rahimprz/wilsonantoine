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
| **Hero** | Galaxy photo, the nebula video loop and live twinkling stars. Tag, the title word by word (*Continuation* in shimmering gold), subtitle, byline, availability chips, **Buy the Book** + **Read an Excerpt**, a reader quote. On the right the five-book spread inside slowly turning orbit rings, *Featured Book* badge, floating rating/themes badges and a details card. The spread tilts toward the cursor; the sky drifts as you scroll. |
| **At a glance** | Glass strip — years of practice, chapters, themes, reader rating — counting up as it arrives. |
| **I. About the book** | Glass panel with gold corner brackets: the hardcover floating in a ringed halo, drop-cap description, highlights, details table, buy + “Know About Author”. |
| **Themes ribbon** | His six themes scrolling past in gold italic. |
| **II. Inside the book** | Chapters I–V as a lit table of contents: a gold thread draws down the list as you read, each numeral glows as it passes the middle of the screen. Beside it (desktop) a 3D book made from the flat cover — spine, pages and shadow — that follows the cursor and stays pinned while you read. |
| **III. What this book explores** | The Earth backdrop, six numbered glass cards flying in from both sides around the tilted book. |
| **The premise** | Full-screen quote over the rising-light video; the words light up one by one as you scroll. |
| **IV. Why this book matters** | The front-and-back pair with an offset gold frame; Comfort, Clarity, Reassurance. |
| **V. The author** | Portrait revealed like a curtain with a gold offset frame, bio, highlights counting up, his name signed in italic. |
| **VI. Reviews** | Average rating, glass reader cards that rise in. |
| **VII. FAQ** | Numbered questions in a gold-edged accordion; a “Still curious?” card. |
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

The starting passcode was shared privately (it isn't written in this repo). Change it under
**Settings → Security** after signing in.
(A changed passcode is saved in that browser; other devices keep using the starting one until changed there
too. To change the starting passcode for everyone, update `passHash` in `src/data/stores.ts` — it's
`sha256("wa-default-v1:" + passcode)`.)

The dashboard wears the same brand: his logo and the book's cover on the lock screen and in the
sidebar, and a *Your book* banner on the overview with lifetime copies, earnings, buy clicks and readers.

Pages:

- **Overview** — gross revenue, net earnings, copies, average order, each with change vs. the previous
  period and a sparkline; revenue-over-time chart (hover for details, or flip to a table); this month's
  goal with pace projection; copies by format; revenue by channel; website engagement (visits → chapter
  opens → excerpt reads → buy clicks → sign-ups); rep leaderboard; pipeline follow-ups; recent sales.
  A date-range picker (7 days → all time) drives everything.
- **Sales** — the ledger. Record/edit/duplicate/delete (with undo), search and filter, CSV export and
  import. Net earnings fill in from the format's royalty rate and can be overridden per sale.
- **Pipeline** — kanban for bulk/institutional deals (bookstores, libraries, churches, hospices,
  events, media). Drag between stages; moving one to *Won* offers to record the sale. Follow-up dates
  surface on the overview, overdue ones in red.
- **Sales reps** — copies, revenue, commission owed, monthly target progress and win rate per rep;
  one-click commission statement (CSV) for the selected period.
- **Subscribers** — newsletter sign-ups from the site; copy all emails or export CSV.
- **Website** — edit every section of the public site: copy, images, videos, chapters, reviews, buy
  links (with prices and a main link), the excerpt, socials, SEO, and which sections show. Edits are a
  draft until **Publish**.
- **Settings** — name, currency, monthly targets, royalty rates, passcode, backup export/restore,
  demo data, erase.

**Demo data** — “Load demo data” fills the dashboard with sample records, every one badged *Demo*;
“Clear demo data” removes exactly those and keeps anything you entered.

### Where the data lives (for now)

As requested, nothing is connected to a server yet: the dashboard saves to **this browser's
localStorage**. That means:

- It persists across visits on the same browser and device, but not across devices.
- Website edits show on the live site **only in this browser** until a backend serves them to everyone.
- Engagement stats and newsletter sign-ups are only those made in this browser.
- The passcode is a convenience lock for this device (stored as a salted SHA-256 hash), not server
  security.
- **Settings → Export backup** downloads everything as one JSON file; **Restore** brings it back.

Connecting a backend later is contained: every collection goes through `createStore()` in
`src/lib/store.ts` (one key per collection in `src/data/stores.ts`), so swapping localStorage for
Firebase/Supabase/an API means changing that file, not the UI. Real authentication and a server-side
copy of the site content would come with it.

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
  lib/         gsap, store, metrics (all dashboard maths), media, format, csv, analytics, passcode
scripts/       fetch-media.mjs, render-videos/ (shaders + renderer)
public/videos  rendered background loops
```
