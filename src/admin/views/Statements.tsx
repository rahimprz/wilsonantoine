import { useMemo, useState, type ReactNode } from "react";
import { useSearchParams } from "react-router-dom";
import { Download, Eye, FileText, Printer, Save, Trash2 } from "lucide-react";
import { useStore } from "../../lib/store";
import { download, toCSV } from "../../lib/csv";
import { isoDay, num, parseDay } from "../../lib/format";
import { uid } from "../../lib/id";
import { distribution, ledger, perCopy, printing, salesIn, stock } from "../../lib/profit";
import { contentStore, dealStore, partnersStore, printRunsStore, salesStore, statementsStore } from "../../data/stores";
import type { Statement } from "../../data/types";
import { useAdmin } from "../context";
import { ImportSetupButton, PeriodPicker, usePeriod } from "../deal";
import { Badge, Button, Card, CardHeader, Field, IconButton, Input, PageHeader, Textarea, useFeedback } from "../ui";

const longDate = new Intl.DateTimeFormat(undefined, { month: "long", day: "numeric", year: "numeric" });
const fmtLong = (s: string) => (s ? longDate.format(parseDay(s)) : "");
/** "Wilson's Investment", but "Jinnx Book Press Investment" — as the publisher writes it. */
const possessive = (name: string) => (/s$/i.test(name.trim()) ? name : `${name}'s`);

type Figures = NonNullable<Statement["snapshot"]>;

export default function Statements() {
  const deal = useStore(dealStore);
  const partners = useStore(partnersStore);
  const runs = useStore(printRunsStore);
  const sales = useStore(salesStore);
  const statements = useStore(statementsStore);
  const content = useStore(contentStore);
  const { money } = useAdmin();
  const { toast, confirm } = useFeedback();
  const [params] = useSearchParams();
  const fromQuery = params.get("start") && params.get("end");
  const periodState = usePeriod(fromQuery ? "custom" : "cumulative", { start: params.get("start") ?? "", end: params.get("end") ?? "" });
  const { period } = periodState;
  const owner = partners.find((p) => p.owner);
  const [issuedOn, setIssuedOn] = useState(isoDay());
  const [preparedBy, setPreparedBy] = useState(deal.publisher || owner?.name || "");
  const [notes, setNotes] = useState("");
  const [viewing, setViewing] = useState<Statement | null>(null);

  const p = useMemo(() => printing(runs), [runs]);
  const copy = perCopy(deal, p);
  const printed = stock(runs, sales).reduce((a, f) => a + f.printed, 0);
  const start = viewing?.start ?? period.start;
  const end = viewing?.end ?? period.end;
  const live = useMemo(() => {
    const periodSales = salesIn(sales, start, end);
    const l = ledger(periodSales);
    const d = distribution(partners, deal, periodSales, [], p);
    return { units: l.units, gross: l.gross, vendor: l.vendor, net: l.net, cost: l.cost, profit: l.profit, shares: d.lines.map((x) => ({ name: x.partner.name, investment: x.investment, profit: x.earned })) } satisfies Figures;
  }, [sales, start, end, partners, deal, p]);
  const figures: Figures = viewing?.snapshot ?? live;
  const drift = viewing?.snapshot && (Math.abs(viewing.snapshot.profit - live.profit) > 0.005 || viewing.snapshot.units !== live.units);
  const cumulative = viewing ? start <= (deal.startDate || start) : period.key === "cumulative";

  const save = () => {
    const record: Statement = {
      id: uid("st_"),
      number: `WA-${end.slice(0, 4)}-${String(statements.filter((s) => s.source === "dashboard").length + 1).padStart(2, "0")}`,
      issuedOn,
      start,
      end,
      source: "dashboard",
      notes: notes.trim(),
      snapshot: live,
      createdAt: Date.now(),
    };
    statementsStore.set((prev) => [record, ...prev]);
    toast(`Statement ${record.number} saved`);
  };

  const exportCSV = () => {
    const rows = [
      { item: "Reporting period", amount: `${start} to ${end}` },
      { item: "Books sold", amount: figures.units },
      { item: "Total sales revenue", amount: figures.gross.toFixed(2) },
      { item: `Distribution vendor share (${deal.vendorShare}%)`, amount: figures.vendor.toFixed(2) },
      { item: "Net revenue received", amount: figures.net.toFixed(2) },
      { item: "Printing cost", amount: figures.cost.toFixed(2) },
      { item: "Total net profit", amount: figures.profit.toFixed(2) },
      ...figures.shares.map((s) => ({ item: `Profit — ${s.name}`, amount: s.profit.toFixed(2) })),
    ];
    download(`sales-profit-statement-${start}-to-${end}.csv`, toCSV(rows, [
      { key: "item", label: "item" },
      { key: "amount", label: "amount" },
    ]));
  };

  const remove = async (st: Statement) => {
    if (!(await confirm({ title: "Delete this statement?", body: `${st.number || "Publisher statement"} for ${fmtLong(st.start)} – ${fmtLong(st.end)}. Your sales records aren't affected.`, confirmLabel: "Delete", danger: true }))) return;
    statementsStore.set((prev) => prev.filter((x) => x.id !== st.id));
    if (viewing?.id === st.id) setViewing(null);
    toast("Statement deleted", "info", { label: "Undo", run: () => statementsStore.set((prev) => [st, ...prev]) });
  };

  return (
    <div>
      <PageHeader
        title="Statements"
        subtitle="The Book Sales & Profit Distribution Report, for any period — print it, save it as a PDF, or keep it on file."
        actions={
          <>
            <Button onClick={exportCSV}>
              <Download className="h-4 w-4" /> CSV
            </Button>
            <Button variant="primary" onClick={() => window.print()}>
              <Printer className="h-4 w-4" /> Print / save PDF
            </Button>
          </>
        }
      />

      <div className="grid gap-4 xl:grid-cols-[340px_1fr] [&>*]:min-w-0">
        <div className="space-y-4">
          <Card className="p-5">
            {viewing ? (
              <div>
                <p className="text-sm text-mist">Viewing a statement on file</p>
                <p className="mt-1 font-heading text-[1.25rem] text-white">{viewing.number || "Publisher statement"}</p>
                <p className="text-sm text-haze">Issued {fmtLong(viewing.issuedOn)}</p>
                {drift && (
                  <p className="mt-3 rounded-lg border border-[#fab219]/30 bg-[#fab219]/10 p-3 text-xs text-[#ffd27a]">
                    Sales for this period have changed since it was issued: now {num(live.units)} books and {money(live.profit)} profit. The statement shows the figures as issued.
                  </p>
                )}
                <Button size="sm" className="mt-4" onClick={() => setViewing(null)}>
                  Back to a new statement
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <p className="mb-1.5 text-[0.8rem] font-medium tracking-wide text-mist">Period</p>
                  <PeriodPicker state={periodState} />
                </div>
                <Field label="Report date">{(id) => <Input id={id} type="date" value={issuedOn} onChange={(e) => setIssuedOn(e.target.value)} />}</Field>
                <Field label="Prepared by">{(id) => <Input id={id} value={preparedBy} onChange={(e) => setPreparedBy(e.target.value)} />}</Field>
                <Field label="Note on the statement" hint="Optional — printed under the summary.">
                  {(id) => <Textarea id={id} value={notes} onChange={(e) => setNotes(e.target.value)} className="!min-h-[70px]" />}
                </Field>
                <Button className="w-full" onClick={save}>
                  <Save className="h-4 w-4" /> Save to statement history
                </Button>
              </div>
            )}
          </Card>

          <Card>
            <CardHeader title="On file" subtitle={`${statements.length} ${statements.length === 1 ? "statement" : "statements"}`} />
            <ul className="divide-y divide-white/[0.06] px-2 pt-2 pb-3">
              {statements.length ? (
                [...statements]
                  .sort((a, b) => b.issuedOn.localeCompare(a.issuedOn) || b.createdAt - a.createdAt)
                  .map((st) => (
                    <li key={st.id} className={`flex items-center gap-2 rounded-lg px-3 py-2.5 ${viewing?.id === st.id ? "bg-gold/10" : ""}`}>
                      <FileText className="h-4 w-4 shrink-0 text-gold" />
                      <div className="min-w-0 flex-1">
                        <p className="flex items-center gap-2 truncate text-sm text-star">
                          {st.number || "Publisher statement"} <Badge tone={st.source === "publisher" ? "blue" : "neutral"}>{st.source === "publisher" ? "Publisher" : "Dashboard"}</Badge>
                        </p>
                        <p className="truncate text-xs text-haze">
                          {fmtLong(st.start)} – {fmtLong(st.end)}
                          {st.snapshot && ` · ${num(st.snapshot.units)} books · ${money(st.snapshot.profit)}`}
                        </p>
                      </div>
                      <IconButton label="View statement" onClick={() => setViewing(st)}>
                        <Eye className="h-4 w-4" />
                      </IconButton>
                      <IconButton label="Delete statement" onClick={() => remove(st)}>
                        <Trash2 className="h-4 w-4" />
                      </IconButton>
                    </li>
                  ))
              ) : (
                <li className="px-3 py-3 text-sm text-haze">Saved statements appear here.</li>
              )}
            </ul>
            <div className="border-t border-white/[0.06] px-5 py-3">
              <ImportSetupButton label="Import a statement file" variant="ghost" />
            </div>
          </Card>
        </div>

        <div className="overflow-x-auto rounded-2xl bg-[#e9e6df] p-3 md:p-6">
          <StatementDoc
            publisher={deal.publisher}
            author={owner?.name ?? content.author.name}
            title={content.hero.title}
            issuedOn={viewing?.issuedOn ?? issuedOn}
            start={start}
            end={end}
            cumulative={cumulative}
            figures={figures}
            investments={partners.map((x) => ({ name: x.name, amount: x.investment }))}
            printed={printed}
            copy={copy}
            vendorShare={deal.vendorShare}
            preparedBy={viewing ? (viewing.source === "publisher" ? deal.publisher : preparedBy) : preparedBy}
            notes={viewing?.source === "dashboard" ? viewing.notes : viewing ? "" : notes}
            money={money}
          />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- the document

interface DocProps {
  publisher: string;
  author: string;
  title: string;
  issuedOn: string;
  start: string;
  end: string;
  cumulative: boolean;
  figures: Figures;
  investments: { name: string; amount: number }[];
  printed: number;
  copy: ReturnType<typeof perCopy>;
  vendorShare: number;
  preparedBy: string;
  notes: string;
  money: (v: number) => string;
}

function Bar({ n, children }: { n: string; children: ReactNode }) {
  return (
    <h2 className="mt-9 mb-4 flex items-baseline gap-3 bg-[#1e2a4f] px-5 py-3 font-[Georgia,serif] text-[0.95rem] font-bold tracking-[0.06em] text-white uppercase">
      <span className="text-[#c9a227]">{n}</span>
      {children}
    </h2>
  );
}

function Table({ rows, head }: { rows: [ReactNode, ReactNode, boolean?][]; head?: [string, string] }) {
  return (
    <table className="w-full border-collapse text-[0.86rem]">
      {head && (
        <thead>
          <tr className="bg-[#1e2a4f] text-white">
            <th className="border border-[#d7d3ca] px-3.5 py-2 text-left font-semibold">{head[0]}</th>
            <th className="border border-[#d7d3ca] px-3.5 py-2 text-right font-semibold">{head[1]}</th>
          </tr>
        </thead>
      )}
      <tbody>
        {rows.map(([label, value, strong], i) => (
          <tr key={i} className={i % 2 === 0 ? "bg-[#f3f2ef]" : "bg-white"}>
            <td className={`w-3/5 border border-[#d7d3ca] px-3.5 py-2 ${strong ? "font-bold text-[#1e2a4f]" : "text-[#333]"}`}>{label}</td>
            <td className={`border border-[#d7d3ca] px-3.5 py-2 text-right tabular-nums ${strong ? "font-bold text-[#1e2a4f]" : "text-[#1e2a4f]"}`}>{value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function StatementDoc(d: DocProps) {
  const { money, figures: f } = d;
  const total = d.investments.reduce((a, x) => a + x.amount, 0);
  const equal = d.investments.length > 1 && d.investments.every((x) => Math.abs(x.amount - d.investments[0].amount) < 0.005) && total > 0;
  const names = d.investments.map((x) => x.name);
  const joined = names.length > 1 ? `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}` : names[0] ?? "";
  const books = `${num(f.units)} ${f.units === 1 ? "book" : "books"}`;
  return (
    <article className="print-doc mx-auto max-w-[820px] bg-white px-8 py-10 font-sans text-[#333] shadow-[0_20px_50px_-20px_rgba(0,0,0,0.5)] md:px-14 md:py-12">
      <header className="flex items-baseline gap-3 border-b-2 border-[#c9a227] pb-2">
        <span className="font-[Georgia,serif] text-[0.95rem] font-bold tracking-[0.08em] text-[#1e2a4f] uppercase">{d.publisher || d.author}</span>
        <span className="text-[0.7rem] text-[#777]">| Book Sales &amp; Profit Distribution Report</span>
      </header>
      <div className="mt-4 text-center font-[Georgia,serif] font-bold">
        <p className="text-[1.9rem] leading-tight text-[#1e2a4f]">BOOK SALES &amp; PROFIT</p>
        <p className="text-[1.9rem] leading-tight text-[#c9a227]">DISTRIBUTION REPORT</p>
        <p className="mt-1 text-[1.35rem] text-[#1e2a4f]">{d.end.slice(0, 4)}</p>
      </div>
      <p className="mt-6 border-b-2 border-[#c9a227] pb-3 text-[0.9rem] text-[#666] italic">
        Prepared for {d.author}
        {/\bMD\b/.test(d.author) ? "" : ", MD"}
        {d.publisher && ` · ${d.publisher}`}
      </p>

      <div className="mt-5">
        <Table
          rows={[
            ["Client / Author", `${d.author}${/\bMD\b/.test(d.author) ? "" : ", MD"}`],
            ["Publisher", d.publisher || "—"],
            ["Title", d.title],
            ["Report Date", fmtLong(d.issuedOn)],
            ["Report Type", `Book Sales & Profit Distribution — ${d.cumulative ? "Cumulative" : "Period"}`],
            ["Reporting Period", `${fmtLong(d.start)} – ${fmtLong(d.end)}`],
          ]}
        />
      </div>

      <section className="break-inside-avoid">
        <Bar n="01">Investment Summary</Bar>
        <p className="mb-4 text-[0.88rem] leading-relaxed">
          This section outlines the capital contributed by each party toward the printing and production of the title.
          {equal ? ` Investment was split evenly between ${joined}.` : total > 0 ? " Profit is shared in proportion to each party's investment." : ""}
        </p>
        <Table rows={[...d.investments.map((x) => [`${possessive(x.name)} Investment`, money(x.amount)] as [ReactNode, ReactNode]), ["Total Investment", money(total), true]]} />
      </section>

      <section className="break-inside-avoid">
        <Bar n="02">Printing &amp; Sales Overview</Bar>
        <Table
          rows={[
            ["Total Books Printed", num(d.printed)],
            ["Printing Cost per Book", money(d.copy.cost)],
            ["Selling Price per Book", money(d.copy.price)],
          ]}
        />
      </section>

      <section className="break-inside-avoid">
        <Bar n="03">Revenue Distribution per Book</Bar>
        <p className="mb-4 text-[0.88rem] leading-relaxed">The table below breaks down how revenue from each unit sold is allocated across the distribution vendor, printing costs, and net profit.</p>
        <Table
          head={["Description", "Amount"]}
          rows={[
            ["Selling Price", money(d.copy.price)],
            [`Distribution Vendor Share (${d.vendorShare}%)`, money(d.copy.vendor)],
            ["Net Revenue Received", money(d.copy.net)],
            ["Printing Cost", money(d.copy.cost)],
            ["Net Profit per Book", money(d.copy.profit), true],
          ]}
        />
      </section>

      <section className="break-inside-avoid">
        <Bar n="04">{d.cumulative ? "Current Sales Performance" : "Sales Performance for the Period"}</Bar>
        <p className="mb-4 text-[0.88rem] leading-relaxed">
          Figures below reflect {d.cumulative ? "cumulative " : ""}sales activity for the period {fmtLong(d.start)} through {fmtLong(d.end)}.
        </p>
        <Table
          rows={[
            ["Books Sold", num(f.units)],
            ["Total Sales Revenue", money(f.gross)],
            [`Distribution Vendor Share (${d.vendorShare}%)`, money(f.vendor)],
            ["Net Revenue Received", money(f.net)],
            [`Printing Cost for ${num(f.units)} ${f.units === 1 ? "Book" : "Books"}`, money(f.cost)],
            ["Total Net Profit Generated", money(f.profit), true],
          ]}
        />
      </section>

      <section className="break-inside-avoid">
        <Bar n="05">Profit Distribution</Bar>
        <p className="mb-4 text-[0.88rem] leading-relaxed">
          {equal
            ? `Since ${joined} contributed equally toward the printing investment, net profit generated ${d.cumulative ? "to date" : "in this period"} is divided equally between the parties.`
            : `Net profit generated ${d.cumulative ? "to date" : "in this period"} is divided according to the agreed shares.`}
        </p>
        <table className="w-full border-collapse text-[0.86rem]">
          <thead>
            <tr className="bg-[#1e2a4f] text-white">
              <th className="border border-[#d7d3ca] px-3.5 py-2 text-left font-semibold">Party</th>
              <th className="border border-[#d7d3ca] px-3.5 py-2 text-right font-semibold">Investment</th>
              <th className="border border-[#d7d3ca] px-3.5 py-2 text-right font-semibold">Profit Earned</th>
            </tr>
          </thead>
          <tbody>
            {f.shares.map((s, i) => (
              <tr key={s.name} className={i % 2 === 0 ? "bg-white" : "bg-[#f3f2ef]"}>
                <td className="border border-[#d7d3ca] px-3.5 py-2">{s.name}</td>
                <td className="border border-[#d7d3ca] px-3.5 py-2 text-right tabular-nums">{money(s.investment)}</td>
                <td className="border border-[#d7d3ca] px-3.5 py-2 text-right font-bold text-[#1e2a4f] tabular-nums">{money(s.profit)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="break-inside-avoid">
        <Bar n="06">Summary</Bar>
        <p className="text-[0.88rem] leading-relaxed">
          As of the sale of {books} during the period {fmtLong(d.start)} – {fmtLong(d.end)}, the project has generated a total net profit of {money(f.profit)}.
          {equal ? " Based on the equal investment made by both parties, profit has been distributed as follows:" : " Profit has been distributed as follows:"}
        </p>
        <div className="mt-4 border-2 border-[#c9a227] bg-[#f6efdc] px-5 py-4 text-[0.92rem]">
          {f.shares.map((s) => (
            <p key={s.name}>
              <strong className="text-[#1e2a4f]">{possessive(s.name)} Profit:</strong> {money(s.profit)}
            </p>
          ))}
        </div>
        <p className="mt-6 text-[0.88rem] leading-relaxed italic">This report reflects the current financial position based on the sale of {books} and will continue to be updated as additional book sales occur.</p>
        {d.notes && <p className="mt-4 text-[0.88rem] leading-relaxed whitespace-pre-line">{d.notes}</p>}
        <p className="mt-8 text-[0.85rem] text-[#666]">Prepared by {d.preparedBy || d.publisher}</p>
      </section>

      <footer className="mt-10 border-t border-[#ddd] pt-2 text-center text-[0.65rem] text-[#888]">{d.publisher || d.author}</footer>
    </article>
  );
}
