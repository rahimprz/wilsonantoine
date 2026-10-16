import { addDays, isoDay } from "../lib/format";
import { uid } from "../lib/id";
import { DEFAULT_ROYALTY } from "./constants";
import { eventsStore, leadsStore, payoutsStore, printRunsStore, repsStore, salesStore, subscribersStore } from "./stores";
import type { Lead, LeadStage, PrintRun, Rep, Sale, SiteEvent, Subscriber } from "./types";

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
  return [salesStore, leadsStore, repsStore, subscribersStore, eventsStore, printRunsStore, payoutsStore].some((s) =>
    (s.get() as { demo?: boolean }[]).some((r) => r.demo),
  );
}

export function clearDemoData() {
  salesStore.set((p) => p.filter((r) => !r.demo));
  leadsStore.set((p) => p.filter((r) => !r.demo));
  repsStore.set((p) => p.filter((r) => !r.demo));
  subscribersStore.set((p) => p.filter((r) => !r.demo));
  eventsStore.set((p) => p.filter((r) => !r.demo));
  printRunsStore.set((p) => p.filter((r) => !r.demo));
  payoutsStore.set((p) => p.filter((r) => !r.demo));
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
  // two demo print runs of the paperback (the second a cheaper reprint), so stock and printing costs have something to draw on
  const runs: PrintRun[] = [
    { id: uid("run_"), date: isoDay(addDays(today, -160)), format: "Paperback", quantity: 500, unitCost: 10, printer: "Jinnx Book Press", notes: "Demo — first printing", demo: true, createdAt: now - 160 * 864e5 },
    { id: uid("run_"), date: isoDay(addDays(today, -60)), format: "Paperback", quantity: 500, unitCost: 9.5, printer: "Jinnx Book Press", notes: "Demo — reprint", demo: true, createdAt: now - 60 * 864e5 },
  ];
  const unitCost = 9.75;
  const formats = ["Paperback", "Kindle eBook"] as const;
  const prices: Record<string, number> = { "Kindle eBook": 9.99, Paperback: 25 };
  for (let back = 150; back >= 0; back--) {
    const day = addDays(today, -back);
    const launch = back > 120 && back < 135 ? 2.2 : 1;
    const trend = 0.45 + 1.4 * ((150 - back) / 150) ** 1.4; // steady growth after launch
    const weekend = [0, 6].includes(day.getDay()) ? 1.25 : 1;
    const orders = Math.floor(r() * 3 * trend * launch * weekend);
    for (let o = 0; o < orders; o++) {
      const format = pick(formats, [55, 45]);
      const channel = format === "Paperback" ? pick(["Distributor", "Website (direct)"], [88, 12]) : pick(["Amazon", "Apple Books", "Kobo"], [80, 12, 8]);
      const quantity = r() < 0.9 ? 1 : 2;
      const unitPrice = prices[format];
      const rate = channel === "Website (direct)" ? 100 : format === "Paperback" ? 60 : DEFAULT_ROYALTY[format];
      sales.push({
        id: uid("s_"),
        date: isoDay(day),
        channel,
        format,
        quantity,
        unitPrice,
        net: +(quantity * unitPrice * (rate / 100)).toFixed(2),
        cost: format === "Paperback" ? quantity * unitCost : 0,
        repId: channel === "Website (direct)" && r() < 0.4 ? reps[2].id : "",
        customer: "",
        notes: "",
        demo: true,
        createdAt: day.getTime(),
      });
    }
    // now and then a few review copies go out
    if (r() < 0.02) {
      const quantity = 2 + Math.floor(r() * 4);
      sales.push({
        id: uid("s_"),
        date: isoDay(day),
        channel: "Complimentary copy",
        format: "Paperback",
        quantity,
        unitPrice: 0,
        net: 0,
        cost: quantity * unitCost,
        repId: "",
        customer: pick(["Podcast host", "Book reviewer", "Church library", "Grief counsellor"]),
        notes: "Review copy",
        demo: true,
        createdAt: day.getTime(),
      });
    }
    // occasional signing events and institutional orders, attributed to reps
    if (r() < 0.05) {
      const rep = pick(reps);
      const quantity = 6 + Math.floor(r() * 18);
      sales.push({
        id: uid("s_"),
        date: isoDay(day),
        channel: "Event / signing",
        format: "Paperback",
        quantity,
        unitPrice: 25,
        net: quantity * 25,
        cost: quantity * unitCost,
        repId: rep.id,
        customer: pick(["Grace Fellowship signing", "Community library talk", "Wellness expo booth", "Book fair table"]),
        notes: "",
        demo: true,
        createdAt: day.getTime(),
      });
    }
    if (r() < 0.025) {
      const rep = pick(reps);
      const quantity = 15 + Math.floor(r() * 40);
      sales.push({
        id: uid("s_"),
        date: isoDay(day),
        channel: "Bulk / institutional",
        format: "Paperback",
        quantity,
        unitPrice: 20,
        net: quantity * 20,
        cost: quantity * unitCost,
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
  printRunsStore.set((p) => [...p, ...runs]);
  payoutsStore.set((p) => [
    ...p,
    { id: uid("pay_"), date: isoDay(addDays(today, -40)), partnerId: "p_owner", kind: "profit", amount: 150, method: "Bank transfer", reference: "Demo", notes: "Demo — first profit distribution", demo: true, createdAt: now - 40 * 864e5 },
  ]);
  leadsStore.set((p) => [...p, ...leads]);
  subscribersStore.set((p) => [...p, ...subscribers]);
  eventsStore.set((p) => [...p, ...events].sort((a, b) => a.t - b.t));
}
