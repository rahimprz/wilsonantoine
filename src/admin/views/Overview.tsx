import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, BookOpen, CalendarClock, MousePointerClick, Plus, Receipt, Sparkles, Table2, Target, UserPlus, LineChart } from "lucide-react";
import { useStore } from "../../lib/store";
import { engagement, groupBy, inRange, monthPace, pipeline, repStats, series, totals, delta, grainFor } from "../../lib/metrics";
import { fmtDay, greeting, num, pct, relativeDays } from "../../lib/format";
import { eventsStore, leadsStore, repsStore, salesStore, settingsStore, subscribersStore } from "../../data/stores";
import { loadDemoData } from "../../data/demo";
import { STAGE_LABEL } from "../../data/constants";
import { useAdmin } from "../context";
import { BarList, Progress, TrendChart, VIZ } from "../charts";
import { Kpi, RangePicker, rangeLabel, SaleEditor } from "../components";
import { Badge, Button, Card, CardHeader, DemoBadge, EmptyState, IconButton, PageHeader, useFeedback } from "../ui";

export default function Overview() {
  const sales = useStore(salesStore);
  const leads = useStore(leadsStore);
  const reps = useStore(repsStore);
  const events = useStore(eventsStore);
  const subscribers = useStore(subscribersStore);
  const settings = useStore(settingsStore);
  const { range, rangeKey, money } = useAdmin();
  const { toast } = useFeedback();
  const [recording, setRecording] = useState(false);
  const [tableView, setTableView] = useState(false);

  const current = useMemo(() => sales.filter((s) => inRange(s.date, range.start, range.end)), [sales, range]);
  const previous = useMemo(() => sales.filter((s) => inRange(s.date, range.prevStart, range.prevEnd)), [sales, range]);
  const t = totals(current);
  const p = totals(previous);
  const buckets = useMemo(() => series(sales, range.start, range.end), [sales, range]);
  const grain = grainFor(range.days);
  const formats = groupBy(current, "format");
  const channels = groupBy(current, "channel");
  const leaderboard = repStats(reps, sales, leads, range.start, range.end);
  const pipe = pipeline(leads);
  const pace = monthPace(sales);
  const eng = engagement(events, range.start, range.end);
  const newSubs = subscribers.filter((s) => inRange(s.date.slice(0, 10), range.start, range.end)).length;
  const recent = [...sales].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt).slice(0, 6);
  const repName = (id: string) => reps.find((r) => r.id === id)?.name ?? "—";

  const spark = (key: "gross" | "net" | "units") => buckets.map((b) => b[key]);
  const empty = sales.length === 0;

  return (
    <div>
      <PageHeader
        title={`${greeting()}, ${settings.ownerName || "there"}`}
        subtitle={empty ? "Your sales dashboard is ready. Record a sale or explore with demo data to see it come alive." : `Here's how Postmortem Life Continuation is doing — ${rangeLabel(rangeKey)}.`}
        actions={
          <>
            <RangePicker />
            <Button variant="primary" onClick={() => setRecording(true)}>
              <Plus className="h-4 w-4" /> Record sale
            </Button>
          </>
        }
      />

      {empty && (
        <Card className="mb-6 overflow-hidden">
          <div className="grid gap-px bg-white/[0.06] md:grid-cols-3">
            {[
              { icon: Receipt, title: "Record your first sale", text: "Amazon royalties, event signings, bulk orders — log them as they come in.", action: () => setRecording(true), label: "Record sale" },
              { icon: UserPlus, title: "Add your sales reps", text: "Track who sells what, commissions owed, and monthly targets.", to: "/admin/reps", label: "Add reps" },
              { icon: Sparkles, title: "Explore with demo data", text: "Fill the dashboard with clearly-labelled sample records. One click removes them.", action: () => { loadDemoData(); toast("Demo data loaded — clear it anytime from the banner"); }, label: "Load demo data" },
            ].map((s) => (
              <div key={s.title} className="bg-[#0e1430] p-6">
                <s.icon className="h-6 w-6 text-gold" />
                <p className="mt-4 font-semibold text-star">{s.title}</p>
                <p className="mt-1 text-sm text-mist">{s.text}</p>
                {s.to ? (
                  <Link to={s.to} className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-gold hover:text-gold-light">
                    {s.label} <ArrowRight className="h-4 w-4" />
                  </Link>
                ) : (
                  <button onClick={s.action} className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-gold hover:text-gold-light">
                    {s.label} <ArrowRight className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi label="Gross revenue" value={money(t.gross)} change={delta(t.gross, p.gross)} spark={spark("gross")} sparkColor={VIZ.gold} />
        <Kpi label="Your earnings (net)" value={money(t.net)} change={delta(t.net, p.net)} spark={spark("net")} sparkColor={VIZ.blue} />
        <Kpi label="Copies sold" value={num(t.units)} change={delta(t.units, p.units)} spark={spark("units")} sparkColor={VIZ.gold} />
        <Kpi label="Avg. order value" value={money(t.aov)} change={delta(t.aov, p.aov)} hint={`${num(t.orders)} orders`} />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader
            title="Revenue over time"
            subtitle={`${grain === "day" ? "Daily" : grain === "week" ? "Weekly" : "Monthly"} · ${fmtDay(range.start)} – ${fmtDay(range.end)}`}
            action={
              <IconButton label={tableView ? "Show chart" : "Show as table"} onClick={() => setTableView((v) => !v)}>
                {tableView ? <LineChart className="h-4 w-4" /> : <Table2 className="h-4 w-4" />}
              </IconButton>
            }
          />
          <div className="px-5 pt-4 pb-5 md:px-6">
            {tableView ? (
              <div className="max-h-[300px] overflow-auto" data-lenis-prevent>
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-[#0e1430] text-left text-xs text-haze">
                    <tr>
                      <th className="py-2 font-medium">Period</th>
                      <th className="py-2 text-right font-medium">Copies</th>
                      <th className="py-2 text-right font-medium">Gross</th>
                      <th className="py-2 text-right font-medium">Net</th>
                    </tr>
                  </thead>
                  <tbody className="tabular-nums">
                    {buckets.map((b) => (
                      <tr key={b.key} className="border-t border-white/[0.05]">
                        <td className="py-2 text-mist">{b.label}</td>
                        <td className="py-2 text-right">{num(b.units)}</td>
                        <td className="py-2 text-right">{money(b.gross)}</td>
                        <td className="py-2 text-right">{money(b.net)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <TrendChart
                labels={buckets.map((b) => b.label)}
                series={[
                  { key: "gross", label: "Gross revenue", color: VIZ.gold, values: buckets.map((b) => b.gross), area: true },
                  { key: "net", label: "Your earnings", color: VIZ.blue, values: buckets.map((b) => b.net) },
                ]}
                format={(v) => money(v)}
                formatAxis={(v) => money(v, true)}
                extra={(i) => (
                  <p className="mt-1.5 flex justify-between border-t border-white/10 pt-1.5 text-mist">
                    Copies <span className="font-medium text-star tabular-nums">{num(buckets[i].units)}</span>
                  </p>
                )}
              />
            )}
          </div>
        </Card>

        <Card>
          <CardHeader title="This month's goal" subtitle={`Day ${pace.day} of ${pace.daysInMonth}`} action={<Target className="h-5 w-5 text-gold" />} />
          <div className="space-y-6 px-5 pt-5 pb-6 md:px-6">
            <Goal label="Copies" value={pace.units} target={settings.monthlyUnitTarget} projected={pace.projectedUnits} format={num} />
            <Goal label="Gross revenue" value={pace.gross} target={settings.monthlyRevenueTarget} projected={pace.projectedGross} format={(v) => money(v)} />
            <Link to="/admin/settings" className="inline-flex items-center gap-1.5 text-sm text-mist hover:text-gold">
              Adjust targets <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Card>
          <CardHeader title="Copies by format" subtitle="Which editions readers choose" />
          <div className="px-5 pt-5 pb-6 md:px-6">
            <BarList
              items={formats
                .slice()
                .sort((a, b) => b.units - a.units)
                .map((f) => ({ key: f.key, label: f.key, value: f.units, display: num(f.units), detail: `${money(f.gross)} gross · ${pct(f.units / Math.max(1, t.units))} of copies` }))}
            />
          </div>
        </Card>
        <Card>
          <CardHeader title="Revenue by channel" subtitle="Where the money comes from" />
          <div className="px-5 pt-5 pb-6 md:px-6">
            <BarList
              color={VIZ.blue}
              items={channels.map((c) => ({ key: c.key, label: c.key, value: c.gross, display: money(c.gross), detail: `${num(c.units)} copies · ${money(c.net)} net` }))}
            />
          </div>
        </Card>
        <Card className="md:col-span-2 xl:col-span-1">
          <CardHeader title="Website engagement" subtitle="From the book site's own tracking" action={<MousePointerClick className="h-5 w-5 text-gold" />} />
          <div className="px-5 pt-5 pb-6 md:px-6">
            <BarList
              color={VIZ.blue}
              empty="No visits recorded in this period yet."
              items={[
                { key: "v", label: "Visits", value: eng.visit, display: num(eng.visit) },
                { key: "c", label: "Chapter previews opened", value: eng.chapter_open, display: num(eng.chapter_open) },
                { key: "e", label: "Excerpt reads", value: eng.excerpt_open, display: num(eng.excerpt_open) },
                { key: "b", label: "Clicks to buy", value: eng.buy_click, display: num(eng.buy_click) },
                { key: "s", label: "Newsletter sign-ups", value: newSubs, display: num(newSubs) },
              ]}
            />
            <p className="mt-5 flex items-center justify-between rounded-xl bg-white/[0.03] px-4 py-3 text-sm">
              <span className="text-mist">Visit → buy click rate</span>
              <span className="font-semibold text-star">{pct(eng.clickThrough, 1)}</span>
            </p>
          </div>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader
            title="Sales rep leaderboard"
            subtitle={`Attributed sales, ${rangeLabel(rangeKey)}`}
            action={
              <Link to="/admin/reps" className="text-sm text-mist hover:text-gold">
                All reps →
              </Link>
            }
          />
          {leaderboard.length === 0 ? (
            <EmptyState icon={<UserPlus className="h-6 w-6" />} title="No sales reps yet" action={<Link to="/admin/reps" className="text-sm font-medium text-gold">Add a rep →</Link>}>
              Add the people selling the book to track their numbers and commissions.
            </EmptyState>
          ) : (
            <div className="overflow-x-auto px-2 pt-3 pb-4 md:px-3">
              <table className="w-full min-w-[560px] text-sm">
                <thead className="text-left text-xs text-haze">
                  <tr>
                    <th className="px-3 py-2 font-medium">Rep</th>
                    <th className="px-3 py-2 text-right font-medium">Copies</th>
                    <th className="px-3 py-2 text-right font-medium">Gross</th>
                    <th className="px-3 py-2 text-right font-medium">Commission</th>
                    <th className="w-40 px-3 py-2 font-medium">Month target</th>
                  </tr>
                </thead>
                <tbody className="tabular-nums">
                  {leaderboard.slice(0, 6).map((r, i) => (
                    <tr key={r.rep.id} className="border-t border-white/[0.05]">
                      <td className="px-3 py-3">
                        <span className="flex items-center gap-3">
                          <span className={`grid h-7 w-7 place-items-center rounded-full text-xs font-semibold ${i === 0 && r.gross > 0 ? "bg-gold text-void" : "bg-white/[0.07] text-mist"}`}>{i + 1}</span>
                          <span>
                            <span className="flex items-center gap-2 text-star">
                              {r.rep.name} {r.rep.demo && <DemoBadge />}
                            </span>
                            <span className="text-xs text-haze">{r.rep.region}</span>
                          </span>
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right">{num(r.units)}</td>
                      <td className="px-3 py-3 text-right">{money(r.gross)}</td>
                      <td className="px-3 py-3 text-right text-gold-light">{money(r.commission)}</td>
                      <td className="px-3 py-3">
                        <Progress value={r.targetProgress} label={`${r.rep.name} monthly target`} />
                        <span className="mt-1 block text-xs text-haze">
                          {num(r.monthUnits)} / {num(r.rep.monthlyTarget)} copies
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card>
          <CardHeader
            title="Pipeline"
            subtitle={`${num(pipe.openCount)} open · ${money(pipe.openValue)} potential`}
            action={
              <Link to="/admin/pipeline" className="text-sm text-mist hover:text-gold">
                Open →
              </Link>
            }
          />
          <div className="px-5 pt-4 pb-5 md:px-6">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl bg-white/[0.03] p-3">
                <p className="text-xs text-haze">Weighted forecast</p>
                <p className="mt-1 font-semibold text-star">{money(pipe.weighted)}</p>
              </div>
              <div className="rounded-xl bg-white/[0.03] p-3">
                <p className="text-xs text-haze">Win rate</p>
                <p className="mt-1 font-semibold text-star">{pipe.winRate == null ? "—" : pct(pipe.winRate)}</p>
              </div>
            </div>
            <p className="mt-5 mb-2 flex items-center gap-2 text-xs font-medium tracking-wide text-mist uppercase">
              <CalendarClock className="h-4 w-4 text-gold" /> Follow-ups due
            </p>
            {pipe.due.length === 0 ? (
              <p className="py-4 text-sm text-haze">Nothing due in the next 7 days.</p>
            ) : (
              <ul className="divide-y divide-white/[0.05]">
                {pipe.due.slice(0, 5).map((l) => {
                  const overdue = l.followUp < new Date().toISOString().slice(0, 10);
                  return (
                    <li key={l.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                      <span className="min-w-0">
                        <span className="block truncate text-star">{l.org}</span>
                        <span className="text-xs text-haze">{STAGE_LABEL[l.stage]} · {repName(l.repId)}</span>
                      </span>
                      <Badge tone={overdue ? "bad" : "warn"}>{overdue ? `Overdue · ${relativeDays(l.followUp)}` : relativeDays(l.followUp)}</Badge>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader
          title="Recent sales"
          action={
            <Link to="/admin/sales" className="text-sm text-mist hover:text-gold">
              All sales →
            </Link>
          }
        />
        {recent.length === 0 ? (
          <EmptyState icon={<BookOpen className="h-6 w-6" />} title="No sales recorded yet" action={<Button variant="primary" onClick={() => setRecording(true)}><Plus className="h-4 w-4" /> Record sale</Button>}>
            Every sale you log here feeds the charts, goals and rep commissions above.
          </EmptyState>
        ) : (
          <div className="overflow-x-auto px-2 pt-3 pb-4 md:px-3">
            <table className="w-full min-w-[620px] text-sm">
              <tbody className="tabular-nums">
                {recent.map((s) => (
                  <tr key={s.id} className="border-t border-white/[0.05] first:border-0">
                    <td className="px-3 py-3 text-mist">{fmtDay(s.date)}</td>
                    <td className="px-3 py-3 text-star">
                      <span className="flex items-center gap-2">
                        {s.quantity} × {s.format} {s.demo && <DemoBadge />}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-mist">{s.channel}</td>
                    <td className="px-3 py-3 text-mist">{s.customer || (s.repId ? repName(s.repId) : "")}</td>
                    <td className="px-3 py-3 text-right font-medium text-star">{money(s.quantity * s.unitPrice)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <SaleEditor open={recording} onClose={() => setRecording(false)} />
    </div>
  );
}

function Goal({ label, value, target, projected, format }: { label: string; value: number; target: number; projected: number; format: (v: number) => string }) {
  const progress = target > 0 ? value / target : 0;
  const onTrack = target > 0 && projected >= target;
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <span className="text-sm text-mist">{label}</span>
        <span className="text-sm tabular-nums">
          <span className="font-semibold text-star">{format(value)}</span>
          <span className="text-haze"> / {target > 0 ? format(target) : "no target"}</span>
        </span>
      </div>
      <Progress value={progress} label={`${label} toward monthly target`} />
      {target > 0 && (
        <p className="mt-2 flex items-center justify-between text-xs">
          <span className="text-haze">On pace for {format(projected)}</span>
          <Badge tone={onTrack ? "good" : "warn"}>{onTrack ? "On track" : `${pct(Math.min(progress, 9.99))} reached`}</Badge>
        </p>
      )}
    </div>
  );
}
