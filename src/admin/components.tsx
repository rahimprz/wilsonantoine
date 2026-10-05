import { useState, type ReactNode } from "react";
import { CalendarDays, TrendingDown, TrendingUp } from "lucide-react";
import { RANGE_OPTIONS, type RangeKey } from "../lib/metrics";
import { isoDay, pct } from "../lib/format";
import { uid } from "../lib/id";
import { useStore } from "../lib/store";
import { CHANNELS, FORMATS } from "../data/constants";
import { repsStore, salesStore, settingsStore } from "../data/stores";
import type { Sale } from "../data/types";
import { useAdmin } from "./context";
import { Sparkline } from "./charts";
import { Button, Card, DemoBadge, Drawer, Field, Input, Select, Textarea, useFeedback } from "./ui";

export function RangePicker() {
  const { rangeKey, setRangeKey } = useAdmin();
  return (
    <label className="relative inline-flex items-center">
      <span className="sr-only">Date range</span>
      <CalendarDays className="pointer-events-none absolute left-3 h-4 w-4 text-gold" />
      <Select value={rangeKey} onChange={(e) => setRangeKey(e.target.value as RangeKey)} className="!w-auto !py-2 pl-9 text-sm">
        {RANGE_OPTIONS.map((o) => (
          <option key={o.key} value={o.key}>
            {o.label}
          </option>
        ))}
      </Select>
    </label>
  );
}

export function rangeLabel(key: RangeKey) {
  return RANGE_OPTIONS.find((o) => o.key === key)?.label.toLowerCase() ?? "";
}

export function Kpi({
  label,
  value,
  change,
  spark,
  sparkColor,
  hint,
}: {
  label: string;
  value: ReactNode;
  change?: number | null;
  spark?: number[];
  sparkColor?: string;
  hint?: ReactNode;
}) {
  const up = change != null && change >= 0;
  return (
    <Card className="flex flex-col p-5">
      <p className="text-[0.8rem] font-medium tracking-wide text-mist">{label}</p>
      <p className="mt-2 text-[1.85rem] leading-tight font-semibold tracking-tight text-white">{value}</p>
      <div className="mt-2 flex min-h-5 items-center gap-2 text-xs">
        {change != null ? (
          <span className={`inline-flex items-center gap-1 font-medium ${up ? "text-[#7ee07e]" : "text-[#ff9a9a]"}`}>
            {up ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
            {up ? "+" : ""}
            {pct(change, Math.abs(change) < 0.1 ? 1 : 0)}
          </span>
        ) : (
          <span className="text-haze">No earlier data</span>
        )}
        <span className="text-haze">{change != null ? "vs previous period" : ""}</span>
      </div>
      {hint && <p className="mt-1 text-xs text-haze">{hint}</p>}
      {spark && spark.length > 1 && (
        <div className="mt-auto pt-3">
          <Sparkline values={spark} color={sparkColor} />
        </div>
      )}
    </Card>
  );
}

// ---------------------------------------------------------------- sale form

type SaleDraft = Omit<Sale, "id" | "createdAt" | "quantity" | "unitPrice" | "net"> & { quantity: string; unitPrice: string; net: string };

function blankDraft(): SaleDraft {
  return {
    date: isoDay(),
    channel: CHANNELS[0],
    format: FORMATS[0],
    quantity: "1",
    unitPrice: "",
    net: "",
    repId: "",
    customer: "",
    notes: "",
  };
}

/** Create/edit drawer for a sale. Net earnings fill in from the format's royalty rate until edited by hand. */
interface SaleEditorProps {
  open: boolean;
  onClose: () => void;
  sale?: Sale | null;
  preset?: Partial<SaleDraft>;
}

export function SaleEditor(props: SaleEditorProps) {
  // a fresh form per opening, seeded from the record being edited (or the preset)
  return props.open ? <SaleForm key={props.sale?.id ?? "new"} {...props} /> : null;
}

function SaleForm({ onClose, sale, preset }: SaleEditorProps) {
  const settings = useStore(settingsStore);
  const reps = useStore(repsStore);
  const { money } = useAdmin();
  const { toast } = useFeedback();
  const [draft, setDraft] = useState<SaleDraft>(() =>
    sale ? { ...sale, quantity: String(sale.quantity), unitPrice: String(sale.unitPrice), net: String(sale.net) } : { ...blankDraft(), ...preset },
  );
  const [netTouched, setNetTouched] = useState(() => !!sale || !!preset?.net);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const qty = Number(draft.quantity);
  const price = Number(draft.unitPrice);
  const grossValue = Number.isFinite(qty * price) ? qty * price : 0;
  const rate = settings.royaltyRates[draft.format] ?? 100;
  const autoNet = +(grossValue * (rate / 100)).toFixed(2);
  const set = <K extends keyof SaleDraft>(k: K, v: SaleDraft[K]) => setDraft((d) => ({ ...d, [k]: v }));

  const save = () => {
    const e: Record<string, string> = {};
    if (!draft.date) e.date = "Pick a date.";
    if (!Number.isInteger(qty) || qty < 1) e.quantity = "Whole number, 1 or more.";
    if (draft.unitPrice === "" || !Number.isFinite(price) || price < 0) e.unitPrice = "Enter the price per copy.";
    const net = netTouched ? Number(draft.net) : autoNet;
    if (!Number.isFinite(net) || net < 0) e.net = "Enter earnings (0 or more).";
    setErrors(e);
    if (Object.keys(e).length) return;
    const record: Sale = {
      id: sale?.id ?? uid("s_"),
      createdAt: sale?.createdAt ?? Date.now(),
      demo: sale?.demo,
      date: draft.date,
      channel: draft.channel,
      format: draft.format,
      quantity: qty,
      unitPrice: price,
      net: +net.toFixed(2),
      repId: draft.repId,
      customer: draft.customer.trim(),
      notes: draft.notes.trim(),
    };
    salesStore.set((prev) => (sale ? prev.map((s) => (s.id === sale.id ? record : s)) : [record, ...prev]));
    toast(sale ? "Sale updated" : `Sale recorded — ${qty} × ${draft.format}`);
    onClose();
  };

  return (
    <Drawer
      open
      onClose={onClose}
      title={sale ? "Edit sale" : "Record a sale"}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={save}>
            {sale ? "Save changes" : "Record sale"}
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
        {sale?.demo && (
          <p className="col-span-2 flex items-center gap-2 text-sm text-mist">
            <DemoBadge /> This is a demo record.
          </p>
        )}
        <Field label="Date" error={errors.date} className="col-span-2 sm:col-span-1">
          {(id) => <Input id={id} type="date" value={draft.date} max={isoDay()} onChange={(e) => set("date", e.target.value)} />}
        </Field>
        <Field label="Format" className="col-span-2 sm:col-span-1">
          {(id) => (
            <Select id={id} value={draft.format} onChange={(e) => set("format", e.target.value)}>
              {FORMATS.map((f) => (
                <option key={f}>{f}</option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Channel" className="col-span-2">
          {(id) => (
            <Select id={id} value={draft.channel} onChange={(e) => set("channel", e.target.value)}>
              {CHANNELS.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Copies" error={errors.quantity}>
          {(id) => <Input id={id} type="number" min={1} step={1} inputMode="numeric" value={draft.quantity} onChange={(e) => set("quantity", e.target.value)} />}
        </Field>
        <Field label="Price per copy" error={errors.unitPrice}>
          {(id) => <Input id={id} type="number" min={0} step="0.01" inputMode="decimal" placeholder="0.00" value={draft.unitPrice} onChange={(e) => set("unitPrice", e.target.value)} />}
        </Field>
        <div className="col-span-2 rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-mist">Gross</span>
            <span className="font-semibold text-star tabular-nums">{money(grossValue)}</span>
          </div>
          <Field
            label="Your earnings (net)"
            className="mt-3"
            error={errors.net}
            hint={
              netTouched ? (
                <button type="button" className="text-gold hover:underline" onClick={() => setNetTouched(false)}>
                  Reset to {rate}% royalty ({money(autoNet)})
                </button>
              ) : (
                `Auto: ${rate}% royalty for ${draft.format}. Type to override.`
              )
            }
          >
            {(id) => (
              <Input
                id={id}
                type="number"
                min={0}
                step="0.01"
                inputMode="decimal"
                value={netTouched ? draft.net : String(autoNet)}
                onChange={(e) => {
                  setNetTouched(true);
                  set("net", e.target.value);
                }}
              />
            )}
          </Field>
        </div>
        <Field label="Sales rep" className="col-span-2 sm:col-span-1">
          {(id) => (
            <Select id={id} value={draft.repId} onChange={(e) => set("repId", e.target.value)}>
              <option value="">Unassigned</option>
              {reps.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                  {!r.active ? " (inactive)" : ""}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Customer / event" className="col-span-2 sm:col-span-1">
          {(id) => <Input id={id} value={draft.customer} placeholder="Optional" onChange={(e) => set("customer", e.target.value)} />}
        </Field>
        <Field label="Notes" className="col-span-2">
          {(id) => <Textarea id={id} value={draft.notes} placeholder="Optional" onChange={(e) => set("notes", e.target.value)} className="!min-h-[80px]" />}
        </Field>
        <button type="submit" className="hidden" />
      </form>
    </Drawer>
  );
}
