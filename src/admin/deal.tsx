import { useMemo, useRef, useState } from "react";
import { CalendarDays, Plus, Trash2, Upload } from "lucide-react";
import { useStore } from "../lib/store";
import { addDays, fmtDayYear, isoDay } from "../lib/format";
import { uid } from "../lib/id";
import { distribution, printing } from "../lib/profit";
import { FORMATS, PAYOUT_METHODS } from "../data/constants";
import { dealStore, importBackup, partnersStore, payoutsStore, printRunsStore, salesStore } from "../data/stores";
import type { Deal, Partner, Payout, PayoutKind, PrintRun, Sale } from "../data/types";
import { useAdmin } from "./context";
import { Button, Drawer, Field, IconButton, Input, Select, Textarea, useFeedback } from "./ui";

// ---------------------------------------------------------------- periods

export type PeriodKey = "cumulative" | "month" | "lastMonth" | "quarter" | "ytd" | "custom";

export const PERIODS: { key: PeriodKey; label: string }[] = [
  { key: "cumulative", label: "Cumulative" },
  { key: "month", label: "This month" },
  { key: "lastMonth", label: "Last month" },
  { key: "quarter", label: "This quarter" },
  { key: "ytd", label: "Year to date" },
  { key: "custom", label: "Custom dates" },
];

export interface Period {
  key: PeriodKey;
  start: string;
  end: string;
  label: string;
}

/** The first day the book's numbers count from: the deal's start date, else the earliest sale. */
export function firstDay(deal: Deal, sales: Sale[]) {
  if (deal.startDate) return deal.startDate;
  return sales.reduce((min, s) => (s.date < min ? s.date : min), isoDay());
}

export function periodFor(key: PeriodKey, deal: Deal, sales: Sale[], custom: { start: string; end: string }): Period {
  const today = new Date();
  const end = isoDay(today);
  const y = today.getFullYear();
  const m = today.getMonth();
  switch (key) {
    case "month":
      return { key, start: isoDay(new Date(y, m, 1)), end, label: "This month" };
    case "lastMonth": {
      const s = new Date(y, m - 1, 1);
      return { key, start: isoDay(s), end: isoDay(addDays(new Date(y, m, 1), -1)), label: "Last month" };
    }
    case "quarter":
      return { key, start: isoDay(new Date(y, Math.floor(m / 3) * 3, 1)), end, label: "This quarter" };
    case "ytd":
      return { key, start: isoDay(new Date(y, 0, 1)), end, label: "Year to date" };
    case "custom": {
      const start = custom.start || firstDay(deal, sales);
      const stop = custom.end && custom.end >= start ? custom.end : end;
      return { key, start, end: stop, label: `${fmtDayYear(start)} – ${fmtDayYear(stop)}` };
    }
    default: {
      const start = firstDay(deal, sales);
      return { key: "cumulative", start, end, label: `Cumulative since ${fmtDayYear(start)}` };
    }
  }
}

export function usePeriod(initial: PeriodKey = "cumulative", initialCustom = { start: "", end: "" }) {
  const deal = useStore(dealStore);
  const sales = useStore(salesStore);
  const [key, setKey] = useState<PeriodKey>(initial);
  const [custom, setCustom] = useState(initialCustom);
  const period = useMemo(() => periodFor(key, deal, sales, custom), [key, deal, sales, custom]);
  return { period, key, setKey, custom, setCustom };
}

export function PeriodPicker({ state }: { state: ReturnType<typeof usePeriod> }) {
  const { key, setKey, custom, setCustom, period } = state;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <label className="relative inline-flex items-center">
        <span className="sr-only">Period</span>
        <CalendarDays className="pointer-events-none absolute left-3 h-4 w-4 text-gold" />
        <Select value={key} onChange={(e) => setKey(e.target.value as PeriodKey)} className="!w-auto !py-2 pl-9 text-sm">
          {PERIODS.map((p) => (
            <option key={p.key} value={p.key}>
              {p.label}
            </option>
          ))}
        </Select>
      </label>
      {key === "custom" && (
        <>
          <Input type="date" aria-label="From" value={custom.start || period.start} max={custom.end || undefined} onChange={(e) => setCustom({ ...custom, start: e.target.value })} className="!w-auto !py-2 text-sm" />
          <span className="text-haze">–</span>
          <Input type="date" aria-label="To" value={custom.end || period.end} min={custom.start || undefined} onChange={(e) => setCustom({ ...custom, end: e.target.value })} className="!w-auto !py-2 text-sm" />
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------- import a setup or statement file

export function ImportSetupButton({ label = "Import setup file", variant = "secondary" as const }: { label?: string; variant?: "secondary" | "ghost" }) {
  const ref = useRef<HTMLInputElement>(null);
  const { toast } = useFeedback();
  return (
    <>
      <Button variant={variant} onClick={() => ref.current?.click()}>
        <Upload className="h-4 w-4" /> {label}
      </Button>
      <input
        ref={ref}
        type="file"
        accept="application/json,.json"
        hidden
        onChange={async (e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (!file) return;
          try {
            const json = JSON.parse(await file.text());
            // setup files add to what's here; a full backup belongs in Settings → Restore
            const n = importBackup({ ...json, merge: true });
            toast(`Imported ${n} ${n === 1 ? "collection" : "collections"} — existing records were kept`);
          } catch (err) {
            toast(err instanceof Error ? err.message : "Couldn't read that file.", "bad");
          }
        }}
      />
    </>
  );
}

// ---------------------------------------------------------------- deal & partners editor

interface PartnerDraft {
  id: string;
  name: string;
  role: string;
  investment: string;
  owner?: boolean;
  createdAt: number;
  custom: string;
}

export function DealEditor({ open, onClose }: { open: boolean; onClose: () => void }) {
  return open ? <DealForm onClose={onClose} /> : null;
}

function DealForm({ onClose }: { onClose: () => void }) {
  const deal = useStore(dealStore);
  const partners = useStore(partnersStore);
  const { money } = useAdmin();
  const { toast } = useFeedback();
  const [form, setForm] = useState({
    publisher: deal.publisher,
    startDate: deal.startDate,
    listPrice: String(deal.listPrice),
    vendorShare: String(deal.vendorShare),
    lowStockAt: String(deal.lowStockAt),
    splitBy: deal.splitBy,
    splitScope: deal.splitScope,
  });
  const [rows, setRows] = useState<PartnerDraft[]>(() =>
    partners.map((p) => ({ ...p, investment: String(p.investment || ""), custom: String(deal.customShares[p.id] ?? "") })),
  );
  const [error, setError] = useState("");
  const totalInvested = rows.reduce((a, r) => a + (Number(r.investment) || 0), 0);
  const customTotal = rows.reduce((a, r) => a + (Number(r.custom) || 0), 0);
  const setRow = (i: number, patch: Partial<PartnerDraft>) => setRows((rs) => rs.map((r, j) => (j === i ? { ...r, ...patch } : r)));

  const save = () => {
    setError("");
    const price = Number(form.listPrice);
    const share = Number(form.vendorShare);
    if (!rows.length || rows.some((r) => !r.name.trim())) return setError("Every partner needs a name.");
    if (!Number.isFinite(price) || price < 0) return setError("Enter the cover price.");
    if (!Number.isFinite(share) || share < 0 || share > 100) return setError("Distributor share is a percent between 0 and 100.");
    if (rows.some((r) => r.investment !== "" && (!Number.isFinite(Number(r.investment)) || Number(r.investment) < 0))) return setError("Investments must be 0 or more.");
    if (form.splitBy === "custom" && Math.abs(customTotal - 100) > 0.01) return setError(`Custom shares add up to ${customTotal}% — they need to total 100%.`);
    const next: Partner[] = rows.map((r) => ({ id: r.id, name: r.name.trim(), role: r.role.trim(), investment: Number(r.investment) || 0, owner: r.owner, createdAt: r.createdAt }));
    partnersStore.set(next);
    dealStore.set((d) => ({
      ...d,
      publisher: form.publisher.trim(),
      startDate: form.startDate,
      listPrice: price,
      vendorShare: share,
      lowStockAt: Math.max(0, Math.round(Number(form.lowStockAt) || 0)),
      splitBy: form.splitBy,
      splitScope: form.splitScope,
      customShares: Object.fromEntries(rows.map((r) => [r.id, Number(r.custom) || 0])),
    }));
    toast("Deal saved");
    onClose();
  };

  return (
    <Drawer
      open
      onClose={onClose}
      title="The deal"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={save}>
            Save deal
          </Button>
        </>
      }
    >
      <div className="space-y-7">
        <section className="grid grid-cols-2 gap-4">
          <Field label="Publisher" className="col-span-2">
            {(id) => <Input id={id} value={form.publisher} onChange={(e) => setForm({ ...form, publisher: e.target.value })} />}
          </Field>
          <Field label="Cover price (printed copy)" hint="Each new printed sale starts at this price.">
            {(id) => <Input id={id} type="number" min={0} step="0.01" value={form.listPrice} onChange={(e) => setForm({ ...form, listPrice: e.target.value })} />}
          </Field>
          <Field label="Distributor share (%)" hint="What the distribution vendor keeps.">
            {(id) => <Input id={id} type="number" min={0} max={100} step="0.5" value={form.vendorShare} onChange={(e) => setForm({ ...form, vendorShare: e.target.value })} />}
          </Field>
          <Field label="Sales started" hint="“Cumulative” statements run from here.">
            {(id) => <Input id={id} type="date" value={form.startDate} max={isoDay()} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />}
          </Field>
          <Field label="Low-stock alert at (copies)">
            {(id) => <Input id={id} type="number" min={0} step={1} value={form.lowStockAt} onChange={(e) => setForm({ ...form, lowStockAt: e.target.value })} />}
          </Field>
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-medium text-star">Partners &amp; investment</p>
            <span className="text-sm text-mist">Total {money(totalInvested)}</span>
          </div>
          <div className="space-y-3">
            {rows.map((r, i) => (
              <div key={r.id} className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-3.5">
                <div className="grid grid-cols-[1fr_auto] gap-3">
                  <Input aria-label="Partner name" value={r.name} onChange={(e) => setRow(i, { name: e.target.value })} placeholder="Name" />
                  {!r.owner && rows.length > 1 ? (
                    <IconButton label={`Remove ${r.name || "partner"}`} onClick={() => setRows((rs) => rs.filter((_, j) => j !== i))}>
                      <Trash2 className="h-4 w-4" />
                    </IconButton>
                  ) : (
                    <span className="self-center px-2 text-xs text-gold">You</span>
                  )}
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <Input aria-label="Role" value={r.role} onChange={(e) => setRow(i, { role: e.target.value })} placeholder="Role (Author, Publisher…)" />
                  <Input aria-label="Investment" type="number" min={0} step="0.01" value={r.investment} onChange={(e) => setRow(i, { investment: e.target.value })} placeholder="Investment" />
                  {form.splitBy === "custom" && (
                    <Input aria-label="Profit share (%)" className="col-span-2" type="number" min={0} max={100} step="0.5" value={r.custom} onChange={(e) => setRow(i, { custom: e.target.value })} placeholder="Profit share %" />
                  )}
                </div>
              </div>
            ))}
          </div>
          <Button size="sm" variant="ghost" className="mt-2" onClick={() => setRows((rs) => [...rs, { id: uid("p_"), name: "", role: "", investment: "", custom: "", createdAt: Date.now() }])}>
            <Plus className="h-4 w-4" /> Add partner
          </Button>
        </section>

        <section className="grid gap-4">
          <Field label="Profit is split" hint={form.splitBy === "investment" ? "Each partner's share follows what they put in (equal if nothing is entered)." : `Custom shares total ${customTotal}%.`}>
            {(id) => (
              <Select id={id} value={form.splitBy} onChange={(e) => setForm({ ...form, splitBy: e.target.value as Deal["splitBy"] })}>
                <option value="investment">In proportion to investment</option>
                <option value="custom">By custom percentages</option>
              </Select>
            )}
          </Field>
          <Field label="The split covers" hint="eBook and audio royalties can stay entirely yours.">
            {(id) => (
              <Select id={id} value={form.splitScope} onChange={(e) => setForm({ ...form, splitScope: e.target.value as Deal["splitScope"] })}>
                <option value="printed">Printed copies only</option>
                <option value="all">Every sale, in every format</option>
              </Select>
            )}
          </Field>
        </section>
        {error && (
          <p className="text-sm text-red-300" role="alert">
            {error}
          </p>
        )}
      </div>
    </Drawer>
  );
}

// ---------------------------------------------------------------- payments to partners

export function PayoutEditor({ open, onClose, payout, partnerId }: { open: boolean; onClose: () => void; payout?: Payout | null; partnerId?: string }) {
  return open ? <PayoutForm key={payout?.id ?? partnerId ?? "new"} onClose={onClose} payout={payout} partnerId={partnerId} /> : null;
}

function PayoutForm({ onClose, payout, partnerId }: { onClose: () => void; payout?: Payout | null; partnerId?: string }) {
  const partners = useStore(partnersStore);
  const deal = useStore(dealStore);
  const sales = useStore(salesStore);
  const runs = useStore(printRunsStore);
  const payouts = useStore(payoutsStore);
  const { money } = useAdmin();
  const { toast } = useFeedback();
  const owed = useMemo(() => distribution(partners, deal, sales, payouts.filter((x) => x.id !== payout?.id), printing(runs)).lines, [partners, deal, sales, payouts, runs, payout]);
  const firstId = partnerId ?? payout?.partnerId ?? partners.find((p) => p.owner)?.id ?? partners[0]?.id ?? "";
  const balanceOf = (id: string) => owed.find((l) => l.partner.id === id)?.balance ?? 0;
  const [form, setForm] = useState({
    date: payout?.date ?? isoDay(),
    partnerId: firstId,
    kind: (payout?.kind ?? "profit") as PayoutKind,
    amount: payout ? String(payout.amount) : balanceOf(firstId) > 0 ? balanceOf(firstId).toFixed(2) : "",
    method: payout?.method ?? PAYOUT_METHODS[0],
    reference: payout?.reference ?? "",
    notes: payout?.notes ?? "",
  });
  const [error, setError] = useState("");
  const amount = Number(form.amount);

  const save = () => {
    if (!form.partnerId) return setError("Choose who was paid.");
    if (!form.date) return setError("Pick a date.");
    if (!Number.isFinite(amount) || amount <= 0) return setError("Enter an amount above 0.");
    const record: Payout = {
      id: payout?.id ?? uid("pay_"),
      createdAt: payout?.createdAt ?? Date.now(),
      demo: payout?.demo,
      date: form.date,
      partnerId: form.partnerId,
      kind: form.kind,
      amount: +amount.toFixed(2),
      method: form.method,
      reference: form.reference.trim(),
      notes: form.notes.trim(),
    };
    payoutsStore.set((prev) => (payout ? prev.map((x) => (x.id === payout.id ? record : x)) : [record, ...prev]));
    toast(payout ? "Payment updated" : `Payment of ${money(record.amount)} recorded`);
    onClose();
  };

  const balance = balanceOf(form.partnerId);
  return (
    <Drawer
      open
      onClose={onClose}
      title={payout ? "Edit payment" : "Record a payment"}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={save}>
            {payout ? "Save changes" : "Record payment"}
          </Button>
        </>
      }
    >
      <form
        className="grid grid-cols-2 gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
      >
        <Field label="Paid to" className="col-span-2" hint={form.kind === "profit" ? `Profit still due to them: ${money(balance)}` : undefined}>
          {(id) => (
            <Select id={id} value={form.partnerId} onChange={(e) => setForm({ ...form, partnerId: e.target.value })}>
              {partners.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                  {p.owner ? " (you)" : ""}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="What for" className="col-span-2 sm:col-span-1">
          {(id) => (
            <Select id={id} value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value as PayoutKind })}>
              <option value="profit">Profit distribution</option>
              <option value="capital">Investment returned</option>
            </Select>
          )}
        </Field>
        <Field label="Date" className="col-span-2 sm:col-span-1">
          {(id) => <Input id={id} type="date" value={form.date} max={isoDay()} onChange={(e) => setForm({ ...form, date: e.target.value })} />}
        </Field>
        <Field label="Amount" className="col-span-2 sm:col-span-1">
          {(id) => <Input id={id} type="number" min={0} step="0.01" inputMode="decimal" placeholder="0.00" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />}
        </Field>
        <Field label="Method" className="col-span-2 sm:col-span-1">
          {(id) => (
            <Select id={id} value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })}>
              {PAYOUT_METHODS.map((m) => (
                <option key={m}>{m}</option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Reference" className="col-span-2" hint="Cheque number, transfer ID…">
          {(id) => <Input id={id} value={form.reference} placeholder="Optional" onChange={(e) => setForm({ ...form, reference: e.target.value })} />}
        </Field>
        <Field label="Notes" className="col-span-2">
          {(id) => <Textarea id={id} value={form.notes} placeholder="Optional" onChange={(e) => setForm({ ...form, notes: e.target.value })} className="!min-h-[80px]" />}
        </Field>
        {error && (
          <p className="col-span-2 text-sm text-red-300" role="alert">
            {error}
          </p>
        )}
        <button type="submit" className="hidden" />
      </form>
    </Drawer>
  );
}

// ---------------------------------------------------------------- print runs

export function PrintRunEditor({ open, onClose, run }: { open: boolean; onClose: () => void; run?: PrintRun | null }) {
  return open ? <PrintRunForm key={run?.id ?? "new"} onClose={onClose} run={run} /> : null;
}

function PrintRunForm({ onClose, run }: { onClose: () => void; run?: PrintRun | null }) {
  const deal = useStore(dealStore);
  const runs = useStore(printRunsStore);
  const { money } = useAdmin();
  const { toast } = useFeedback();
  const last = runs[0];
  const [form, setForm] = useState({
    date: run?.date ?? isoDay(),
    format: run?.format ?? last?.format ?? "Paperback",
    quantity: run ? String(run.quantity) : "",
    unitCost: run ? String(run.unitCost) : last ? String(last.unitCost) : "",
    printer: run?.printer ?? last?.printer ?? deal.publisher,
    notes: run?.notes ?? "",
  });
  const [error, setError] = useState("");
  const qty = Number(form.quantity);
  const cost = Number(form.unitCost);
  const total = Number.isFinite(qty * cost) ? qty * cost : 0;

  const save = () => {
    if (!form.date) return setError("Pick the print date.");
    if (!Number.isInteger(qty) || qty < 1) return setError("Copies printed: a whole number, 1 or more.");
    if (form.unitCost === "" || !Number.isFinite(cost) || cost < 0) return setError("Enter the printing cost per copy.");
    const record: PrintRun = {
      id: run?.id ?? uid("run_"),
      createdAt: run?.createdAt ?? Date.now(),
      demo: run?.demo,
      date: form.date,
      format: form.format,
      quantity: qty,
      unitCost: cost,
      printer: form.printer.trim(),
      notes: form.notes.trim(),
    };
    printRunsStore.set((prev) => (run ? prev.map((r) => (r.id === run.id ? record : r)) : [record, ...prev]).sort((a, b) => b.date.localeCompare(a.date)));
    toast(run ? "Print run updated" : `${qty} ${form.format} copies added to stock`);
    onClose();
  };

  return (
    <Drawer
      open
      onClose={onClose}
      title={run ? "Edit print run" : "Add a print run"}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={save}>
            {run ? "Save changes" : "Add to stock"}
          </Button>
        </>
      }
    >
      <form
        className="grid grid-cols-2 gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
      >
        <Field label="Printed on" className="col-span-2 sm:col-span-1">
          {(id) => <Input id={id} type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />}
        </Field>
        <Field label="Format" className="col-span-2 sm:col-span-1">
          {(id) => (
            <Select id={id} value={form.format} onChange={(e) => setForm({ ...form, format: e.target.value })}>
              {FORMATS.filter((f) => f !== "Kindle eBook" && f !== "Audiobook").map((f) => (
                <option key={f}>{f}</option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Copies printed">
          {(id) => <Input id={id} type="number" min={1} step={1} inputMode="numeric" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />}
        </Field>
        <Field label="Cost per copy">
          {(id) => <Input id={id} type="number" min={0} step="0.01" inputMode="decimal" placeholder="0.00" value={form.unitCost} onChange={(e) => setForm({ ...form, unitCost: e.target.value })} />}
        </Field>
        <div className="col-span-2 flex items-center justify-between rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 py-3 text-sm">
          <span className="text-mist">Printing bill</span>
          <span className="font-semibold text-star tabular-nums">{money(total)}</span>
        </div>
        <Field label="Printer" className="col-span-2">
          {(id) => <Input id={id} value={form.printer} onChange={(e) => setForm({ ...form, printer: e.target.value })} />}
        </Field>
        <Field label="Notes" className="col-span-2">
          {(id) => <Textarea id={id} value={form.notes} placeholder="Optional — who paid, delivery, ISBN…" onChange={(e) => setForm({ ...form, notes: e.target.value })} className="!min-h-[80px]" />}
        </Field>
        {error && (
          <p className="col-span-2 text-sm text-red-300" role="alert">
            {error}
          </p>
        )}
        <button type="submit" className="hidden" />
      </form>
    </Drawer>
  );
}
