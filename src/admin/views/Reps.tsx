import { useState } from "react";
import { FileSpreadsheet, Mail, MapPin, Pencil, Phone, Plus, Trash2, UsersRound } from "lucide-react";
import { useStore } from "../../lib/store";
import { gross, inRange, repStats } from "../../lib/metrics";
import { num, pct } from "../../lib/format";
import { download, toCSV } from "../../lib/csv";
import { uid } from "../../lib/id";
import { leadsStore, repsStore, salesStore } from "../../data/stores";
import type { Rep } from "../../data/types";
import { useAdmin } from "../context";
import { Progress } from "../charts";
import { RangePicker, rangeLabel } from "../components";
import { Badge, Button, Card, DemoBadge, Drawer, EmptyState, Field, IconButton, Input, PageHeader, Toggle, useFeedback } from "../ui";

type RepDraft = Omit<Rep, "id" | "createdAt" | "commission" | "monthlyTarget"> & { commission: string; monthlyTarget: string };
const blank = (): RepDraft => ({ name: "", email: "", phone: "", region: "", commission: "10", monthlyTarget: "20", active: true });

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");

export default function Reps() {
  const reps = useStore(repsStore);
  const sales = useStore(salesStore);
  const leads = useStore(leadsStore);
  const { range, rangeKey, money } = useAdmin();
  const { toast, confirm } = useFeedback();
  const [editing, setEditing] = useState<Rep | null>(null);
  const [creating, setCreating] = useState(false);
  const [showInactive, setShowInactive] = useState(false);

  const stats = repStats(reps, sales, leads, range.start, range.end).filter((s) => showInactive || s.rep.active);
  const owed = stats.reduce((a, s) => a + s.commission, 0);

  const statement = (rep: Rep) => {
    const rows = sales
      .filter((s) => s.repId === rep.id && inRange(s.date, range.start, range.end))
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((s) => ({ ...s, gross: gross(s).toFixed(2), commission: ((gross(s) * rep.commission) / 100).toFixed(2), rate: `${rep.commission}%` }));
    download(
      `commission-${rep.name.replace(/\s+/g, "-").toLowerCase()}-${range.start}-to-${range.end}.csv`,
      toCSV(rows, [
        { key: "date", label: "date" },
        { key: "customer", label: "customer" },
        { key: "channel", label: "channel" },
        { key: "format", label: "format" },
        { key: "quantity", label: "quantity" },
        { key: "gross", label: "gross" },
        { key: "rate", label: "commission_rate" },
        { key: "commission", label: "commission" },
      ]),
    );
    toast(`Statement for ${rep.name} downloaded`);
  };

  const remove = async (rep: Rep) => {
    const count = sales.filter((s) => s.repId === rep.id).length;
    if (
      !(await confirm({
        title: `Remove ${rep.name}?`,
        body: count ? `Their ${num(count)} recorded sales stay in your totals but become unassigned. You can mark them inactive instead to keep the history.` : "They have no recorded sales.",
        confirmLabel: "Remove rep",
        danger: true,
      }))
    )
      return;
    repsStore.set((prev) => prev.filter((r) => r.id !== rep.id));
    salesStore.set((prev) => prev.map((s) => (s.repId === rep.id ? { ...s, repId: "" } : s)));
    leadsStore.set((prev) => prev.map((l) => (l.repId === rep.id ? { ...l, repId: "" } : l)));
    toast(`${rep.name} removed`, "info");
  };

  return (
    <div>
      <PageHeader
        title="Sales reps"
        subtitle={`Performance and commissions, ${rangeLabel(rangeKey)}. Commission is a percentage of gross sales attributed to each rep.`}
        actions={
          <>
            <RangePicker />
            <Button variant="primary" onClick={() => setCreating(true)}>
              <Plus className="h-4 w-4" /> Add rep
            </Button>
          </>
        }
      />

      {reps.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
          <Card className="flex items-center gap-6 px-5 py-4">
            <div>
              <p className="text-xs text-haze">Commission owed this period</p>
              <p className="mt-0.5 text-[1.35rem] font-semibold text-gold-light">{money(owed)}</p>
            </div>
            <div className="h-10 w-px bg-white/10" />
            <div>
              <p className="text-xs text-haze">Active reps</p>
              <p className="mt-0.5 text-[1.35rem] font-semibold text-white">{reps.filter((r) => r.active).length}</p>
            </div>
          </Card>
          <div className="w-64">
            <Toggle checked={showInactive} onChange={setShowInactive} label="Show inactive reps" />
          </div>
        </div>
      )}

      {stats.length === 0 ? (
        <Card>
          <EmptyState
            icon={<UsersRound className="h-6 w-6" />}
            title={reps.length ? "No active reps" : "No sales reps yet"}
            action={
              <Button variant="primary" onClick={() => setCreating(true)}>
                <Plus className="h-4 w-4" /> Add a rep
              </Button>
            }
          >
            Reps can be assigned to sales and pipeline opportunities. Their copies, revenue, commission and monthly target progress appear here.
          </EmptyState>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {stats.map((s, i) => (
            <Card key={s.rep.id} as="article" className={`p-5 ${s.rep.active ? "" : "opacity-60"}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className={`grid h-12 w-12 place-items-center rounded-full font-semibold ${i === 0 && s.gross > 0 ? "bg-gradient-to-br from-gold-light to-gold-deep text-void" : "border border-gold/40 bg-gold/10 text-gold-light"}`}>
                    {initials(s.rep.name)}
                  </span>
                  <div>
                    <p className="flex items-center gap-2 font-semibold text-star">
                      {s.rep.name} {s.rep.demo && <DemoBadge />} {!s.rep.active && <Badge>Inactive</Badge>}
                    </p>
                    {s.rep.region && (
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-haze">
                        <MapPin className="h-3 w-3" /> {s.rep.region}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex">
                  <IconButton label={`Download ${s.rep.name}'s commission statement`} onClick={() => statement(s.rep)}>
                    <FileSpreadsheet className="h-4 w-4" />
                  </IconButton>
                  <IconButton label={`Edit ${s.rep.name}`} onClick={() => setEditing(s.rep)}>
                    <Pencil className="h-4 w-4" />
                  </IconButton>
                  <IconButton label={`Remove ${s.rep.name}`} onClick={() => remove(s.rep)} className="hover:!text-red-300">
                    <Trash2 className="h-4 w-4" />
                  </IconButton>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-3 gap-2 text-center">
                {[
                  ["Copies", num(s.units)],
                  ["Gross", money(s.gross, true)],
                  [`Commission · ${s.rep.commission}%`, money(s.commission)],
                ].map(([l, v]) => (
                  <div key={l} className="rounded-xl bg-white/[0.03] px-2 py-3">
                    <p className="font-semibold text-star tabular-nums">{v}</p>
                    <p className="mt-0.5 text-[0.7rem] text-haze">{l}</p>
                  </div>
                ))}
              </div>

              <div className="mt-5">
                <div className="mb-1.5 flex justify-between text-xs">
                  <span className="text-mist">This month's target</span>
                  <span className="text-star tabular-nums">
                    {num(s.monthUnits)} / {num(s.rep.monthlyTarget)} copies
                  </span>
                </div>
                <Progress value={s.targetProgress} label={`${s.rep.name} monthly target`} />
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
                <Badge>{num(s.openLeads)} open opportunities</Badge>
                {s.pipelineValue > 0 && <Badge tone="gold">{money(s.pipelineValue)} in pipeline</Badge>}
                <Badge tone={s.winRate == null ? "neutral" : s.winRate >= 0.5 ? "good" : "warn"}>Win rate {s.winRate == null ? "—" : pct(s.winRate)}</Badge>
              </div>

              {(s.rep.email || s.rep.phone) && (
                <div className="mt-4 flex flex-wrap gap-4 border-t border-white/[0.05] pt-3 text-xs">
                  {s.rep.email && (
                    <a href={`mailto:${s.rep.email}`} className="inline-flex items-center gap-1.5 text-mist hover:text-gold">
                      <Mail className="h-3.5 w-3.5" /> {s.rep.email}
                    </a>
                  )}
                  {s.rep.phone && (
                    <a href={`tel:${s.rep.phone}`} className="inline-flex items-center gap-1.5 text-mist hover:text-gold">
                      <Phone className="h-3.5 w-3.5" /> {s.rep.phone}
                    </a>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      <RepEditor
        open={creating || !!editing}
        rep={editing}
        onClose={() => {
          setCreating(false);
          setEditing(null);
        }}
      />
    </div>
  );
}

function RepEditor(props: { open: boolean; rep: Rep | null; onClose: () => void }) {
  return props.open ? <RepForm key={props.rep?.id ?? "new"} rep={props.rep} onClose={props.onClose} /> : null;
}

function RepForm({ rep, onClose }: { rep: Rep | null; onClose: () => void }) {
  const { toast } = useFeedback();
  const [d, setD] = useState<RepDraft>(() => (rep ? { ...rep, commission: String(rep.commission), monthlyTarget: String(rep.monthlyTarget) } : blank()));
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = <K extends keyof RepDraft>(k: K, v: RepDraft[K]) => setD((p) => ({ ...p, [k]: v }));
  const save = () => {
    const e: Record<string, string> = {};
    const commission = Number(d.commission);
    const target = Number(d.monthlyTarget);
    if (!d.name.trim()) e.name = "Enter the rep's name.";
    if (!Number.isFinite(commission) || commission < 0 || commission > 100) e.commission = "Between 0 and 100.";
    if (!Number.isFinite(target) || target < 0) e.monthlyTarget = "0 or more.";
    setErrors(e);
    if (Object.keys(e).length) return;
    const record: Rep = { ...d, name: d.name.trim(), commission, monthlyTarget: Math.round(target), id: rep?.id ?? uid("rep_"), createdAt: rep?.createdAt ?? Date.now(), demo: rep?.demo };
    repsStore.set((prev) => (rep ? prev.map((r) => (r.id === rep.id ? record : r)) : [...prev, record]));
    toast(rep ? "Rep updated" : `${record.name} added`);
    onClose();
  };

  return (
    <Drawer
      open
      onClose={onClose}
      title={rep ? "Edit sales rep" : "Add a sales rep"}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={save}>
            {rep ? "Save changes" : "Add rep"}
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
        <Field label="Full name" error={errors.name} className="col-span-2">
          {(id) => <Input id={id} value={d.name} onChange={(e) => set("name", e.target.value)} />}
        </Field>
        <Field label="Region / focus" className="col-span-2">
          {(id) => <Input id={id} value={d.region} placeholder="e.g. Northeast churches, online & media" onChange={(e) => set("region", e.target.value)} />}
        </Field>
        <Field label="Email">
          {(id) => <Input id={id} type="email" value={d.email} onChange={(e) => set("email", e.target.value)} />}
        </Field>
        <Field label="Phone">
          {(id) => <Input id={id} type="tel" value={d.phone} onChange={(e) => set("phone", e.target.value)} />}
        </Field>
        <Field label="Commission (% of gross)" error={errors.commission}>
          {(id) => <Input id={id} type="number" min={0} max={100} step="0.5" value={d.commission} onChange={(e) => set("commission", e.target.value)} />}
        </Field>
        <Field label="Monthly target (copies)" error={errors.monthlyTarget}>
          {(id) => <Input id={id} type="number" min={0} value={d.monthlyTarget} onChange={(e) => set("monthlyTarget", e.target.value)} />}
        </Field>
        <div className="col-span-2 rounded-xl border border-white/[0.07] p-4">
          <Toggle checked={d.active} onChange={(v) => set("active", v)} label="Active" description="Inactive reps keep their history but drop off the leaderboard." />
        </div>
        <button type="submit" className="hidden" />
      </form>
    </Drawer>
  );
}
