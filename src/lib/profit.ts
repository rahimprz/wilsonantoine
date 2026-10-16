import { DIRECT_CHANNELS, GIVEAWAY_CHANNEL } from "../data/constants";
import type { Deal, Partner, Payout, PrintRun, Sale } from "../data/types";
import { gross, inRange } from "./metrics";

/**
 * The book's money, the way the publisher's statement reads it:
 *
 *   sales revenue − distributor share = net revenue received
 *   net revenue − printing cost        = net profit
 *   net profit × each partner's share  = profit earned
 *
 * Everything here is a pure function of the stored records, so a server can run the same maths.
 */

const round = (v: number) => Math.round(v * 100) / 100;

export const costOf = (s: Sale) => s.cost ?? 0;
export const profitOf = (s: Sale) => s.net - costOf(s);
export const isGiveaway = (s: Sale) => s.channel === GIVEAWAY_CHANNEL;

// ---------------------------------------------------------------- printing

export interface FormatStock {
  format: string;
  printed: number;
  printCost: number; // total spent printing this format
  unitCost: number; // average printing cost per copy
  sold: number; // paid copies
  givenAway: number;
  remaining: number;
  stockValue: number; // remaining copies at cost
}

/** Formats that have been printed, with the average cost per copy across their print runs. */
export function printing(runs: PrintRun[]) {
  const map = new Map<string, { qty: number; cost: number }>();
  for (const r of runs) {
    const m = map.get(r.format) ?? { qty: 0, cost: 0 };
    m.qty += r.quantity;
    m.cost += r.quantity * r.unitCost;
    map.set(r.format, m);
  }
  const unitCost = (format: string) => {
    const m = map.get(format);
    return m && m.qty > 0 ? m.cost / m.qty : 0;
  };
  const formats = [...map.keys()];
  // the edition the statement talks about: the one printed in the largest numbers
  const main = formats.sort((a, b) => (map.get(b)!.qty ?? 0) - (map.get(a)!.qty ?? 0))[0] ?? "";
  return { isPrinted: (format: string) => map.has(format), unitCost, formats, main, totals: map };
}

export type Printing = ReturnType<typeof printing>;

export function stock(runs: PrintRun[], sales: Sale[]): FormatStock[] {
  const p = printing(runs);
  return p.formats
    .map((format) => {
      const t = p.totals.get(format)!;
      const mine = sales.filter((s) => s.format === format);
      const givenAway = mine.filter(isGiveaway).reduce((a, s) => a + s.quantity, 0);
      const sold = mine.filter((s) => !isGiveaway(s)).reduce((a, s) => a + s.quantity, 0);
      const remaining = t.qty - sold - givenAway;
      const unitCost = p.unitCost(format);
      return { format, printed: t.qty, printCost: t.cost, unitCost, sold, givenAway, remaining, stockValue: Math.max(0, remaining) * unitCost };
    })
    .sort((a, b) => b.printed - a.printed);
}

// ---------------------------------------------------------------- one sale

/** Distributor/retailer share (percent of the sale) a new sale starts with. */
export function vendorShareFor(format: string, channel: string, deal: Deal, royaltyRates: Record<string, number>, p: Printing) {
  if (DIRECT_CHANNELS.includes(channel)) return 0;
  if (p.isPrinted(format)) return deal.vendorShare;
  return 100 - (royaltyRates[format] ?? 100);
}

/** The per-copy breakdown in section 03 of the statement. */
export function perCopy(deal: Deal, p: Printing) {
  const price = deal.listPrice;
  const vendor = round(price * (deal.vendorShare / 100));
  const net = round(price - vendor);
  const cost = round(p.unitCost(p.main));
  return { price, vendor, net, cost, profit: round(net - cost), format: p.main };
}

// ---------------------------------------------------------------- a period

export interface Ledger {
  orders: number;
  units: number; // paid copies
  givenAway: number;
  gross: number;
  vendor: number;
  net: number;
  cost: number;
  profit: number;
}

export function ledger(sales: Sale[]): Ledger {
  const l: Ledger = { orders: 0, units: 0, givenAway: 0, gross: 0, vendor: 0, net: 0, cost: 0, profit: 0 };
  for (const s of sales) {
    l.orders++;
    if (isGiveaway(s)) l.givenAway += s.quantity;
    else l.units += s.quantity;
    const g = gross(s);
    l.gross += g;
    l.vendor += g - s.net;
    l.net += s.net;
    l.cost += costOf(s);
  }
  l.profit = l.net - l.cost;
  for (const k of Object.keys(l) as (keyof Ledger)[]) l[k] = round(l[k]);
  return l;
}

export const salesIn = (sales: Sale[], start: string, end: string) => sales.filter((s) => inRange(s.date, start, end));

// ---------------------------------------------------------------- the split

/** Each partner's fraction of shared profit: by investment, or the custom percentages. Falls back to equal shares. */
export function shares(partners: Partner[], deal: Deal): Map<string, number> {
  const out = new Map<string, number>();
  if (!partners.length) return out;
  const weights = partners.map((p) => (deal.splitBy === "custom" ? Math.max(0, deal.customShares[p.id] ?? 0) : Math.max(0, p.investment)));
  const total = weights.reduce((a, b) => a + b, 0);
  partners.forEach((p, i) => out.set(p.id, total > 0 ? weights[i] / total : 1 / partners.length));
  return out;
}

export interface PartnerLine {
  partner: Partner;
  share: number;
  investment: number;
  earned: number; // profit earned in the period
  paidProfit: number; // profit paid out in the period
  paidCapital: number; // investment returned in the period
  balance: number; // earned − paid profit
}

/**
 * Who earned what. Shared profit (printed copies, or everything when the split covers all sales)
 * is divided by share; profit from formats outside the deal goes wholly to the owner.
 */
export function distribution(partners: Partner[], deal: Deal, sales: Sale[], payouts: Payout[], p: Printing) {
  const covered = (s: Sale) => deal.splitScope === "all" || p.isPrinted(s.format);
  const shared = ledger(sales.filter(covered));
  const ownerOnly = ledger(sales.filter((s) => !covered(s)));
  const split = shares(partners, deal);
  const lines: PartnerLine[] = partners.map((partner) => {
    const share = split.get(partner.id) ?? 0;
    const earned = round(shared.profit * share + (partner.owner ? ownerOnly.profit : 0));
    const mine = payouts.filter((x) => x.partnerId === partner.id);
    const paidProfit = round(mine.filter((x) => x.kind === "profit").reduce((a, x) => a + x.amount, 0));
    const paidCapital = round(mine.filter((x) => x.kind === "capital").reduce((a, x) => a + x.amount, 0));
    return { partner, share, investment: partner.investment, earned, paidProfit, paidCapital, balance: round(earned - paidProfit) };
  });
  return { shared, ownerOnly, lines };
}

// ---------------------------------------------------------------- outlook

/**
 * How far the investment has come back, and where the book lands if every printed copy sells.
 * Break-even counts copies at the cover price after the distributor's share.
 */
export function outlook(partners: Partner[], deal: Deal, runs: PrintRun[], sales: Sale[]) {
  const p = printing(runs);
  const invested = round(partners.reduce((a, x) => a + Math.max(0, x.investment), 0));
  const copy = perCopy(deal, p);
  const printedSales = sales.filter((s) => p.isPrinted(s.format));
  const l = ledger(printedSales);
  const st = stock(runs, sales);
  const remaining = st.reduce((a, f) => a + Math.max(0, f.remaining), 0);
  const printed = st.reduce((a, f) => a + f.printed, 0);
  const breakEvenCopies = invested > 0 && copy.net > 0 ? Math.ceil(invested / copy.net - 1e-9) : null;
  const projectedProfit = round(l.profit + remaining * copy.profit);
  return {
    invested,
    netReceived: l.net,
    recovered: invested > 0 ? l.net / invested : 0,
    copiesSold: l.units,
    breakEvenCopies,
    copiesToGo: invested > 0 && copy.net > 0 ? Math.max(0, Math.ceil((invested - l.net) / copy.net - 1e-9)) : null,
    stockValue: round(st.reduce((a, f) => a + f.stockValue, 0)),
    remaining,
    printed,
    projectedProfit,
    perCopy: copy,
  };
}
