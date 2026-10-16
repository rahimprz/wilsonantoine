import { useMemo, useState } from "react";
import { AlertTriangle, Calculator, Package, Pencil, Plus, Trash2 } from "lucide-react";
import { useStore } from "../../lib/store";
import { fmtDayYear, num, pct } from "../../lib/format";
import { perCopy, printing, stock } from "../../lib/profit";
import { dealStore, printRunsStore, salesStore } from "../../data/stores";
import type { PrintRun } from "../../data/types";
import { useAdmin } from "../context";
import { Progress, VIZ } from "../charts";
import { PrintRunEditor } from "../deal";
import { Badge, Button, Card, CardHeader, DemoBadge, EmptyState, Field, IconButton, Input, PageHeader, useFeedback } from "../ui";

export default function Inventory() {
  const runs = useStore(printRunsStore);
  const sales = useStore(salesStore);
  const deal = useStore(dealStore);
  const { money } = useAdmin();
  const { toast, confirm } = useFeedback();
  const [editor, setEditor] = useState<{ open: boolean; run?: PrintRun | null }>({ open: false });
  const st = useMemo(() => stock(runs, sales), [runs, sales]);
  const p = useMemo(() => printing(runs), [runs]);
  const copy = perCopy(deal, p);
  const sorted = [...runs].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt);

  // reprint planner
  const [plan, setPlan] = useState({ copies: "250", cost: "" });
  const planCopies = Math.max(0, Math.round(Number(plan.copies) || 0));
  const planCost = plan.cost === "" ? copy.cost : Number(plan.cost) || 0;
  const bill = planCopies * planCost;
  const profitPerCopy = copy.net - planCost;
  const payback = copy.net > 0 ? Math.ceil(bill / copy.net - 1e-9) : null;

  const remove = async (r: PrintRun) => {
    const sold = st.find((f) => f.format === r.format);
    const warn = sold && sold.remaining - r.quantity < 0 ? ` Stock for ${r.format} would go below zero — the copies already sold came from it.` : "";
    if (!(await confirm({ title: "Delete this print run?", body: `${num(r.quantity)} ${r.format} copies printed ${fmtDayYear(r.date)}.${warn}`, confirmLabel: "Delete", danger: true }))) return;
    printRunsStore.set((prev) => prev.filter((x) => x.id !== r.id));
    toast("Print run deleted", "info", { label: "Undo", run: () => printRunsStore.set((prev) => [r, ...prev]) });
  };

  return (
    <div>
      <PageHeader
        title="Print & stock"
        subtitle="Every print run, the copies left, and what a reprint would mean."
        actions={
          <Button variant="primary" onClick={() => setEditor({ open: true })}>
            <Plus className="h-4 w-4" /> Add print run
          </Button>
        }
      />

      {!runs.length ? (
        <Card>
          <EmptyState
            icon={<Package className="h-6 w-6" />}
            title="No print runs yet"
            action={
              <Button variant="primary" onClick={() => setEditor({ open: true })}>
                <Plus className="h-4 w-4" /> Add the first print run
              </Button>
            }
          >
            Add how many copies were printed and the cost per copy. Every printed sale then carries its printing cost, and you'll see the copies left at a glance.
          </EmptyState>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-2 [&>*]:min-w-0">
            {st.map((f) => {
              const out = f.sold + f.givenAway;
              const low = f.remaining <= deal.lowStockAt;
              return (
                <Card key={f.format} className="p-5 md:p-6">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm text-mist">{f.format} in stock</p>
                      <p className="mt-1 font-heading text-[2.6rem] leading-none text-white tabular-nums">{num(f.remaining)}</p>
                    </div>
                    {f.remaining < 0 ? (
                      <Badge tone="bad">
                        <AlertTriangle className="h-3.5 w-3.5" /> More sold than printed
                      </Badge>
                    ) : low ? (
                      <Badge tone="warn">
                        <AlertTriangle className="h-3.5 w-3.5" /> Low stock
                      </Badge>
                    ) : (
                      <Badge tone="good">In stock</Badge>
                    )}
                  </div>
                  <div className="mt-5">
                    <div className="mb-1.5 flex justify-between text-xs text-haze">
                      <span>
                        {num(out)} of {num(f.printed)} copies out
                      </span>
                      <span>{pct(f.printed ? out / f.printed : 0)}</span>
                    </div>
                    <Progress value={f.printed ? out / f.printed : 0} color={VIZ.blue} label={`${f.format} copies out of stock`} />
                  </div>
                  <dl className="mt-5 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                    {[
                      ["Printed", num(f.printed)],
                      ["Sold", num(f.sold)],
                      ["Given away", num(f.givenAway)],
                      ["Stock at cost", money(f.stockValue)],
                    ].map(([k, v]) => (
                      <div key={k}>
                        <dt className="text-xs text-haze">{k}</dt>
                        <dd className="mt-0.5 text-star tabular-nums">{v}</dd>
                      </div>
                    ))}
                  </dl>
                  <p className="mt-4 text-xs text-haze">
                    Average printing cost {money(f.unitCost)} per copy · {money(f.printCost)} spent on printing.
                  </p>
                </Card>
              );
            })}
          </div>

          <Card className="mt-4">
            <CardHeader title="Print runs" subtitle={`${runs.length} ${runs.length === 1 ? "run" : "runs"} · ${num(st.reduce((a, f) => a + f.printed, 0))} copies`} />
            <div className="overflow-x-auto px-5 pt-3 pb-5 md:px-6">
              <table className="w-full min-w-[640px] text-sm">
                <thead className="text-left text-xs text-haze">
                  <tr>
                    <th className="pb-2 font-medium">Printed</th>
                    <th className="pb-2 font-medium">Format</th>
                    <th className="pb-2 text-right font-medium">Copies</th>
                    <th className="pb-2 text-right font-medium">Per copy</th>
                    <th className="pb-2 text-right font-medium">Bill</th>
                    <th className="pb-2 pl-4 font-medium">Printer</th>
                    <th className="w-20 pb-2" />
                  </tr>
                </thead>
                <tbody className="tabular-nums">
                  {sorted.map((r) => (
                    <tr key={r.id} className="border-t border-white/[0.06] align-top">
                      <td className="py-2.5 text-mist">{fmtDayYear(r.date)}</td>
                      <td className="py-2.5 text-star">
                        {r.format} {r.demo && <DemoBadge />}
                        {r.notes && <p className="mt-0.5 max-w-xs text-xs text-haze">{r.notes}</p>}
                      </td>
                      <td className="py-2.5 text-right text-star">{num(r.quantity)}</td>
                      <td className="py-2.5 text-right text-mist">{money(r.unitCost)}</td>
                      <td className="py-2.5 text-right text-star">{money(r.quantity * r.unitCost)}</td>
                      <td className="py-2.5 pl-4 text-mist">{r.printer || "—"}</td>
                      <td className="py-1.5 text-right whitespace-nowrap">
                        <div className="flex justify-end gap-0.5">
                          <IconButton label="Edit print run" onClick={() => setEditor({ open: true, run: r })}>
                            <Pencil className="h-4 w-4" />
                          </IconButton>
                          <IconButton label="Delete print run" onClick={() => remove(r)}>
                            <Trash2 className="h-4 w-4" />
                          </IconButton>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      <Card className="mt-4">
        <CardHeader title="Reprint planner" subtitle={`At ${money(deal.listPrice)} a copy with a ${deal.vendorShare}% distributor share, each copy brings in ${money(copy.net)} net.`} action={<Calculator className="h-5 w-5 text-gold" />} />
        <div className="grid gap-6 px-5 pt-4 pb-6 md:px-6 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Copies to print">
              {(id) => <Input id={id} type="number" min={0} step={1} value={plan.copies} onChange={(e) => setPlan({ ...plan, copies: e.target.value })} />}
            </Field>
            <Field label="Cost per copy" hint={plan.cost === "" && runs.length ? "Using the current average" : undefined}>
              {(id) => <Input id={id} type="number" min={0} step="0.01" placeholder={copy.cost ? copy.cost.toFixed(2) : "0.00"} value={plan.cost} onChange={(e) => setPlan({ ...plan, cost: e.target.value })} />}
            </Field>
          </div>
          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              ["Printing bill", money(bill)],
              ["Profit per copy", money(profitPerCopy)],
              ["Pays for itself after", payback != null ? `${num(payback)} copies` : "—"],
              ["If all sell", money(planCopies * profitPerCopy)],
            ].map(([k, v]) => (
              <div key={k} className="rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 py-3">
                <dt className="text-xs text-haze">{k}</dt>
                <dd className="mt-1 font-heading text-[1.3rem] text-white tabular-nums">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </Card>

      <PrintRunEditor open={editor.open} run={editor.run} onClose={() => setEditor({ open: false })} />
    </div>
  );
}
