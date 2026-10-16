import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, ArrowUpRight, BookOpen, FileText, PencilLine, Plus } from "lucide-react";
import { useStore } from "../../lib/store";
import { fmtDay, fmtDayYear, greeting, num, sharePct } from "../../lib/format";
import { contentStore, dealStore, partnersStore, printRunsStore, repsStore, salesStore, settingsStore } from "../../data/stores";
import { resolveMedia } from "../../lib/media";
import { distribution, ledger, outlook, perCopy, printing, repayment } from "../../lib/profit";
import { primaryRetailer } from "../../site/buy";
import { useAdmin } from "../context";
import { Kpi, SaleEditor } from "../components";
import { Badge, Button, Card, DemoBadge, EmptyState, PageHeader } from "../ui";
import { NumberedHeader, RepaymentCard, Rows } from "./Profit";

/**
 * The publisher's Book Sales & Profit Distribution Report, kept live: the same figures, cumulative
 * to date, recalculated whenever a sale, the print run or the deal changes.
 */
export default function Overview() {
  const sales = useStore(salesStore);
  const reps = useStore(repsStore);
  const settings = useStore(settingsStore);
  const deal = useStore(dealStore);
  const partners = useStore(partnersStore);
  const runs = useStore(printRunsStore);
  const { money } = useAdmin();
  const navigate = useNavigate();
  const [recording, setRecording] = useState(false);

  const p = useMemo(() => printing(runs), [runs]);
  const l = ledger(sales);
  const look = outlook(partners, deal, runs, sales);
  const copy = perCopy(deal, p);
  const dist = distribution(partners, deal, sales, [], p);
  const mine = dist.lines.find((x) => x.partner.owner);
  const repay = repayment(partners, deal, sales, p);
  const since = deal.startDate || sales.reduce((min, s) => (!min || s.date < min ? s.date : min), "");
  const needsSetup = look.invested <= 0 || runs.length === 0;
  const recent = [...sales].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt).slice(0, 6);
  const repName = (id: string) => reps.find((r) => r.id === id)?.name ?? "";

  return (
    <div>
      <PageHeader
        title={`${greeting()}, ${settings.ownerName || "there"}`}
        subtitle={since ? `Book sales and profit to date — cumulative since ${fmtDayYear(since)}.` : "Book sales and profit to date."}
        actions={
          <>
            <Button onClick={() => navigate("/admin/statements")}>
              <FileText className="h-4 w-4" /> Statement
            </Button>
            <Button variant="primary" onClick={() => setRecording(true)}>
              <Plus className="h-4 w-4" /> Record sale
            </Button>
          </>
        }
      />

      <BookBanner
        stats={[
          { label: "Printing investment", value: money(look.invested) },
          { label: "Books printed", value: num(look.printed) },
          { label: "Printing cost per book", value: money(copy.cost) },
          { label: "Selling price per book", value: money(copy.price) },
        ]}
      />

      {needsSetup && (
        <Card className="mb-6 flex flex-wrap items-center justify-between gap-3 p-5">
          <p className="text-sm text-mist">
            <span className="text-star">Finish setting up the deal</span> — each partner's investment and the print run — and every figure here fills in.
          </p>
          <Link to="/admin/profit" className="inline-flex items-center gap-1.5 text-sm font-medium text-gold hover:text-gold-light">
            Set up the deal <ArrowRight className="h-4 w-4" />
          </Link>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi
          label="Books sold"
          value={num(l.units)}
          hint={[look.printed ? `of ${num(look.printed)} printed` : "", l.givenAway ? `${num(l.givenAway)} given away` : ""].filter(Boolean).join(" · ") || undefined}
        />
        <Kpi label="Total sales revenue" value={money(l.gross)} hint={`${money(l.vendor)} distributor share · ${money(l.net)} received`} />
        <Kpi label="Total net profit" value={money(l.profit)} hint={`after ${money(l.cost)} printing cost`} />
        <Kpi
          label="Your profit"
          value={money(mine?.earned ?? 0)}
          hint={
            <>
              {mine && partners.length > 1 && `${sharePct(mine.share)} share · `}
              {repay.repaid > 0 && `${money(repay.repaid)} to repaying ${repay.to.join(" & ")} · you keep ${money(repay.ownerKeeps)} · `}
              <Link to="/admin/profit" className="text-gold hover:text-gold-light">
                See the split →
              </Link>
            </>
          }
        />
      </div>

      <RepaymentCard className="mt-4" />

      <div className="mt-4 grid gap-4 xl:grid-cols-2 [&>*]:min-w-0">
        <Card>
          <NumberedHeader title="Revenue per book" subtitle="How each copy sold is divided" />
          <div className="px-5 pt-2 pb-5 md:px-6">
            <Rows
              rows={[
                { label: "Selling price", value: money(copy.price) },
                { label: `Distribution vendor share (${deal.vendorShare}%)`, value: money(copy.vendor) },
                { label: "Net revenue received", value: money(copy.net) },
                { label: "Printing cost", value: money(copy.cost) },
                { label: "Net profit per book", value: money(copy.profit), strong: true },
              ]}
            />
          </div>
        </Card>

        <Card>
          <NumberedHeader
            title="Profit distribution"
            subtitle="Net profit to date, by each partner's investment"
            action={
              <Link to="/admin/profit" className="shrink-0 text-sm text-mist hover:text-gold">
                Split &amp; payments →
              </Link>
            }
          />
          <div className="px-5 pt-2 pb-5 md:px-6">
            {dist.lines.length === 0 ? (
              <p className="py-6 text-center text-sm text-haze">Add the partners on Profit &amp; split to see the distribution.</p>
            ) : (
              <Rows
                rows={[
                  ...dist.lines.map((line) => ({
                    label: (
                      <span className="flex flex-wrap items-center gap-x-2">
                        {line.partner.name}
                        {line.partner.owner && <Badge tone="gold">You</Badge>}
                        <span className="text-haze">{money(line.investment)} invested</span>
                      </span>
                    ),
                    value: money(line.earned),
                  })),
                  { label: "Total net profit", value: money(l.profit), strong: true },
                ]}
              />
            )}
          </div>
        </Card>
      </div>

      <Card className="mt-4">
        <NumberedHeader
          title="Sales entries"
          subtitle="The figures above are added up from these"
          action={
            <Link to="/admin/sales" className="shrink-0 text-sm text-mist hover:text-gold">
              All sales →
            </Link>
          }
        />
        {recent.length === 0 ? (
          <EmptyState
            icon={<BookOpen className="h-6 w-6" />}
            title="No sales recorded yet"
            action={
              <Button variant="primary" onClick={() => setRecording(true)}>
                <Plus className="h-4 w-4" /> Record sale
              </Button>
            }
          >
            Add each publisher statement (or any other sale) and the figures above update by themselves.
          </EmptyState>
        ) : (
          <div className="overflow-x-auto px-2 pt-2 pb-4 md:px-3">
            <table className="w-full min-w-[620px] text-sm">
              <tbody className="tabular-nums">
                {recent.map((s) => (
                  <tr key={s.id} className="border-t border-white/[0.05] first:border-0">
                    <td className="px-3 py-3 text-mist">{fmtDay(s.date)}</td>
                    <td className="px-3 py-3 text-star">
                      <span className="flex items-center gap-2">
                        {num(s.quantity)} × {s.format} {s.demo && <DemoBadge />}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-mist">{s.channel}</td>
                    <td className="px-3 py-3 text-mist">{s.customer || repName(s.repId)}</td>
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

/** The book itself, front and centre: cover, where it sells, and the deal it was printed under. */
function BookBanner({ stats }: { stats: { label: string; value: string; hint?: string }[] }) {
  const content = useStore(contentStore);
  const retailer = primaryRetailer(content.buy.retailers);
  const cover = resolveMedia(content.book.cover);
  return (
    <div className="relative mb-6 overflow-hidden rounded-2xl border border-gold/20 bg-[radial-gradient(90%_120%_at_10%_50%,#1a2c7a,#0e1430_55%,#0b1029)]">
      <div className="stars-bg pointer-events-none absolute inset-0 opacity-70" />
      <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-[radial-gradient(closest-side,rgba(181,159,120,0.18),transparent)]" />
      <div className="relative flex flex-col gap-6 p-5 md:flex-row md:items-center md:p-6">
        <div className="flex items-center gap-5">
          {cover ? (
            <img src={cover} alt="" className="h-28 w-auto shrink-0 -rotate-2 rounded-r-[4px] shadow-[0_18px_30px_-12px_rgba(0,0,0,0.9)] md:h-32" />
          ) : (
            <span className="grid h-28 w-20 shrink-0 place-items-center rounded-r-[4px] bg-[#1836a5] text-gold">
              <BookOpen className="h-7 w-7" />
            </span>
          )}
          <div className="min-w-0">
            <p className="text-[0.62rem] tracking-[0.25em] text-gold uppercase">Your book</p>
            <p className="font-heading mt-1 text-[1.45rem] leading-tight text-white md:text-[1.6rem]">{content.hero.title}</p>
            <p className="mt-1 text-sm text-mist">
              by {content.author.name}
              {retailer && ` · ${retailer.format} on ${retailer.label}`}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {retailer && (
                <a href={retailer.url} target="_blank" rel="noopener" className="inline-flex items-center gap-1.5 rounded-full border border-gold/40 px-3 py-1.5 text-xs text-gold-light transition hover:bg-gold/10">
                  {retailer.label} page <ArrowUpRight className="h-3.5 w-3.5" />
                </a>
              )}
              <Link to="/admin/website" className="inline-flex items-center gap-1.5 rounded-full border border-white/15 px-3 py-1.5 text-xs text-mist transition hover:border-white/30 hover:text-star">
                <PencilLine className="h-3.5 w-3.5" /> Edit website
              </Link>
            </div>
          </div>
        </div>
        <dl className="grid flex-1 grid-cols-2 gap-px overflow-hidden rounded-xl border border-white/10 bg-white/10 md:ml-auto md:max-w-xl lg:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="bg-[#0b1029]/85 px-4 py-3">
              <dt className="text-[0.7rem] text-haze">{s.label}</dt>
              <dd className="font-heading mt-0.5 text-[1.35rem] text-star tabular-nums">{s.value}</dd>
              {s.hint && <dd className="text-[0.68rem] text-gold-light">{s.hint}</dd>}
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
