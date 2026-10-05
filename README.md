# Wilson Antoine — book website & sales dashboard

The website for *Postmortem Life Continuation* by Dr. Wilson Antoine, MD, rebuilt from the WordPress
site at wilsonantoine.com, plus a private sales dashboard at `/admin`.

React 19 + TypeScript + Vite + Tailwind CSS v4, GSAP (ScrollTrigger + SplitText) and Lenis smooth scrolling.

```bash
npm install
npm run dev        # http://localhost:5173  ·  dashboard at /admin
npm run build      # production build in dist/
npm run preview
```

**Deploying on Vercel:** import the repo — Vercel detects Vite (build `npm run build`, output `dist`).
`vercel.json` already routes `/admin` (and any other path) to the app.

---

## The website — “The Threshold”

An editorial design in warm ivory and ink with a single ember accent — Instrument Serif display type,
Inter Tight for text, JetBrains Mono for small labels. The idea runs through the scroll: the site opens
in the dark at a doorway of light, and you step *through* it into the light of the pages.

| Section | What happens |
|---|---|
| **Opening** | A serif count from 00 to 100 while a thread of light draws, then the ink curtain parts. Once per visit. |
| **The threshold (hero)** | A glowing arch with the light-tunnel video inside, the title spread across it in a difference blend. Scrolling pins the scene and the doorway swells until its light fills the screen. |
| **The book** | The opening sentence darkens word by word; the books open out from a slit to full width; an arch-framed image drifts inside its frame; highlights set as i. ii. iii. with drawn rules. |
| **Six threads** | Pinned horizontal gallery — vertical scroll slides the themes sideways, giant outlined numerals drifting at their own pace, with a progress rule. Vertical list on phones. |
| **Author** | His name runs as a giant band of type with scroll; the portrait unmasks inside an arch; bio darkens as you read; “30+” counts up. |
| **Contents** | A printed-style table of contents. Rows fill with ink on hover while the book floats beside the pointer, tilting with its speed; open a row for the summary. |
| **Interlude** | A small window of rising light opens to full-bleed, the premise lighting up word by word over it. |
| **Why it matters** | Sticky statement beside cards that stack like pages laid on a pile. |
| **Voices** | One review at a time, large, cycling on a timer shown in the tabs. |
| **Begin the journey** | Scroll-driven running headline, the book standing in a window of night, stores as big rows that fill with ink. |
| **Footer** | Newsletter on an underline, index, links, and the name rising letter by letter. |

Also: Lenis smooth scrolling, a difference-blend masthead that reads on dark and light alike, a
custom cursor that opens into “Open / Read / Buy” discs, a scroll progress line, a full-screen menu on
phones, and an excerpt reader set like a printed page. Everything respects `prefers-reduced-motion`,
and if an image can't load, a CSS-drawn cover stands in.

### Background videos

`public/videos/` holds three seamless loops (MP4 + WebM + poster), ~1.3 MB in total as WebM:
`light-tunnel` (inside the hero doorway), `rising-light` (interlude) and `nebula-drift` (buy section). They are original —
rendered from GLSL shaders in `scripts/render-videos/` — so there's no stock licence to track. To tweak
and re-render: `npx playwright install chromium && npm run render:videos` (needs ffmpeg).

Any video can be swapped for your own `.mp4`/`.webm` URL from **Dashboard → Website**.

### Images

Images still load from the WordPress uploads folder (`media:` references, see `src/lib/media.ts`).
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

- **Theme card one-liners** under “What this book explores” are new copy, written from the site's
  existing wording — check they read right to Dr. Antoine.
- The **quote** section line is adapted from the “Why this book matters” paragraph.
- **Excerpt** is empty — paste a passage in Dashboard → Website → Excerpt to turn on the reader.
  Until then “Read an Excerpt” scrolls to the chapter previews (as on the old site).
- **Social links** were `#` placeholders on the old site, so icons are hidden until real links are added.
- **Prices** aren't shown anywhere until filled in under Buy links.

## Project layout

```
src/
  site/        Site.tsx (page + Lenis), sections/, components/ (Starfield, Book3D, BgVideo, RevealText…)
  admin/       Admin.tsx (lock + shell), views/, charts.tsx, components.tsx, ui.tsx
  data/        types, defaultContent (all site copy), stores, demo data, constants
  lib/         gsap, store, metrics (all dashboard maths), media, format, csv, analytics, passcode
scripts/       fetch-media.mjs, render-videos/ (shaders + renderer)
public/videos  rendered background loops
```
