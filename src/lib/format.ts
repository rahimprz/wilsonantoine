const moneyCache = new Map<string, Intl.NumberFormat>();

export function money(value: number, currency = "USD", compact = false): string {
  const key = `${currency}-${compact}`;
  let fmt = moneyCache.get(key);
  if (!fmt) {
    try {
      fmt = new Intl.NumberFormat(undefined, {
        style: "currency",
        currency,
        notation: compact ? "compact" : "standard",
        maximumFractionDigits: compact ? 1 : 2,
        minimumFractionDigits: compact ? 0 : undefined,
      });
    } catch {
      fmt = new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" });
    }
    moneyCache.set(key, fmt);
  }
  return fmt.format(Number.isFinite(value) ? value : 0);
}

const intFmt = new Intl.NumberFormat();
export const num = (value: number) => intFmt.format(Math.round(value));

export const pct = (value: number, digits = 0) =>
  `${(Number.isFinite(value) ? value * 100 : 0).toFixed(digits)}%`;

/** Local YYYY-MM-DD (not UTC, so "today" matches the owner's calendar). */
export function isoDay(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseDay(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

export function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

const dayFmt = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" });
const dayYearFmt = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" });
const monthFmt = new Intl.DateTimeFormat(undefined, { month: "short", year: "2-digit" });

export const fmtDay = (s: string) => dayFmt.format(parseDay(s));
export const fmtDayYear = (s: string) => dayYearFmt.format(parseDay(s));
export const fmtMonth = (d: Date) => monthFmt.format(d);

export function relativeDays(s: string): string {
  const today = parseDay(isoDay());
  const diff = Math.round((parseDay(s).getTime() - today.getTime()) / 86400000);
  if (diff === 0) return "today";
  if (diff === 1) return "tomorrow";
  if (diff === -1) return "yesterday";
  return diff > 0 ? `in ${diff} days` : `${-diff} days ago`;
}

export function greeting(d = new Date()): string {
  const h = d.getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}
