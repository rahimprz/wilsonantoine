import { STAGES } from "../data/constants";
import type { Lead, Rep, Sale, SiteEvent } from "../data/types";
import { addDays, fmtDay, fmtMonth, isoDay, parseDay } from "./format";

export type RangeKey = "7d" | "30d" | "90d" | "mtd" | "ytd" | "12m" | "all";

export const RANGE_OPTIONS: { key: RangeKey; label: string }[] = [
  { key: "7d", label: "Last 7 days" },
  { key: "30d", label: "Last 30 days" },
  { key: "90d", label: "Last 90 days" },
  { key: "mtd", label: "Month to date" },
  { key: "ytd", label: "Year to date" },
  { key: "12m", label: "Last 12 months" },
  { key: "all", label: "All time" },
];

export interface Range {
  key: RangeKey;
  start: string; // inclusive YYYY-MM-DD
  end: string; // inclusive
  prevStart: string;
  prevEnd: string;
  days: number;
}

export function rangeFor(key: RangeKey, sales: Sale[] = []): Range {
  const today = new Date();
  const end = isoDay(today);
  let start: Date;
  switch (key) {
    case "7d":
      start = addDays(today, -6);
      break;
    case "30d":
      start = addDays(today, -29);
      break;
    case "90d":
      start = addDays(today, -89);
      break;
    case "mtd":
      start = new Date(today.getFullYear(), today.getMonth(), 1);
      break;
    case "ytd":
      start = new Date(today.getFullYear(), 0, 1);
      break;
    case "12m":
      start = new Date(today.getFullYear(), today.getMonth() - 11, 1);
      break;
    case "all": {
      const first = sales.reduce((min, s) => (s.date < min ? s.date : min), end);
      start = parseDay(first);
      if (isoDay(start) === end) start = addDays(today, -29);
      break;
    }
  }
  const days = Math.round((parseDay(end).getTime() - start.getTime()) / 864e5) + 1;
  const prevEnd = addDays(start, -1);
  return { key, start: isoDay(start), end, prevStart: isoDay(addDays(prevEnd, -(days - 1))), prevEnd: isoDay(prevEnd), days };
}

export const inRange = (date: string, start: string, end: string) => date >= start && date <= end;

export const gross = (s: Sale) => s.quantity * s.unitPrice;

export interface Totals {
  gross: number;
  net: number;
  units: number;
  orders: number;
  aov: number;
}

export function totals(sales: Sale[]): Totals {
  let g = 0;
  let n = 0;
  let u = 0;
  for (const s of sales) {
    g += gross(s);
    n += s.net;
    u += s.quantity;
  }
  return { gross: g, net: n, units: u, orders: sales.length, aov: sales.length ? g / sales.length : 0 };
}

/** Change vs. the previous period, or null when there's nothing to compare against. */
export const delta = (now: number, before: number) => (before > 0 ? (now - before) / before : null);

export interface Bucket {
  key: string;
  label: string;
  start: string;
  gross: number;
  net: number;
  units: number;
}

export type Grain = "day" | "week" | "month";

export function grainFor(days: number): Grain {
  return days <= 45 ? "day" : days <= 200 ? "week" : "month";
}

/** Time buckets covering the whole range (empty days included, so lines don't skip gaps). */
export function series(sales: Sale[], start: string, end: string, grain = grainFor(daysBetween(start, end))): Bucket[] {
  const buckets: Bucket[] = [];
  const index = new Map<string, Bucket>();
  const bucketKey = (d: Date) => {
    if (grain === "day") return isoDay(d);
    if (grain === "week") {
      const monday = addDays(d, -((d.getDay() + 6) % 7));
      return isoDay(monday);
    }
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  };
  let cursor = parseDay(start);
  const last = parseDay(end);
  while (cursor <= last) {
    const key = bucketKey(cursor);
    if (!index.has(key)) {
      const label =
        grain === "month" ? fmtMonth(cursor) : grain === "week" ? `Wk of ${fmtDay(key)}` : fmtDay(isoDay(cursor));
      const b: Bucket = { key, label, start: isoDay(cursor), gross: 0, net: 0, units: 0 };
      index.set(key, b);
      buckets.push(b);
    }
    cursor = addDays(cursor, 1);
  }
  for (const s of sales) {
    if (!inRange(s.date, start, end)) continue;
    const b = index.get(bucketKey(parseDay(s.date)));
    if (!b) continue;
    b.gross += gross(s);
    b.net += s.net;
    b.units += s.quantity;
  }
  return buckets;
}

export function daysBetween(start: string, end: string) {
  return Math.round((parseDay(end).getTime() - parseDay(start).getTime()) / 864e5) + 1;
}

export interface Group {
  key: string;
  gross: number;
  net: number;
  units: number;
  orders: number;
}

export function groupBy(sales: Sale[], field: "format" | "channel" | "repId"): Group[] {
  const map = new Map<string, Group>();
  for (const s of sales) {
    const k = s[field] || "";
    const g = map.get(k) ?? { key: k, gross: 0, net: 0, units: 0, orders: 0 };
    g.gross += gross(s);
    g.net += s.net;
    g.units += s.quantity;
    g.orders += 1;
    map.set(k, g);
  }
  return [...map.values()].sort((a, b) => b.gross - a.gross);
}

export interface RepStat {
  rep: Rep;
  units: number;
  gross: number;
  commission: number;
  monthUnits: number;
  targetProgress: number;
  openLeads: number;
  won: number;
  lost: number;
  winRate: number | null;
  pipelineValue: number;
}

export function repStats(reps: Rep[], sales: Sale[], leads: Lead[], start: string, end: string): RepStat[] {
  const monthStart = isoDay(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const today = isoDay();
  return reps
    .map((rep) => {
      const mine = sales.filter((s) => s.repId === rep.id);
      const period = mine.filter((s) => inRange(s.date, start, end));
      const t = totals(period);
      const monthUnits = totals(mine.filter((s) => inRange(s.date, monthStart, today))).units;
      const myLeads = leads.filter((l) => l.repId === rep.id);
      const won = myLeads.filter((l) => l.stage === "won").length;
      const lost = myLeads.filter((l) => l.stage === "lost").length;
      const open = myLeads.filter((l) => l.stage !== "won" && l.stage !== "lost");
      return {
        rep,
        units: t.units,
        gross: t.gross,
        commission: (t.gross * rep.commission) / 100,
        monthUnits,
        targetProgress: rep.monthlyTarget > 0 ? monthUnits / rep.monthlyTarget : 0,
        openLeads: open.length,
        won,
        lost,
        winRate: won + lost > 0 ? won / (won + lost) : null,
        pipelineValue: open.reduce((a, l) => a + l.value, 0),
      };
    })
    .sort((a, b) => b.gross - a.gross);
}

export function pipeline(leads: Lead[]) {
  const byStage = STAGES.map((st) => {
    const items = leads.filter((l) => l.stage === st.id);
    return { ...st, count: items.length, value: items.reduce((a, l) => a + l.value, 0), units: items.reduce((a, l) => a + l.units, 0) };
  });
  const open = leads.filter((l) => l.stage !== "won" && l.stage !== "lost");
  const weighted = open.reduce((a, l) => a + l.value * (STAGES.find((s) => s.id === l.stage)?.probability ?? 0), 0);
  const won = leads.filter((l) => l.stage === "won").length;
  const lost = leads.filter((l) => l.stage === "lost").length;
  const today = isoDay();
  const due = open
    .filter((l) => l.followUp && l.followUp <= isoDay(addDays(new Date(), 7)))
    .sort((a, b) => a.followUp.localeCompare(b.followUp));
  return {
    byStage,
    openValue: open.reduce((a, l) => a + l.value, 0),
    openCount: open.length,
    weighted,
    winRate: won + lost > 0 ? won / (won + lost) : null,
    due,
    overdue: due.filter((l) => l.followUp < today).length,
  };
}

export function engagement(events: SiteEvent[], start: string, end: string) {
  const s = parseDay(start).getTime();
  const e = parseDay(end).getTime() + 864e5;
  const counts = { visit: 0, pageview: 0, buy_click: 0, excerpt_open: 0, chapter_open: 0, subscribe: 0 };
  const retailers = new Map<string, number>();
  for (const ev of events) {
    if (ev.t < s || ev.t >= e) continue;
    counts[ev.type]++;
    if (ev.type === "buy_click" && ev.meta) retailers.set(ev.meta, (retailers.get(ev.meta) ?? 0) + 1);
  }
  return {
    ...counts,
    clickThrough: counts.visit ? counts.buy_click / counts.visit : 0,
    retailers: [...retailers.entries()].sort((a, b) => b[1] - a[1]),
  };
}

/** This month so far, and where it lands at the current daily pace. */
export function monthPace(sales: Sale[]) {
  const now = new Date();
  const start = isoDay(new Date(now.getFullYear(), now.getMonth(), 1));
  const t = totals(sales.filter((s) => inRange(s.date, start, isoDay(now))));
  const day = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const factor = daysInMonth / day;
  return { ...t, projectedUnits: t.units * factor, projectedGross: t.gross * factor, day, daysInMonth };
}
