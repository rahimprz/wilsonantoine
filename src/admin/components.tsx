import { useMemo, useState, type ReactNode } from "react";
import { CalendarDays, TrendingDown, TrendingUp } from "lucide-react";
import { RANGE_OPTIONS, type RangeKey } from "../lib/metrics";
import { isoDay, pct } from "../lib/format";
import { uid } from "../lib/id";
import { useStore } from "../lib/store";
import { CHANNELS, FORMATS, GIVEAWAY_CHANNEL } from "../data/constants";
import { printing, shares, vendorShareFor } from "../lib/profit";
import { dealStore, partnersStore, printRunsStore, repsStore, salesStore, settingsStore } from "../data/stores";
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

type SaleDraft = Omit<Sale, "id" | "createdAt" | "quantity" | "unitPrice" | "net" | "cost"> & { quantity: string; unitPrice: string; net: string; cost: string; share: string };

/** Create/edit drawer for a sale. Distributor share, net received and printing cost fill in until edited by hand. */
interface SaleEditorProps {
  open: boolean;
  onClose: () => void;
  sale?: Sale | null;
  preset?: Partial<Pick<Sale, "date" | "channel" | "format" | "customer" | "notes" | "repId">> & { quantity?: string; unitPrice?: string; net?: string };
}

export function SaleEditor(props: SaleEditorProps) {
  // a fresh form per opening, seeded from the record being edited (or the preset)
  return props.open ? <SaleForm key={props.sale?.id ?? "new"} {...props} /> : null;
}

const toNum = (v: string) => (v.trim() === "" ? NaN : Number(v));

function SaleForm({ onClose, sale, preset }: SaleEditorProps) {
  const settings = useStore(settingsStore);
  const reps = useStore(repsStore);
  const deal = useStore(dealStore);
  const runs = useStore(printRunsStore);
  const partners = useStore(partnersStore);
  const p = useMemo(() => printing(runs), [runs]);
  const { money } = useAdmin();
  const { toast } = useFeedback();
  const [draft, setDraft] = useState<SaleDraft>(() => {
    if (sale) {
      const g = sale.quantity * sale.unitPrice;
      return { ...sale, quantity: String(sale.quantity), unitPrice: String(sale.unitPrice), net: String(sale.net), cost: String(sale.cost ?? 0), share: g ? String(+(((g - sale.net) / g) * 100).toFixed(2)) : "0" };
    }
    const format = preset?.format ?? (p.main || FORMATS[0]);
    const channel = preset?.channel ?? (p.isPrinted(format) ? "Distributor" : CHANNELS[1]);
    return {
      date: isoDay(),
      channel,
      format,
      quantity: "1",
      unitPrice: p.isPrinted(format) && channel !== GIVEAWAY_CHANNEL ? String(deal.listPrice) : "",
      net: "",
      cost: "",
      share: "",
      repId: "",
      customer: "",
      notes: "",
      ...preset,
    };
  });
  // fields typed by hand stop following the automatic values
  const [touched, setTouched] = useState(() => ({ price: !!sale || !!preset?.unitPrice, share: !!sale, net: !!sale || !!preset?.net, cost: !!sale }));
  const [errors, setErrors] = useState<Record<string, string>>({});

  const qty = toNum(draft.quantity);
  const giveaway = draft.channel === GIVEAWAY_CHANNEL;
  const autoPrice = giveaway ? 0 : p.isPrinted(draft.format) ? deal.listPrice : NaN;
  const price = touched.price ? toNum(draft.unitPrice) : Number.isFinite(autoPrice) ? autoPrice : toNum(draft.unitPrice);
  const grossValue = Number.isFinite(qty * price) ? qty * price : 0;
  const autoShare = vendorShareFor(draft.format, draft.channel, deal, settings.royaltyRates, p);
  const share = touched.share ? toNum(draft.share) : autoShare;
  const autoNet = +(grossValue * (1 - (Number.isFinite(share) ? share : 0) / 100)).toFixed(2);
  const net = touched.net ? toNum(draft.net) : autoNet;
  const unitCost = p.unitCost(draft.format);
  const autoCost = Number.isFinite(qty) ? +(qty * unitCost).toFixed(2) : 0;
  const cost = touched.cost ? toNum(draft.cost) : autoCost;
  const profit = (Number.isFinite(net) ? net : 0) - (Number.isFinite(cost) ? cost : 0);
  const covered = deal.splitScope === "all" || p.isPrinted(draft.format);
  const split = shares(partners, deal);
  const set = <K extends keyof SaleDraft>(k: K, v: SaleDraft[K]) => setDraft((d) => ({ ...d, [k]: v }));
  const touch = (k: keyof typeof touched, on = true) => setTouched((t) => ({ ...t, [k]: on }));

  const save = () => {
    const e: Record<string, string> = {};
    if (!draft.date) e.date = "Pick a date.";
    if (!Number.isInteger(qty) || qty < 1) e.quantity = "Whole number, 1 or more.";
    if (!Number.isFinite(price) || price < 0) e.unitPrice = "Enter the price per copy.";
    if (!Number.isFinite(share) || share < 0 || share > 100) e.share = "A percent between 0 and 100.";
    if (!Number.isFinite(net) || net < 0) e.net = "Enter the net received (0 or more).";
    if (!Number.isFinite(cost) || cost < 0) e.cost = "Enter the printing cost (0 or more).";
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
      cost: +cost.toFixed(2),
      repId: draft.repId,
      customer: draft.customer.trim(),
      notes: draft.notes.trim(),
    };
    salesStore.set((prev) => (sale ? prev.map((s) => (s.id === sale.id ? record : s)) : [record, ...prev]));
    toast(sale ? "Sale updated" : `${giveaway ? "Recorded" : "Sale recorded"} — ${qty} × ${draft.format}`);
    onClose();
  };

  const reset = (k: keyof typeof touched, label: string) => (
    <button type="button" className="text-gold hover:underline" onClick={() => touch(k, false)}>
      Reset to {label}
    </button>
  );

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
        <Field label="Date" error={errors.date} className="col-span-2 sm:col-span-1" hint="For a publisher statement, use the last day it covers.">
          {(id) => <Input id={id} type="date" value={draft.date} max={isoDay()} onChange={(e) => set("date", e.target.value)} />}
        </Field>
        <Field label="Format" className="col-span-2 sm:col-span-1" hint={p.isPrinted(draft.format) ? `Printed · ${money(unitCost)} a copy to print` : "Not printed — no printing cost"}>
          {(id) => (
            <Select id={id} value={draft.format} onChange={(e) => set("format", e.target.value)}>
              {FORMATS.map((f) => (
                <option key={f}>{f}</option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Channel" className="col-span-2" hint={giveaway ? "Review copies and gifts: no revenue, but the copies leave stock and their printing cost counts." : draft.channel === "Distributor" ? `Sold through ${deal.publisher || "the publisher"}'s distribution.` : undefined}>
          {(id) => (
            <Select id={id} value={draft.channel} onChange={(e) => set("channel", e.target.value)}>
              {CHANNELS.map((c) => (
                <option key={c} value={c}>
                  {c === "Distributor" && deal.publisher ? `Distributor (${deal.publisher})` : c}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Copies" error={errors.quantity}>
          {(id) => <Input id={id} type="number" min={1} step={1} inputMode="numeric" value={draft.quantity} onChange={(e) => set("quantity", e.target.value)} />}
        </Field>
        <Field label="Price per copy" error={errors.unitPrice} hint={touched.price && Number.isFinite(autoPrice) ? reset("price", money(autoPrice)) : undefined}>
          {(id) => (
            <Input
              id={id}
              type="number"
              min={0}
              step="0.01"
              inputMode="decimal"
              placeholder="0.00"
              value={touched.price || !Number.isFinite(autoPrice) ? draft.unitPrice : String(autoPrice)}
              onChange={(e) => {
                touch("price");
                set("unitPrice", e.target.value);
              }}
            />
          )}
        </Field>

        <div className="col-span-2 rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-mist">Sales revenue</span>
            <span className="font-semibold text-star tabular-nums">{money(grossValue)}</span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <Field label="Distributor / retailer share (%)" error={errors.share} hint={touched.share ? reset("share", `${autoShare}%`) : `Auto: ${autoShare}%`}>
              {(id) => (
                <Input
                  id={id}
                  type="number"
                  min={0}
                  max={100}
                  step="0.5"
                  value={touched.share ? draft.share : String(autoShare)}
                  onChange={(e) => {
                    touch("share");
                    touch("net", false);
                    set("share", e.target.value);
                  }}
                />
              )}
            </Field>
            <Field label="Net revenue received" error={errors.net} hint={touched.net ? reset("net", money(autoNet)) : "After the share. Type to override."}>
              {(id) => (
                <Input
                  id={id}
                  type="number"
                  min={0}
                  step="0.01"
                  inputMode="decimal"
                  value={touched.net ? draft.net : String(autoNet)}
                  onChange={(e) => {
                    touch("net");
                    set("net", e.target.value);
                  }}
                />
              )}
            </Field>
            <Field label="Printing cost" error={errors.cost} hint={touched.cost ? reset("cost", money(autoCost)) : unitCost ? `${draft.quantity || 0} × ${money(unitCost)}` : "No print run for this format"}>
              {(id) => (
                <Input
                  id={id}
                  type="number"
                  min={0}
                  step="0.01"
                  inputMode="decimal"
                  value={touched.cost ? draft.cost : String(autoCost)}
                  onChange={(e) => {
                    touch("cost");
                    set("cost", e.target.value);
                  }}
                />
              )}
            </Field>
            <div>
              <p className="mb-1.5 text-[0.8rem] font-medium tracking-wide text-mist">Net profit</p>
              <p className={`rounded-xl border border-gold/30 bg-gold/[0.07] px-3.5 py-2.5 font-heading text-[1.15rem] tabular-nums ${profit < 0 ? "text-[#ff9a9a]" : "text-gold-light"}`}>{money(profit)}</p>
            </div>
          </div>
          {partners.length > 0 && (
            <p className="mt-3 border-t border-white/[0.06] pt-3 text-xs text-haze">
              {covered
                ? partners.map((x, i) => (
                    <span key={x.id}>
                      {i > 0 && " · "}
                      {x.name} <span className="text-star tabular-nums">{money(profit * (split.get(x.id) ?? 0))}</span>
                    </span>
                  ))
                : `Outside the shared deal — the profit goes to ${partners.find((x) => x.owner)?.name ?? "you"} in full.`}
            </p>
          )}
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
          {(id) => <Textarea id={id} value={draft.notes} placeholder="Optional — e.g. the statement period" onChange={(e) => set("notes", e.target.value)} className="!min-h-[80px]" />}
        </Field>
        <button type="submit" className="hidden" />
      </form>
    </Drawer>
  );
}
