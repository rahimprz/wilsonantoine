import { addDays, isoDay } from "../lib/format";
import { uid } from "../lib/id";
import { DEFAULT_ROYALTY } from "./constants";
import { eventsStore, leadsStore, repsStore, salesStore, subscribersStore } from "./stores";
import type { Lead, LeadStage, Rep, Sale, SiteEvent, Subscriber } from "./types";

/**
 * Sample records so the dashboard can be explored before real sales are entered.
 * Every record carries demo: true, is badged in the UI, and "Clear demo data" removes exactly these.
 */

function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hasDemoData(): boolean {
  return [salesStore, leadsStore, repsStore, subscribersStore, eventsStore].some((s) =>
    (s.get() as { demo?: boolean }[]).some((r) => r.demo),
  );
}

export function clearDemoData() {
  salesStore.set((p) => p.filter((r) => !r.demo));
  leadsStore.set((p) => p.filter((r) => !r.demo));
  repsStore.set((p) => p.filter((r) => !r.demo));
  subscribersStore.set((p) => p.filter((r) => !r.demo));
  eventsStore.set((p) => p.filter((r) => !r.demo));
}

export function loadDemoData() {
  clearDemoData();
  const r = rng(20260105);
  const pick = <T,>(arr: readonly T[], weights?: number[]) => {
    if (!weights) return arr[Math.floor(r() * arr.length)];
    const total = weights.reduce((a, b) => a + b, 0);
    let x = r() * total;
    for (let i = 0; i < arr.length; i++) if ((x -= weights[i]) < 0) return arr[i];
    return arr[arr.length - 1];
  };
  const now = Date.now();
  const today = new Date();

  const reps: Rep[] = [
    { name: "Avery Collins", region: "Northeast", commission: 10, monthlyTarget: 25, email: "avery@example.com" },
    { name: "Jordan Reyes", region: "South & Caribbean", commission: 12, monthlyTarget: 30, email: "jordan@example.com" },
    { name: "Priya Nair", region: "Online & media", commission: 8, monthlyTarget: 20, email: "priya@example.com" },
  ].map((p, i) => ({ ...p, id: uid("rep_"), phone: "", active: true, demo: true, createdAt: now - (i + 1) * 864e5 * 90 }));

  // ~150 days of sales with a launch bump and a gentle upward trend
  const sales: Sale[] = [];
  const formats = ["Kindle eBook", "Paperback", "Hardcover", "Audiobook"] as const;
  const prices: Record<string, number> = { "Kindle eBook": 9.99, Paperback: 17.99, Hardcover: 26.99, Audiobook: 19.99 };
  for (let back = 150; back >= 0; back--) {
    const day = addDays(today, -back);
    const launch = back > 120 && back < 135 ? 2.2 : 1;
    const trend = 0.45 + 1.4 * ((150 - back) / 150) ** 1.4; // steady growth after launch
    const weekend = [0, 6].includes(day.getDay()) ? 1.25 : 1;
    const orders = Math.floor(r() * 3 * trend * launch * weekend);
    for (let o = 0; o < orders; o++) {
      const format = pick(formats, [55, 28, 9, 8]);
      const channel = pick(["Amazon", "Barnes & Noble", "Apple Books", "Kobo", "Website (direct)"], [70, 10, 8, 4, 8]);
      const quantity = r() < 0.9 ? 1 : 2;
      const unitPrice = prices[format];
      const rate = channel === "Website (direct)" ? 85 : DEFAULT_ROYALTY[format];
      sales.push({
        id: uid("s_"),
        date: isoDay(day),
        channel,
        format,
        quantity,
        unitPrice,
        net: +(quantity * unitPrice * (rate / 100)).toFixed(2),
        repId: channel === "Website (direct)" && r() < 0.4 ? reps[2].id : "",
        customer: "",
        notes: "",
        demo: true,
        createdAt: day.getTime(),
      });
    }
    // occasional signing events and institutional orders, attributed to reps
    if (r() < 0.05) {
      const rep = pick(reps);
      const quantity = 8 + Math.floor(r() * 25);
      sales.push({
        id: uid("s_"),
        date: isoDay(day),
        channel: "Event / signing",
        format: "Paperback",
        quantity,
        unitPrice: 18,
        net: +(quantity * 18 * 0.55).toFixed(2),
        repId: rep.id,
        customer: pick(["Grace Fellowship signing", "Community library talk", "Wellness expo booth", "Book fair table"]),
        notes: "",
        demo: true,
        createdAt: day.getTime(),
      });
    }
    if (r() < 0.025) {
      const rep = pick(reps);
      const quantity = 20 + Math.floor(r() * 60);
      sales.push({
        id: uid("s_"),
        date: isoDay(day),
        channel: "Bulk / institutional",
        format: pick(["Paperback", "Hardcover"]),
        quantity,
        unitPrice: 14,
        net: +(quantity * 14 * 0.5).toFixed(2),
        repId: rep.id,
        customer: pick(["St. Mary's Hospice", "Riverside Library System", "New Hope Church", "Healing Hearts Grief Group"]),
        notes: "Bulk discount applied",
        demo: true,
        createdAt: day.getTime(),
      });
    }
  }

  const leadSeeds: [string, string, LeadStage, number, number][] = [
    ["Riverside Library System", "Library", "negotiating", 60, 840],
    ["Grace Fellowship Church", "Church / faith group", "contacted", 120, 1680],
    ["Hope Hospice Network", "Hospice / hospital", "prospect", 80, 1120],
    ["Beyond the Veil Podcast", "Podcast / media", "contacted", 0, 0],
    ["Midtown Books & Café", "Bookstore", "negotiating", 30, 450],
    ["Wellness & Spirit Expo", "Speaking event", "won", 45, 810],
    ["Second Chapter Book Club", "Book club", "prospect", 15, 225],
    ["Lakeside Medical Society", "Speaking event", "lost", 40, 600],
    ["Healing Hearts Grief Group", "Church / faith group", "won", 50, 700],
    ["Northgate Bookstore", "Bookstore", "prospect", 20, 300],
  ];
  const leads: Lead[] = leadSeeds.map(([org, type, stage, units, value], i) => ({
    id: uid("l_"),
    org,
    type,
    stage,
    units,
    value,
    contact: pick(["Maria Lopez", "James Carter", "Denise Brooks", "Samuel Okafor", "Linda Chen"]),
    email: "",
    phone: "",
    repId: reps[i % reps.length].id,
    followUp: stage === "won" || stage === "lost" ? "" : isoDay(addDays(today, Math.round(r() * 14) - 4)),
    notes: "",
    demo: true,
    createdAt: now - (20 + i * 3) * 864e5,
    updatedAt: now - i * 864e5,
  }));

  const subscribers: Subscriber[] = Array.from({ length: 18 }, (_, i) => ({
    id: uid("sub_"),
    email: `reader${i + 1}@example.com`,
    name: "",
    source: r() < 0.7 ? "website" : "excerpt",
    date: addDays(today, -Math.floor(r() * 60)).toISOString(),
    demo: true,
  }));

  const events: SiteEvent[] = [];
  for (let back = 59; back >= 0; back--) {
    const base = addDays(today, -back).setHours(9, 0, 0, 0);
    const visits = 12 + Math.floor(r() * 25 * (0.7 + (60 - back) / 90));
    for (let v = 0; v < visits; v++) {
      const t = base + Math.floor(r() * 12 * 3600e3);
      events.push({ t, type: "visit", demo: true });
      if (r() < 0.25) events.push({ t: t + 30e3, type: "chapter_open", meta: "Between Two Worlds", demo: true });
      if (r() < 0.14) events.push({ t: t + 45e3, type: "excerpt_open", demo: true });
      if (r() < 0.09) events.push({ t: t + 60e3, type: "buy_click", meta: "Amazon · Kindle eBook", demo: true });
    }
  }
  for (const s of subscribers) events.push({ t: new Date(s.date).getTime(), type: "subscribe", demo: true });
  events.sort((a, b) => a.t - b.t);

  repsStore.set((p) => [...p, ...reps]);
  salesStore.set((p) => [...p, ...sales]);
  leadsStore.set((p) => [...p, ...leads]);
  subscribersStore.set((p) => [...p, ...subscribers]);
  eventsStore.set((p) => [...p, ...events].sort((a, b) => a.t - b.t));
}
