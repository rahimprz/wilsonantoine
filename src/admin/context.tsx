import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { useStore } from "../lib/store";
import { rangeFor, type Range, type RangeKey } from "../lib/metrics";
import { money as fmtMoney } from "../lib/format";
import { salesStore, settingsStore } from "../data/stores";

interface AdminState {
  rangeKey: RangeKey;
  setRangeKey: (k: RangeKey) => void;
  range: Range;
  currency: string;
  money: (v: number, compact?: boolean) => string;
}

const AdminContext = createContext<AdminState | null>(null);

export function useAdmin() {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error("useAdmin must be used inside <AdminProvider>");
  return ctx;
}

const RANGE_KEY = "wa.admin.range";

export function AdminProvider({ children }: { children: ReactNode }) {
  const sales = useStore(salesStore);
  const { currency } = useStore(settingsStore);
  const [rangeKey, setKey] = useState<RangeKey>(() => {
    try {
      // sales often arrive as one entry per publisher statement, so the whole history is the useful default
      return (localStorage.getItem(RANGE_KEY) as RangeKey) || "all";
    } catch {
      return "all";
    }
  });
  const setRangeKey = useCallback((k: RangeKey) => {
    setKey(k);
    try {
      localStorage.setItem(RANGE_KEY, k);
    } catch {
      /* ignore */
    }
  }, []);
  const range = useMemo(() => rangeFor(rangeKey, sales), [rangeKey, sales]);
  const value = useMemo<AdminState>(
    () => ({ rangeKey, setRangeKey, range, currency, money: (v, compact) => fmtMoney(v, currency, compact) }),
    [rangeKey, setRangeKey, range, currency],
  );
  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}
