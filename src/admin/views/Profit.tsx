import { useMemo, useState, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Check, CircleDollarSign, FileText, HandCoins, Package, Pencil, Plus, Settings2, Trash2, Users } from "lucide-react";
import { useStore } from "../../lib/store";
import { fmtDayYear, num, pct, sharePct } from "../../lib/format";
import { distribution, ledger, outlook, perCopy, printing, repayment, salesIn, stock } from "../../lib/profit";
import { dealStore, partnersStore, payoutsStore, printRunsStore, salesStore } from "../../data/stores";
import type { Payout } from "../../data/types";
import { useAdmin } from "../context";
import { Progress, SplitBar, VIZ } from "../charts";
import { DealEditor, ImportSetupButton, PayoutEditor, PeriodPicker, PrintRunEditor, usePeriod } from "../deal";
import { Badge, Button, Card, DemoBadge, IconButton, Input, PageHeader, useFeedback } from "../ui";
import { applySealedSeed, sealedSeedPending } from "../../data/seed";

/** A card header numbered like the publisher's statement: "01 · Investment summary". */
export function NumberedHeader({ n, title, subtitle, action }: { n?: string; title: string; subtitle?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 px-5 pt-5 md:px-6">
      <div>
        <h2 className="flex items-baseline gap-2.5 text-[0.95rem] font-semibold text-star">
          {n && <span className="font-heading text-[1.05rem] font-medium text-gold">{n}</span>}
          {title}
        </h2>
        {subtitle && <p className="mt-0.5 text-sm text-mist">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

/** Label / amount lines with hairline rules, the way a statement table reads. */
export function Rows({ rows }: { rows: { label: ReactNode; value: ReactNode; strong?: boolean; muted?: boolean }[] }) {
  return (
    <dl className="divide-y divide-white/[0.06] text-[0.95rem]">
      {rows.map((r, i) => (
        <div key={i} className={`flex items-baseline justify-between gap-4 py-2.5 ${r.strong ? "pt-3" : ""}`}>
          <dt className={r.strong ? "font-medium text-star" : r.muted ? "text-haze" : "text-mist"}>{r.label}</dt>
          <dd className={`tabular-nums ${r.strong ? "font-heading text-[1.25rem] text-gold-light" : "text-star"}`}>{r.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function Figure({ label, value, accent, hint }: { label: string; value: ReactNode; accent?: boolean; hint?: ReactNode }) {
  return (
    <div className={`rounded-xl border px-4 py-3.5 ${accent ? "border-gold/35 bg-gold/[0.07]" : "border-white/[0.07] bg-white/[0.02]"}`}>
      <p className="text-[0.75rem] text-mist">{label}</p>
      <p className={`mt-1 font-heading text-[1.55rem] leading-tight tabular-nums ${accent ? "text-gold-light" : "text-white"}`}>{value}</p>
      {hint && <p className="mt-0.5 text-[0.72rem] text-haze">{hint}</p>}
    </div>
  );
}

export default function Profit() {
  const deal = useStore(dealStore);
  const partners = useStore(partnersStore);
  const runs = useStore(printRunsStore);
  const sales = useStore(salesStore);
  const payouts = useStore(payoutsStore);
  const { money } = useAdmin();
  const { toast, confirm } = useFeedback();
  const navigate = useNavigate();
  const periodState = usePeriod("cumulative");
  const { period } = periodState;
  const [dealOpen, setDealOpen] = useState(false);
  const [runOpen, setRunOpen] = useState(false);
  const [payout, setPayout] = useState<{ open: boolean; record?: Payout | null; partnerId?: string }>({ open: false });

  const p = useMemo(() => printing(runs), [runs]);
  const periodSales = useMemo(() => salesIn(sales, period.start, period.end), [sales, period]);
  const l = ledger(periodSales);
  const dist = distribution(partners, deal, periodSales, [], p);
  const toDate = distribution(partners, deal, sales, payouts, p);
  const look = outlook(partners, deal, runs, sales);
  const copy = perCopy(deal, p);
  const st = stock(runs, sales);
  const invested = look.invested;
  const owner = partners.find((x) => x.owner);
  const setup = [
    { done: invested > 0, label: "Enter each partner's investment", action: () => setDealOpen(true), cta: "Edit the deal" },
    { done: runs.length > 0, label: "Add the print run (copies and cost per copy)", action: () => setRunOpen(true), cta: "Add print run" },
    { done: sales.some((s) => p.isPrinted(s.format)), label: "Record copies sold (one entry per statement is fine)", to: "/admin/sales", cta: "Go to sales" },
  ];
  const repaying = toDate.lines.some((x) => x.repayment !== 0);
  const sortedPayouts = [...payouts].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt);
  const partnerName = (id: string) => partners.find((x) => x.id === id)?.name ?? "Former partner";

  const removePayout = async (x: Payout) => {
    if (!(await confirm({ title: "Delete this payment?", body: `${money(x.amount)} to ${partnerName(x.partnerId)} on ${fmtDayYear(x.date)}.`, confirmLabel: "Delete", danger: true }))) return;
    payoutsStore.set((prev) => prev.filter((y) => y.id !== x.id));
    toast("Payment deleted", "info", { label: "Undo", run: () => payoutsStore.set((prev) => [x, ...prev]) });
  };

  return (
    <div>
      <PageHeader
        title="Profit & distribution"
        subtitle={
          <>
            {period.label} · with {deal.publisher || "your publisher"}
          </>
        }
        actions={
          <>
            <PeriodPicker state={periodState} />
            <Button onClick={() => navigate(`/admin/statements?start=${period.start}&end=${period.end}`)}>
              <FileText className="h-4 w-4" /> Statement
            </Button>
            <Button variant="primary" onClick={() => setPayout({ open: true })}>
              <HandCoins className="h-4 w-4" /> Record payment
            </Button>
          </>
        }
      />

      {setup.some((s) => !s.done) && (
        <Card className="mb-6 p-5 md:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="font-heading text-[1.3rem] text-white">Finish setting up the deal</p>
              <p className="mt-1 max-w-xl text-sm text-mist">Three things and every figure on this page — and on your statements — fills in by itself. Have a setup file from your publisher? Import it instead.</p>
            </div>
            <ImportSetupButton />
          </div>
          {sealedSeedPending() && <SealedFigures />}
          <ol className="mt-5 grid gap-3 md:grid-cols-3">
            {setup.map((s, i) => (
              <li key={i} className={`flex items-start gap-3 rounded-xl border p-4 ${s.done ? "border-[#0ca30c]/30 bg-[#0ca30c]/[0.06]" : "border-white/[0.07] bg-white/[0.02]"}`}>
                <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-sm ${s.done ? "bg-[#0ca30c] text-white" : "border border-gold/50 text-gold"}`}>{s.done ? <Check className="h-4 w-4" /> : i + 1}</span>
                <div className="min-w-0">
                  <p className={`text-sm ${s.done ? "text-mist line-through decoration-white/30" : "text-star"}`}>{s.label}</p>
                  {!s.done &&
                    (s.to ? (
                      <Link to={s.to} className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-gold hover:text-gold-light">
                        {s.cta} <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    ) : (
                      <button onClick={s.action} className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-gold hover:text-gold-light">
                        {s.cta} <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    ))}
                </div>
              </li>
            ))}
          </ol>
        </Card>
      )}

      {/* 04 — the period at a glance */}
      <Card className="mb-4">
        <NumberedHeader title="Sales performance" subtitle={`${fmtDayYear(period.start)} – ${fmtDayYear(period.end)}`} />
        <div className="grid grid-cols-2 gap-3 px-5 pt-4 md:px-6 lg:grid-cols-6">
          <Figure label="Books sold" value={num(l.units)} hint={l.givenAway ? `+ ${num(l.givenAway)} given away` : `${num(l.orders)} ${l.orders === 1 ? "entry" : "entries"}`} />
          <Figure label="Sales revenue" value={money(l.gross)} />
          <Figure label="Distributor share" value={money(l.vendor)} hint={l.gross ? pct(l.vendor / l.gross) + " of revenue" : undefined} />
          <Figure label="Net revenue received" value={money(l.net)} />
          <Figure label="Printing cost" value={money(l.cost)} />
          <Figure label="Net profit" value={money(l.profit)} accent />
        </div>
        <div className="px-5 pt-5 pb-6 md:px-6">
          <p className="mb-3 text-sm text-mist">Where the period's sales revenue went</p>
          <SplitBar
            label="Sales revenue split"
            format={(v) => money(v)}
            segments={[
              { key: "vendor", label: "Distributor share", value: l.vendor, color: VIZ.blue },
              { key: "print", label: "Printing cost", value: Math.min(l.cost, l.net), color: VIZ.aqua },
              { key: "profit", label: "Net profit", value: l.profit, color: VIZ.gold },
            ]}
          />
          {l.profit < 0 && <p className="mt-3 text-sm text-[#ff9a9a]">Printing cost exceeded net revenue by {money(-l.profit)} in this period (copies given away count their printing cost).</p>}
        </div>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2 [&>*]:min-w-0">
        {/* 01 — investment */}
        <Card>
          <NumberedHeader
            title="Investment summary"
            subtitle={deal.splitBy === "investment" ? "Profit is shared in proportion to what each partner put in." : "Profit is shared by custom percentages."}
            action={
              <IconButton label="Edit the deal" onClick={() => setDealOpen(true)}>
                <Settings2 className="h-4 w-4" />
              </IconButton>
            }
          />
          <div className="px-5 pt-2 pb-5 md:px-6">
            <Rows
              rows={[
                ...dist.lines.map((line) => ({
                  label: (
                    <span className="flex items-center gap-2">
                      {line.partner.name}
                      {line.partner.owner && <Badge tone="gold">You</Badge>}
                      <span className="text-haze">{line.partner.role}</span>
                    </span>
                  ),
                  value: (
                    <span>
                      {money(line.investment)} <span className="ml-1.5 text-sm text-haze">{sharePct(line.share)}</span>
                    </span>
                  ),
                })),
                { label: "Total investment", value: money(invested), strong: true },
              ]}
            />
          </div>
        </Card>

        {/* 02 — printing & stock */}
        <Card>
          <NumberedHeader
            title="Printing & sales overview"
            subtitle={p.main ? `${p.main} · ${runs.length} print ${runs.length === 1 ? "run" : "runs"}` : "No print run yet"}
            action={
              <Link to="/admin/inventory" className="inline-flex items-center gap-1 text-sm font-medium text-gold hover:text-gold-light">
                Print & stock <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            }
          />
          <div className="px-5 pt-2 pb-5 md:px-6">
            {runs.length ? (
              <Rows
                rows={[
                  { label: "Total books printed", value: num(look.printed) },
                  { label: "Printing cost per book", value: money(p.unitCost(p.main)) },
                  { label: "Selling price per book", value: money(deal.listPrice) },
                  { label: "Sold to date", value: num(st.reduce((a, f) => a + f.sold, 0)) },
                  ...(st.some((f) => f.givenAway) ? [{ label: "Given away", value: num(st.reduce((a, f) => a + f.givenAway, 0)), muted: true }] : []),
                  {
                    label: (
                      <span className="flex items-center gap-2">
                        In stock {look.remaining <= deal.lowStockAt && <Badge tone="warn">Low stock</Badge>}
                      </span>
                    ),
                    value: num(look.remaining),
                    strong: true,
                  },
                ]}
              />
            ) : (
              <div className="flex flex-col items-start gap-3 py-4">
                <p className="text-sm text-mist">Add the print run to track copies in stock and the printing cost of every sale.</p>
                <Button size="sm" onClick={() => setRunOpen(true)}>
                  <Package className="h-4 w-4" /> Add print run
                </Button>
              </div>
            )}
          </div>
        </Card>

        {/* 03 — per copy */}
        <Card>
          <NumberedHeader
            title="Revenue distribution per book"
            subtitle="How each copy sold at the cover price is allocated."
            action={
              <IconButton label="Edit price and distributor share" onClick={() => setDealOpen(true)}>
                <Pencil className="h-4 w-4" />
              </IconButton>
            }
          />
          <div className="px-5 pt-4 pb-5 md:px-6">
            <SplitBar
              label="Each copy"
              format={(v) => money(v)}
              segments={[
                { key: "vendor", label: "Distributor", value: copy.vendor, color: VIZ.blue },
                { key: "print", label: "Printing", value: Math.min(copy.cost, copy.net), color: VIZ.aqua },
                { key: "profit", label: "Profit", value: copy.profit, color: VIZ.gold },
              ]}
            />
            <div className="mt-4">
              <Rows
                rows={[
                  { label: "Selling price", value: money(copy.price) },
                  { label: `Distribution vendor share (${deal.vendorShare}%)`, value: money(copy.vendor) },
                  { label: "Net revenue received", value: money(copy.net) },
                  { label: "Printing cost", value: runs.length ? money(copy.cost) : "Add a print run" },
                  { label: "Net profit per book", value: money(copy.profit), strong: true },
                ]}
              />
            </div>
          </div>
        </Card>

        {/* 05 — distribution */}
        <Card>
          <NumberedHeader title="Profit distribution" subtitle={`Earned ${period.key === "cumulative" ? "to date" : "in this period"} — ${money(dist.shared.profit + dist.ownerOnly.profit)} net profit.`} />
          <div className="overflow-x-auto px-5 pt-3 pb-5 md:px-6">
            <table className="w-full min-w-[420px] text-sm">
              <thead className="text-left text-xs text-haze">
                <tr>
                  <th className="pb-2 font-medium">Partner</th>
                  <th className="pb-2 text-right font-medium">Investment</th>
                  <th className="pb-2 text-right font-medium">Share</th>
                  <th className="pb-2 text-right font-medium">Profit earned</th>
                </tr>
              </thead>
              <tbody className="tabular-nums">
                {dist.lines.map((line) => (
                  <tr key={line.partner.id} className="border-t border-white/[0.06]">
                    <td className="py-2.5 text-star">{line.partner.name}</td>
                    <td className="py-2.5 text-right text-mist">{money(line.investment)}</td>
                    <td className="py-2.5 text-right text-mist">{sharePct(line.share)}</td>
                    <td className="py-2.5 text-right font-heading text-[1.15rem] text-gold-light">{money(line.earned)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {dist.ownerOnly.profit !== 0 && (
              <p className="mt-3 text-xs text-haze">
                Includes {money(dist.ownerOnly.profit)} from formats outside the shared deal, which goes to {owner?.name ?? "you"} in full.
              </p>
            )}
          </div>
        </Card>
      </div>

      <RepaymentCard className="mt-4" onEdit={() => setDealOpen(true)} />

      {/* payments */}
      <Card className="mt-4">
        <NumberedHeader
          title="Payments & balances"
          subtitle="All time — profit each partner has earned, what has actually been paid out, and what is still outstanding."
          action={
            <Button size="sm" onClick={() => setPayout({ open: true })}>
              <Plus className="h-4 w-4" /> Record payment
            </Button>
          }
        />
        <div className="grid gap-3 px-5 pt-4 md:grid-cols-2 md:px-6 xl:grid-cols-3">
          {toDate.lines.map((line) => (
            <div key={line.partner.id} className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate font-medium text-star">{line.partner.name}</p>
                {line.balance > 0.005 ? (
                  <Badge tone={line.partner.owner ? "gold" : "neutral"}>Outstanding {money(line.balance)}</Badge>
                ) : line.repayment < 0 ? (
                  <Badge tone="neutral">Goes to repayment</Badge>
                ) : (
                  <Badge tone="good">Settled</Badge>
                )}
              </div>
              <dl className={`mt-3 grid gap-2 text-xs ${repaying ? "grid-cols-4" : "grid-cols-3"}`}>
                <div>
                  <dt className="text-haze">Earned</dt>
                  <dd className="mt-0.5 text-[0.95rem] text-star tabular-nums">{money(line.earned)}</dd>
                </div>
                {repaying && (
                  <div>
                    <dt className="text-haze">{line.repayment < 0 ? "To repayment" : "Repayment"}</dt>
                    <dd className="mt-0.5 text-[0.95rem] text-star tabular-nums">
                      {line.repayment < 0 ? "−" : line.repayment > 0 ? "+" : ""}
                      {money(Math.abs(line.repayment))}
                    </dd>
                  </div>
                )}
                <div>
                  <dt className="text-haze">Paid</dt>
                  <dd className="mt-0.5 text-[0.95rem] text-star tabular-nums">{money(line.paidProfit)}</dd>
                </div>
                <div>
                  <dt className="text-haze">Capital back</dt>
                  <dd className="mt-0.5 text-[0.95rem] text-star tabular-nums">{money(line.paidCapital)}</dd>
                </div>
              </dl>
              {line.balance > 0.005 && (
                <button onClick={() => setPayout({ open: true, partnerId: line.partner.id })} className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-gold hover:text-gold-light">
                  Pay {money(line.balance)} <ArrowRight className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
        <div className="px-5 pt-4 pb-5 md:px-6">
          {sortedPayouts.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-sm">
                <thead className="text-left text-xs text-haze">
                  <tr>
                    <th className="pb-2 font-medium">Date</th>
                    <th className="pb-2 font-medium">Paid to</th>
                    <th className="pb-2 font-medium">For</th>
                    <th className="pb-2 font-medium">Method</th>
                    <th className="pb-2 text-right font-medium">Amount</th>
                    <th className="w-20 pb-2" />
                  </tr>
                </thead>
                <tbody>
                  {sortedPayouts.slice(0, 20).map((x) => (
                    <tr key={x.id} className="border-t border-white/[0.06]">
                      <td className="py-2 text-mist">{fmtDayYear(x.date)}</td>
                      <td className="py-2 text-star">
                        {partnerName(x.partnerId)} {x.demo && <DemoBadge />}
                      </td>
                      <td className="py-2 text-mist">{x.kind === "profit" ? "Profit" : "Investment returned"}</td>
                      <td className="py-2 text-mist">
                        {x.method}
                        {x.reference && <span className="text-haze"> · {x.reference}</span>}
                      </td>
                      <td className="py-2 text-right text-star tabular-nums">{money(x.amount)}</td>
                      <td className="py-1 text-right whitespace-nowrap">
                        <div className="flex justify-end gap-0.5">
                          <IconButton label="Edit payment" onClick={() => setPayout({ open: true, record: x })}>
                            <Pencil className="h-4 w-4" />
                          </IconButton>
                          <IconButton label="Delete payment" onClick={() => removePayout(x)}>
                            <Trash2 className="h-4 w-4" />
                          </IconButton>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="flex items-center gap-2 text-sm text-haze">
              <CircleDollarSign className="h-4 w-4" /> No payments recorded yet. When the publisher sends your share, record it here and the balance updates.
            </p>
          )}
        </div>
      </Card>

      {/* 06 — outlook */}
      <Card className="mt-4">
        <NumberedHeader title="Summary & outlook" subtitle="Where the investment stands, and where the book lands if every printed copy sells." />
        <div className="grid gap-6 px-5 pt-4 pb-6 md:px-6 lg:grid-cols-3">
          <div>
            <p className="text-sm text-mist">Investment recovered</p>
            <p className="mt-1 font-heading text-[1.9rem] text-white tabular-nums">{pct(look.recovered, 1)}</p>
            <div className="mt-2">
              <Progress value={look.recovered} label="Investment recovered" />
            </div>
            <p className="mt-2 text-xs text-haze">
              {money(look.netReceived)} net revenue received of {money(invested)} invested.
            </p>
          </div>
          <div>
            <p className="text-sm text-mist">Break-even</p>
            {look.breakEvenCopies != null ? (
              <>
                <p className="mt-1 font-heading text-[1.9rem] text-white tabular-nums">{num(look.breakEvenCopies)} copies</p>
                <div className="mt-2">
                  <Progress value={look.breakEvenCopies ? look.copiesSold / look.breakEvenCopies : 0} color={VIZ.blue} label="Copies toward break-even" />
                </div>
                <p className="mt-2 text-xs text-haze">{look.copiesToGo ? `${num(look.copiesToGo)} more at ${money(copy.net)} net each to earn the investment back.` : "The investment has been earned back."}</p>
              </>
            ) : (
              <p className="mt-2 text-sm text-haze">Enter the investments to see the break-even point.</p>
            )}
          </div>
          <div>
            <p className="text-sm text-mist">If every printed copy sells</p>
            <p className="mt-1 font-heading text-[1.9rem] text-gold-light tabular-nums">{money(look.projectedProfit)}</p>
            <p className="mt-1 text-xs text-haze">
              total net profit · {num(look.remaining)} copies still in stock ({money(look.stockValue)} at cost)
            </p>
            <ul className="mt-3 space-y-1 text-sm">
              {dist.lines.map((line) => (
                <li key={line.partner.id} className="flex justify-between gap-3">
                  <span className="text-mist">{line.partner.name}</span>
                  <span className="text-star tabular-nums">{money(look.projectedProfit * line.share)}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="border-t border-white/[0.06] px-5 py-4 text-sm text-mist md:px-6">
          <Users className="mr-1.5 inline h-4 w-4 text-gold" />
          {l.units > 0 ? (
            <>
              As of {num(l.units)} {l.units === 1 ? "book" : "books"} sold {period.key === "cumulative" ? "to date" : "in this period"}, the project has generated {money(l.profit)} in net profit:{" "}
              {dist.lines.map((line, i) => (
                <span key={line.partner.id}>
                  {i > 0 && (i === dist.lines.length - 1 ? " and " : ", ")}
                  <span className="text-star">
                    {line.partner.name} {money(line.earned)}
                  </span>
                </span>
              ))}
              .
            </>
          ) : (
            "No books sold in this period yet."
          )}
        </div>
      </Card>

      <DealEditor open={dealOpen} onClose={() => setDealOpen(false)} />
      <PrintRunEditor open={runOpen} onClose={() => setRunOpen(false)} />
      <PayoutEditor open={payout.open} payout={payout.record} partnerId={payout.partnerId} onClose={() => setPayout({ open: false })} />
    </div>
  );
}

/** The partner investment being paid back out of the owner's share of the profit, to date. */
export function RepaymentCard({ className = "", onEdit }: { className?: string; onEdit?: () => void }) {
  const deal = useStore(dealStore);
  const partners = useStore(partnersStore);
  const runs = useStore(printRunsStore);
  const sales = useStore(salesStore);
  const { money } = useAdmin();
  const p = useMemo(() => printing(runs), [runs]);
  const r = repayment(partners, deal, sales, p);
  if (r.total <= 0) return null;
  const to = r.to.join(" & ");
  const done = r.remaining <= 0.005;
  return (
    <Card className={className}>
      <NumberedHeader
        title={`${to} investment`}
        subtitle="Repaid from your share of the profit until it's paid back in full"
        action={
          onEdit && (
            <IconButton label="Edit the amount to repay" onClick={onEdit}>
              <Pencil className="h-4 w-4" />
            </IconButton>
          )
        }
      />
      <div className="grid gap-6 px-5 pt-3 pb-6 md:grid-cols-3 md:px-6">
        <div>
          <p className="text-sm text-mist">Total invested</p>
          <p className="mt-1 font-heading text-[1.9rem] leading-tight text-white tabular-nums">{money(r.total)}</p>
          <p className="mt-1 text-xs text-haze">by {to}</p>
        </div>
        <div>
          <p className="text-sm text-mist">Repaid so far</p>
          <p className="mt-1 font-heading text-[1.9rem] leading-tight text-gold-light tabular-nums">{money(r.repaid)}</p>
          <div className="mt-2">
            <Progress value={r.progress} label={`${to} investment repaid`} />
          </div>
          <p className="mt-1.5 text-xs text-haze">{pct(r.progress, 1)} repaid from your profit</p>
        </div>
        <div>
          <p className="text-sm text-mist">Left to repay</p>
          <p className="mt-1 font-heading text-[1.9rem] leading-tight text-white tabular-nums">{money(r.remaining)}</p>
          <p className="mt-1 text-xs text-haze">{done ? "Paid back in full — your profit share is yours again." : `Until then your profit share goes to ${to}.`}</p>
        </div>
      </div>
    </Card>
  );
}

/** Opens the publisher's statement figures that ship sealed with the dashboard passcode. */
function SealedFigures() {
  const { toast } = useFeedback();
  const [pass, setPass] = useState("");
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  return (
    <form
      className="mt-5 flex flex-wrap items-end gap-3 rounded-xl border border-gold/25 bg-gold/[0.06] p-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        const ok = await applySealedSeed(pass);
        setBusy(false);
        setFailed(!ok);
        if (ok) toast("The publisher's July 10 statement figures are in");
      }}
    >
      <div className="min-w-[220px] flex-1">
        <p className="text-sm text-star">Load the publisher's July 10, 2026 statement</p>
        <p className="mt-0.5 text-xs text-haze">Investments, the print run and copies sold to June 30 — enter the original dashboard passcode to open them.</p>
      </div>
      <Input type="password" aria-label="Dashboard passcode" placeholder="Passcode" value={pass} onChange={(e) => setPass(e.target.value)} className="!w-48" />
      <Button type="submit" variant="primary" disabled={busy || !pass}>
        Load figures
      </Button>
      {failed && <p className="w-full text-xs text-red-300">That passcode doesn't open them.</p>}
    </form>
  );
}
