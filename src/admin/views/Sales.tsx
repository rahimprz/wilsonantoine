import { useMemo, useRef, useState } from "react";
import { ArrowDownUp, Copy, Download, FileDown, Pencil, Plus, Receipt, Search, Trash2, Upload } from "lucide-react";
import { useStore } from "../../lib/store";
import { gross, inRange, totals } from "../../lib/metrics";
import { fmtDayYear, isoDay, num } from "../../lib/format";
import { download, parseCSV, toCSV } from "../../lib/csv";
import { uid } from "../../lib/id";
import { CHANNELS, FORMATS } from "../../data/constants";
import { repsStore, salesStore, settingsStore } from "../../data/stores";
import type { Sale } from "../../data/types";
import { useAdmin } from "../context";
import { RangePicker, SaleEditor } from "../components";
import { Button, Card, DemoBadge, EmptyState, IconButton, Input, Modal, PageHeader, Select, useFeedback } from "../ui";

const PAGE = 50;
const COLUMNS = [
  { key: "date", label: "date" },
  { key: "channel", label: "channel" },
  { key: "format", label: "format" },
  { key: "quantity", label: "quantity" },
  { key: "unitPrice", label: "unit_price" },
  { key: "gross", label: "gross" },
  { key: "net", label: "net" },
  { key: "rep", label: "rep" },
  { key: "customer", label: "customer" },
  { key: "notes", label: "notes" },
];

export default function Sales() {
  const sales = useStore(salesStore);
  const reps = useStore(repsStore);
  const settings = useStore(settingsStore);
  const { range, money } = useAdmin();
  const { toast, confirm } = useFeedback();
  const [query, setQuery] = useState("");
  const [channel, setChannel] = useState("");
  const [format, setFormat] = useState("");
  const [rep, setRep] = useState("");
  const [sort, setSort] = useState<{ key: "date" | "gross"; dir: 1 | -1 }>({ key: "date", dir: -1 });
  const [limit, setLimit] = useState(PAGE);
  const [editing, setEditing] = useState<Sale | null>(null);
  const [creating, setCreating] = useState(false);
  const [preset, setPreset] = useState<Partial<Sale> | undefined>();
  const [importReport, setImportReport] = useState<{ added: number; skipped: string[] } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const repName = (id: string) => reps.find((r) => r.id === id)?.name ?? "";

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return sales
      .filter((s) => inRange(s.date, range.start, range.end))
      .filter((s) => !channel || s.channel === channel)
      .filter((s) => !format || s.format === format)
      .filter((s) => !rep || (rep === "none" ? !s.repId : s.repId === rep))
      .filter((s) => !q || [s.customer, s.notes, s.channel, s.format, repName(s.repId)].some((v) => v.toLowerCase().includes(q)))
      .sort((a, b) => (sort.key === "date" ? a.date.localeCompare(b.date) || a.createdAt - b.createdAt : gross(a) - gross(b)) * sort.dir);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sales, range, channel, format, rep, query, sort, reps]);

  const sum = totals(rows);

  const remove = async (s: Sale) => {
    if (!(await confirm({ title: "Delete this sale?", body: `${s.quantity} × ${s.format} on ${fmtDayYear(s.date)} (${money(gross(s))}).`, confirmLabel: "Delete", danger: true }))) return;
    salesStore.set((prev) => prev.filter((x) => x.id !== s.id));
    toast("Sale deleted", "info", { label: "Undo", run: () => salesStore.set((prev) => [s, ...prev]) });
  };

  const exportCSV = () => {
    const data = rows.map((s) => ({ ...s, gross: gross(s).toFixed(2), rep: repName(s.repId) }));
    download(`wilson-antoine-sales-${range.start}-to-${range.end}.csv`, toCSV(data, COLUMNS));
    toast(`Exported ${num(rows.length)} sales`);
  };

  const importCSV = async (file: File) => {
    const text = await file.text();
    const table = parseCSV(text);
    if (table.length < 2) {
      toast("That file has no rows to import.", "bad");
      return;
    }
    const head = table[0].map((h) => h.trim().toLowerCase().replace(/[\s-]+/g, "_"));
    const col = (...names: string[]) => head.findIndex((h) => names.includes(h));
    const ix = {
      date: col("date", "sale_date", "order_date"),
      channel: col("channel", "store", "marketplace"),
      format: col("format", "edition", "type"),
      qty: col("quantity", "qty", "units", "copies"),
      price: col("unit_price", "price", "list_price"),
      net: col("net", "royalty", "earnings"),
      rep: col("rep", "sales_rep"),
      customer: col("customer", "buyer", "event"),
      notes: col("notes", "note"),
    };
    if (ix.date < 0 || ix.qty < 0) {
      toast("The CSV needs at least “date” and “quantity” columns.", "bad");
      return;
    }
    const added: Sale[] = [];
    const skipped: string[] = [];
    table.slice(1).forEach((r, i) => {
      const cell = (k: keyof typeof ix) => (ix[k] >= 0 ? (r[ix[k]] ?? "").trim() : "");
      const rawDate = cell("date");
      const d = /^\d{4}-\d{2}-\d{2}$/.test(rawDate) ? rawDate : isNaN(Date.parse(rawDate)) ? "" : isoDay(new Date(rawDate));
      const quantity = Number(cell("qty"));
      const unitPrice = Number(cell("price").replace(/[^0-9.-]/g, "") || 0);
      const fmt = FORMATS.find((f) => f.toLowerCase() === cell("format").toLowerCase()) ?? (cell("format") || FORMATS[0]);
      const netRaw = cell("net").replace(/[^0-9.-]/g, "");
      if (!d || !Number.isFinite(quantity) || quantity <= 0) {
        skipped.push(`Row ${i + 2}: ${!d ? "unreadable date" : "quantity missing"}`);
        return;
      }
      const repMatch = reps.find((x) => x.name.toLowerCase() === cell("rep").toLowerCase());
      added.push({
        id: uid("s_"),
        createdAt: Date.now() + i,
        date: d,
        channel: cell("channel") || "Other",
        format: fmt,
        quantity: Math.round(quantity),
        unitPrice,
        net: netRaw ? Number(netRaw) : +(quantity * unitPrice * ((settings.royaltyRates[fmt] ?? 100) / 100)).toFixed(2),
        repId: repMatch?.id ?? "",
        customer: cell("customer"),
        notes: cell("notes"),
      });
    });
    if (added.length) salesStore.set((prev) => [...added, ...prev]);
    setImportReport({ added: added.length, skipped });
  };

  const sortHeader = (key: "date" | "gross", label: string, align = "") => (
    <button
      className={`inline-flex items-center gap-1 hover:text-star ${align}`}
      onClick={() => setSort((s) => ({ key, dir: s.key === key ? (s.dir === 1 ? -1 : 1) : -1 }))}
      aria-label={`Sort by ${label}`}
    >
      {label} <ArrowDownUp className={`h-3 w-3 ${sort.key === key ? "text-gold" : ""}`} />
    </button>
  );

  return (
    <div>
      <PageHeader
        title="Sales"
        subtitle="Every copy sold — from Amazon royalties to event signings and bulk orders."
        actions={
          <>
            <RangePicker />
            <Button onClick={() => fileRef.current?.click()}>
              <Upload className="h-4 w-4" /> Import
            </Button>
            <Button onClick={exportCSV} disabled={!rows.length}>
              <Download className="h-4 w-4" /> Export
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setPreset(undefined);
                setCreating(true);
              }}
            >
              <Plus className="h-4 w-4" /> Record sale
            </Button>
          </>
        }
      />
      <input
        ref={fileRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) importCSV(f);
          e.target.value = "";
        }}
      />

      <Card className="p-4">
        <div className="grid gap-3 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <label className="relative">
            <span className="sr-only">Search sales</span>
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-haze" />
            <Input
              placeholder="Search customer, notes, rep…"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setLimit(PAGE);
              }}
              className="pl-9"
            />
          </label>
          <Select value={channel} onChange={(e) => setChannel(e.target.value)} aria-label="Filter by channel">
            <option value="">All channels</option>
            {CHANNELS.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </Select>
          <Select value={format} onChange={(e) => setFormat(e.target.value)} aria-label="Filter by format">
            <option value="">All formats</option>
            {FORMATS.map((f) => (
              <option key={f}>{f}</option>
            ))}
          </Select>
          <Select value={rep} onChange={(e) => setRep(e.target.value)} aria-label="Filter by rep">
            <option value="">All reps</option>
            <option value="none">Unassigned</option>
            {reps.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            ["Sales", num(sum.orders)],
            ["Copies", num(sum.units)],
            ["Gross", money(sum.gross)],
            ["Net earnings", money(sum.net)],
          ].map(([l, v]) => (
            <div key={l} className="rounded-xl bg-white/[0.03] px-4 py-3">
              <p className="text-xs text-haze">{l}</p>
              <p className="mt-0.5 font-semibold text-star tabular-nums">{v}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card className="mt-4 overflow-hidden">
        {rows.length === 0 ? (
          <EmptyState
            icon={<Receipt className="h-6 w-6" />}
            title={sales.length ? "No sales match these filters" : "No sales recorded yet"}
            action={
              sales.length ? undefined : (
                <Button variant="primary" onClick={() => setCreating(true)}>
                  <Plus className="h-4 w-4" /> Record your first sale
                </Button>
              )
            }
          >
            {sales.length ? "Try a wider date range or clear a filter." : "Log sales as they happen, or import a CSV export from your spreadsheet."}
          </EmptyState>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-sm">
              <thead className="bg-white/[0.02] text-left text-xs text-haze">
                <tr>
                  <th className="px-5 py-3 font-medium">{sortHeader("date", "Date")}</th>
                  <th className="px-3 py-3 font-medium">Item</th>
                  <th className="px-3 py-3 font-medium">Channel</th>
                  <th className="px-3 py-3 font-medium">Rep</th>
                  <th className="px-3 py-3 font-medium">Customer / notes</th>
                  <th className="px-3 py-3 text-right font-medium">{sortHeader("gross", "Gross", "justify-end")}</th>
                  <th className="px-3 py-3 text-right font-medium">Net</th>
                  <th className="px-3 py-3" />
                </tr>
              </thead>
              <tbody className="tabular-nums">
                {rows.slice(0, limit).map((s) => (
                  <tr key={s.id} className="group border-t border-white/[0.05] hover:bg-white/[0.02]">
                    <td className="px-5 py-3 whitespace-nowrap text-mist">{fmtDayYear(s.date)}</td>
                    <td className="px-3 py-3 text-star">
                      <span className="flex items-center gap-2">
                        {s.quantity} × {s.format}
                        {s.demo && <DemoBadge />}
                      </span>
                      <span className="text-xs text-haze">{money(s.unitPrice)} each</span>
                    </td>
                    <td className="px-3 py-3 text-mist">{s.channel}</td>
                    <td className="px-3 py-3 text-mist">{repName(s.repId) || <span className="text-haze">—</span>}</td>
                    <td className="max-w-[220px] px-3 py-3">
                      <span className="block truncate text-mist">{s.customer || <span className="text-haze">—</span>}</span>
                      {s.notes && <span className="block truncate text-xs text-haze">{s.notes}</span>}
                    </td>
                    <td className="px-3 py-3 text-right font-medium text-star">{money(gross(s))}</td>
                    <td className="px-3 py-3 text-right text-mist">{money(s.net)}</td>
                    <td className="px-3 py-3">
                      <div className="flex justify-end gap-0.5 opacity-70 transition group-hover:opacity-100">
                        <IconButton label="Edit sale" onClick={() => setEditing(s)}>
                          <Pencil className="h-4 w-4" />
                        </IconButton>
                        <IconButton
                          label="Duplicate as new sale"
                          onClick={() => {
                            setPreset({ ...s, date: isoDay() });
                            setCreating(true);
                          }}
                        >
                          <Copy className="h-4 w-4" />
                        </IconButton>
                        <IconButton label="Delete sale" onClick={() => remove(s)} className="hover:!text-red-300">
                          <Trash2 className="h-4 w-4" />
                        </IconButton>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length > limit && (
              <div className="border-t border-white/[0.05] p-4 text-center">
                <Button variant="ghost" onClick={() => setLimit((l) => l + PAGE)}>
                  Show {Math.min(PAGE, rows.length - limit)} more of {num(rows.length - limit)}
                </Button>
              </div>
            )}
          </div>
        )}
      </Card>

      <p className="mt-4 flex flex-wrap items-center gap-2 text-xs text-haze">
        <FileDown className="h-4 w-4" />
        CSV import reads columns named date, channel, format, quantity, unit_price, net, rep, customer, notes — the same layout Export produces.
        <button
          className="text-gold hover:underline"
          onClick={() => download("sales-template.csv", toCSV([{ date: isoDay(), channel: "Amazon", format: "Kindle eBook", quantity: 1, unitPrice: 9.99, gross: 9.99, net: 6.99, rep: "", customer: "", notes: "" }], COLUMNS))}
        >
          Download a template
        </button>
      </p>

      <SaleEditor
        open={creating || !!editing}
        sale={editing}
        preset={
          preset
            ? { date: preset.date, channel: preset.channel, format: preset.format, quantity: String(preset.quantity), unitPrice: String(preset.unitPrice), repId: preset.repId, customer: preset.customer, notes: preset.notes }
            : undefined
        }
        onClose={() => {
          setCreating(false);
          setEditing(null);
          setPreset(undefined);
        }}
      />

      <Modal
        open={!!importReport}
        onClose={() => setImportReport(null)}
        title="Import finished"
        footer={
          <Button variant="primary" onClick={() => setImportReport(null)}>
            Done
          </Button>
        }
      >
        <p>
          Added <strong className="text-star">{num(importReport?.added ?? 0)}</strong> sales
          {importReport?.skipped.length ? `, skipped ${importReport.skipped.length}.` : "."}
        </p>
        {!!importReport?.skipped.length && (
          <ul className="mt-3 max-h-40 list-disc overflow-auto pl-5 text-sm text-haze">
            {importReport.skipped.slice(0, 30).map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        )}
      </Modal>
    </div>
  );
}
