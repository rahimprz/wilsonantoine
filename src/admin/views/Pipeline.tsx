import { useMemo, useState, type DragEvent } from "react";
import { CalendarClock, GripVertical, Handshake, Mail, Pencil, Phone, Plus, Trash2 } from "lucide-react";
import { useStore } from "../../lib/store";
import { pipeline } from "../../lib/metrics";
import { isoDay, num, pct, relativeDays } from "../../lib/format";
import { uid } from "../../lib/id";
import { LEAD_TYPES, STAGES, STAGE_LABEL } from "../../data/constants";
import { leadsStore, repsStore } from "../../data/stores";
import type { Lead, LeadStage } from "../../data/types";
import { useAdmin } from "../context";
import { SaleEditor } from "../components";
import { Badge, Button, Card, DemoBadge, Drawer, Field, IconButton, Input, PageHeader, Select, Textarea, useFeedback } from "../ui";

const STAGE_ACCENT: Record<LeadStage, string> = {
  prospect: "bg-white/30",
  contacted: "bg-[#3f86ee]",
  negotiating: "bg-gold",
  won: "bg-[#0ca30c]",
  lost: "bg-[#d03b3b]",
};

type LeadDraft = Omit<Lead, "id" | "createdAt" | "updatedAt" | "units" | "value"> & { units: string; value: string };
const blank = (): LeadDraft => ({ org: "", contact: "", email: "", phone: "", type: LEAD_TYPES[0], stage: "prospect", units: "", value: "", repId: "", followUp: "", notes: "" });

export default function Pipeline() {
  const leads = useStore(leadsStore);
  const reps = useStore(repsStore);
  const { money } = useAdmin();
  const { toast, confirm } = useFeedback();
  const [editing, setEditing] = useState<Lead | null>(null);
  const [creating, setCreating] = useState<LeadStage | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overStage, setOverStage] = useState<LeadStage | null>(null);
  const [repFilter, setRepFilter] = useState("");
  const [saleFromLead, setSaleFromLead] = useState<Lead | null>(null);

  const visible = useMemo(() => leads.filter((l) => !repFilter || l.repId === repFilter), [leads, repFilter]);
  const stats = pipeline(visible);
  const repName = (id: string) => reps.find((r) => r.id === id)?.name ?? "Unassigned";
  const today = isoDay();

  const moveTo = async (lead: Lead, stage: LeadStage) => {
    if (lead.stage === stage) return;
    leadsStore.set((prev) => prev.map((l) => (l.id === lead.id ? { ...l, stage, updatedAt: Date.now(), followUp: stage === "won" || stage === "lost" ? "" : l.followUp } : l)));
    if (stage === "won") {
      const record = lead.units > 0 && (await confirm({ title: `Won — ${lead.org}!`, body: `Record ${num(lead.units)} copies for ${money(lead.value)} as a sale now?`, confirmLabel: "Record the sale" }));
      if (record) setSaleFromLead(lead);
      else toast(`${lead.org} marked as won`);
    } else toast(`${lead.org} → ${STAGE_LABEL[stage]}`, "info");
  };

  const remove = async (lead: Lead) => {
    if (!(await confirm({ title: `Delete ${lead.org}?`, body: "This removes the opportunity and its notes.", confirmLabel: "Delete", danger: true }))) return;
    leadsStore.set((prev) => prev.filter((l) => l.id !== lead.id));
    toast("Opportunity deleted", "info", { label: "Undo", run: () => leadsStore.set((prev) => [...prev, lead]) });
  };

  const onDrop = (e: DragEvent, stage: LeadStage) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain") || dragId;
    const lead = leads.find((l) => l.id === id);
    setDragId(null);
    setOverStage(null);
    if (lead) moveTo(lead, stage);
  };

  return (
    <div>
      <PageHeader
        title="Pipeline"
        subtitle="Bulk and institutional opportunities — bookstores, libraries, churches, hospices, events and media."
        actions={
          <>
            <Select value={repFilter} onChange={(e) => setRepFilter(e.target.value)} className="!w-auto !py-2 text-sm" aria-label="Filter by rep">
              <option value="">All reps</option>
              {reps.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </Select>
            <Button variant="primary" onClick={() => setCreating("prospect")}>
              <Plus className="h-4 w-4" /> New opportunity
            </Button>
          </>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          ["Open opportunities", num(stats.openCount)],
          ["Open pipeline value", money(stats.openValue)],
          ["Weighted forecast", money(stats.weighted)],
          ["Win rate", stats.winRate == null ? "—" : pct(stats.winRate)],
        ].map(([l, v]) => (
          <Card key={l} className="px-5 py-4">
            <p className="text-xs text-haze">{l}</p>
            <p className="mt-1 text-[1.35rem] font-semibold text-white tabular-nums">{v}</p>
          </Card>
        ))}
      </div>

      <div className="-mx-4 overflow-x-auto px-4 pb-4 md:-mx-8 md:px-8">
        <div className="grid min-w-[1100px] grid-cols-5 gap-3">
          {STAGES.map((stage) => {
            const items = visible.filter((l) => l.stage === stage.id).sort((a, b) => (a.followUp || "9999").localeCompare(b.followUp || "9999"));
            const total = items.reduce((a, l) => a + l.value, 0);
            return (
              <section
                key={stage.id}
                aria-label={`${stage.label} column`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setOverStage(stage.id);
                }}
                onDragLeave={() => setOverStage((s) => (s === stage.id ? null : s))}
                onDrop={(e) => onDrop(e, stage.id)}
                className={`flex min-h-[420px] flex-col rounded-2xl border bg-[#0b1029] p-3 transition ${overStage === stage.id ? "border-gold/60 bg-gold/[0.04]" : "border-white/[0.06]"}`}
              >
                <header className="mb-3 flex items-center justify-between px-1">
                  <span className="flex items-center gap-2 text-sm font-semibold text-star">
                    <span className={`h-2 w-2 rounded-full ${STAGE_ACCENT[stage.id]}`} />
                    {stage.label}
                    <span className="rounded-md bg-white/[0.06] px-1.5 text-xs font-normal text-mist">{items.length}</span>
                  </span>
                  <span className="text-xs text-haze tabular-nums">{money(total, true)}</span>
                </header>
                <div className="flex flex-1 flex-col gap-2.5">
                  {items.map((l) => {
                    const overdue = l.followUp && l.followUp < today;
                    return (
                      <article
                        key={l.id}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData("text/plain", l.id);
                          e.dataTransfer.effectAllowed = "move";
                          setDragId(l.id);
                        }}
                        onDragEnd={() => {
                          setDragId(null);
                          setOverStage(null);
                        }}
                        className={`group cursor-grab rounded-xl border border-white/[0.07] bg-[#0e1430] p-3.5 transition hover:border-white/20 active:cursor-grabbing ${dragId === l.id ? "opacity-40" : ""}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="line-clamp-2 font-medium leading-snug text-star">{l.org}</p>
                            <p className="mt-0.5 flex items-center gap-1.5 text-xs text-haze">
                              {l.type} {l.demo && <DemoBadge />}
                            </p>
                          </div>
                          <GripVertical className="h-4 w-4 shrink-0 text-haze opacity-0 transition group-hover:opacity-100" aria-hidden />
                        </div>
                        <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs">
                          {l.value > 0 && <Badge tone="gold">{money(l.value)}</Badge>}
                          {l.units > 0 && <Badge>{num(l.units)} copies</Badge>}
                          {l.followUp && (
                            <Badge tone={overdue ? "bad" : "neutral"}>
                              <CalendarClock className="h-3 w-3" />
                              {relativeDays(l.followUp)}
                            </Badge>
                          )}
                        </div>
                        <div className="mt-3 flex items-center justify-between border-t border-white/[0.05] pt-2.5">
                          <span className="truncate text-xs text-mist">{repName(l.repId)}</span>
                          <div className="flex gap-0.5">
                            {l.email && (
                              <a href={`mailto:${l.email}`} className="grid h-7 w-7 place-items-center rounded-md text-haze hover:bg-white/[0.07] hover:text-star" aria-label={`Email ${l.contact || l.org}`}>
                                <Mail className="h-3.5 w-3.5" />
                              </a>
                            )}
                            {l.phone && (
                              <a href={`tel:${l.phone}`} className="grid h-7 w-7 place-items-center rounded-md text-haze hover:bg-white/[0.07] hover:text-star" aria-label={`Call ${l.contact || l.org}`}>
                                <Phone className="h-3.5 w-3.5" />
                              </a>
                            )}
                            <IconButton label={`Edit ${l.org}`} onClick={() => setEditing(l)} className="!h-7 !w-7">
                              <Pencil className="h-3.5 w-3.5" />
                            </IconButton>
                            <IconButton label={`Delete ${l.org}`} onClick={() => remove(l)} className="!h-7 !w-7 hover:!text-red-300">
                              <Trash2 className="h-3.5 w-3.5" />
                            </IconButton>
                          </div>
                        </div>
                        {/* keyboard / touch alternative to dragging */}
                        <label className="mt-2 block">
                          <span className="sr-only">Move {l.org} to stage</span>
                          <select
                            value={l.stage}
                            onChange={(e) => moveTo(l, e.target.value as LeadStage)}
                            className="w-full cursor-pointer rounded-md bg-transparent py-1 text-xs text-haze hover:text-mist focus:text-star focus:outline-none"
                          >
                            {STAGES.map((s) => (
                              <option key={s.id} value={s.id} className="bg-[#0b1029]">
                                Move to {s.label}
                              </option>
                            ))}
                          </select>
                        </label>
                      </article>
                    );
                  })}
                  <button
                    onClick={() => setCreating(stage.id)}
                    className="mt-auto flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-white/10 py-2.5 text-xs text-haze transition hover:border-gold/40 hover:text-gold"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add
                  </button>
                </div>
              </section>
            );
          })}
        </div>
      </div>

      <LeadEditor
        open={!!creating || !!editing}
        lead={editing}
        initialStage={creating ?? "prospect"}
        onClose={() => {
          setCreating(null);
          setEditing(null);
        }}
        onWon={(lead) => moveTo({ ...lead, stage: "prospect" }, "won")}
      />
      <SaleEditor
        open={!!saleFromLead}
        onClose={() => setSaleFromLead(null)}
        preset={
          saleFromLead
            ? {
                channel: "Bulk / institutional",
                format: "Paperback",
                quantity: String(saleFromLead.units),
                unitPrice: saleFromLead.units ? (saleFromLead.value / saleFromLead.units).toFixed(2) : "",
                repId: saleFromLead.repId,
                customer: saleFromLead.org,
                notes: `From pipeline: ${saleFromLead.type}`,
              }
            : undefined
        }
      />
      {leads.length === 0 && (
        <p className="mt-2 flex items-center gap-2 text-sm text-haze">
          <Handshake className="h-4 w-4 text-gold" /> Tip: drag cards between columns as conversations progress. Moving one to Won offers to record the sale.
        </p>
      )}
    </div>
  );
}

interface LeadEditorProps {
  open: boolean;
  lead: Lead | null;
  initialStage: LeadStage;
  onClose: () => void;
  onWon: (l: Lead) => void;
}

function LeadEditor(props: LeadEditorProps) {
  return props.open ? <LeadForm key={props.lead?.id ?? `new-${props.initialStage}`} {...props} /> : null;
}

function LeadForm({ lead, initialStage, onClose, onWon }: LeadEditorProps) {
  const reps = useStore(repsStore);
  const { toast } = useFeedback();
  const [d, setD] = useState<LeadDraft>(() =>
    lead ? { ...lead, units: lead.units ? String(lead.units) : "", value: lead.value ? String(lead.value) : "" } : { ...blank(), stage: initialStage },
  );
  const [error, setError] = useState("");

  const set = <K extends keyof LeadDraft>(k: K, v: LeadDraft[K]) => setD((p) => ({ ...p, [k]: v }));
  const save = () => {
    if (!d.org.trim()) return setError("Give the opportunity a name.");
    const units = Math.max(0, Math.round(Number(d.units) || 0));
    const value = Math.max(0, Number(d.value) || 0);
    const now = Date.now();
    const record: Lead = { ...d, org: d.org.trim(), units, value, id: lead?.id ?? uid("l_"), createdAt: lead?.createdAt ?? now, updatedAt: now, demo: lead?.demo };
    const becameWon = record.stage === "won" && lead?.stage !== "won";
    if (becameWon) {
      // let the board run its "won" flow (offers to record the sale)
      leadsStore.set((prev) => (lead ? prev.map((l) => (l.id === lead.id ? { ...record, stage: lead.stage } : l)) : [...prev, { ...record, stage: "prospect" }]));
      onClose();
      onWon(record);
      return;
    }
    leadsStore.set((prev) => (lead ? prev.map((l) => (l.id === lead.id ? record : l)) : [...prev, record]));
    toast(lead ? "Opportunity updated" : `${record.org} added to ${STAGE_LABEL[record.stage]}`);
    onClose();
  };

  return (
    <Drawer
      open
      onClose={onClose}
      title={lead ? "Edit opportunity" : "New opportunity"}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={save}>
            {lead ? "Save changes" : "Add opportunity"}
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
        <Field label="Organisation" error={error} className="col-span-2">
          {(id) => <Input id={id} value={d.org} placeholder="e.g. Riverside Public Library" onChange={(e) => set("org", e.target.value)} />}
        </Field>
        <Field label="Type">
          {(id) => (
            <Select id={id} value={d.type} onChange={(e) => set("type", e.target.value)}>
              {LEAD_TYPES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Stage">
          {(id) => (
            <Select id={id} value={d.stage} onChange={(e) => set("stage", e.target.value as LeadStage)}>
              {STAGES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Estimated copies">
          {(id) => <Input id={id} type="number" min={0} inputMode="numeric" value={d.units} onChange={(e) => set("units", e.target.value)} />}
        </Field>
        <Field label="Estimated value">
          {(id) => <Input id={id} type="number" min={0} step="0.01" inputMode="decimal" value={d.value} onChange={(e) => set("value", e.target.value)} />}
        </Field>
        <Field label="Contact person">
          {(id) => <Input id={id} value={d.contact} onChange={(e) => set("contact", e.target.value)} />}
        </Field>
        <Field label="Assigned rep">
          {(id) => (
            <Select id={id} value={d.repId} onChange={(e) => set("repId", e.target.value)}>
              <option value="">Unassigned</option>
              {reps.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Email">
          {(id) => <Input id={id} type="email" value={d.email} onChange={(e) => set("email", e.target.value)} />}
        </Field>
        <Field label="Phone">
          {(id) => <Input id={id} type="tel" value={d.phone} onChange={(e) => set("phone", e.target.value)} />}
        </Field>
        <Field label="Next follow-up" className="col-span-2" hint="Shows on the overview when it's due.">
          {(id) => <Input id={id} type="date" value={d.followUp} onChange={(e) => set("followUp", e.target.value)} />}
        </Field>
        <Field label="Notes" className="col-span-2">
          {(id) => <Textarea id={id} value={d.notes} onChange={(e) => set("notes", e.target.value)} />}
        </Field>
        <button type="submit" className="hidden" />
      </form>
    </Drawer>
  );
}
