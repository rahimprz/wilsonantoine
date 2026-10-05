import { useMemo, useState } from "react";
import { ClipboardCopy, Download, Mail, Plus, Search, Trash2 } from "lucide-react";
import { useStore } from "../../lib/store";
import { download, toCSV } from "../../lib/csv";
import { fmtDayYear, num } from "../../lib/format";
import { uid } from "../../lib/id";
import { subscribersStore } from "../../data/stores";
import type { Subscriber } from "../../data/types";
import { Badge, Button, Card, DemoBadge, EmptyState, IconButton, Input, Modal, PageHeader, useFeedback } from "../ui";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const SOURCE_LABEL: Record<Subscriber["source"], string> = { website: "Website form", excerpt: "Excerpt", manual: "Added by hand", import: "Imported" };

export default function Subscribers() {
  const subs = useStore(subscribersStore);
  const { toast, confirm } = useFeedback();
  const [query, setQuery] = useState("");
  const [adding, setAdding] = useState(false);
  const [bulk, setBulk] = useState("");

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return [...subs].filter((s) => !q || s.email.includes(q) || s.name.toLowerCase().includes(q)).sort((a, b) => b.date.localeCompare(a.date));
  }, [subs, query]);
  const last30 = subs.filter((s) => Date.now() - new Date(s.date).getTime() < 30 * 864e5).length;

  const add = () => {
    const existing = new Set(subs.map((s) => s.email.toLowerCase()));
    const found = bulk.split(/[\s,;]+/).map((e) => e.trim().toLowerCase()).filter((e) => EMAIL_RE.test(e));
    const fresh = [...new Set(found)].filter((e) => !existing.has(e));
    if (!found.length) {
      toast("No valid email addresses found.", "bad");
      return;
    }
    subscribersStore.set((prev) => [...prev, ...fresh.map((email) => ({ id: uid("sub_"), email, name: "", source: "manual" as const, date: new Date().toISOString() }))]);
    toast(fresh.length ? `Added ${fresh.length} subscriber${fresh.length > 1 ? "s" : ""}` : "Those addresses are already on the list", fresh.length ? "good" : "info");
    setBulk("");
    setAdding(false);
  };

  const remove = async (s: Subscriber) => {
    if (!(await confirm({ title: "Remove subscriber?", body: s.email, confirmLabel: "Remove", danger: true }))) return;
    subscribersStore.set((prev) => prev.filter((x) => x.id !== s.id));
    toast("Subscriber removed", "info", { label: "Undo", run: () => subscribersStore.set((prev) => [...prev, s]) });
  };

  return (
    <div>
      <PageHeader
        title="Subscribers"
        subtitle="Readers who joined the newsletter from the website footer. Export them to your email tool (Mailchimp, Kit, etc.)."
        actions={
          <>
            <Button
              disabled={!subs.length}
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(rows.map((s) => s.email).join(", "));
                  toast(`Copied ${rows.length} email addresses`);
                } catch {
                  toast("Couldn't access the clipboard", "bad");
                }
              }}
            >
              <ClipboardCopy className="h-4 w-4" /> Copy emails
            </Button>
            <Button
              disabled={!subs.length}
              onClick={() => {
                download(
                  "wilson-antoine-subscribers.csv",
                  toCSV(
                    rows.map((s) => ({ ...s, date: s.date.slice(0, 10), source: SOURCE_LABEL[s.source] })),
                    [
                      { key: "email", label: "email" },
                      { key: "name", label: "name" },
                      { key: "source", label: "source" },
                      { key: "date", label: "joined" },
                    ],
                  ),
                );
                toast(`Exported ${rows.length} subscribers`);
              }}
            >
              <Download className="h-4 w-4" /> Export CSV
            </Button>
            <Button variant="primary" onClick={() => setAdding(true)}>
              <Plus className="h-4 w-4" /> Add
            </Button>
          </>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-3 md:max-w-md">
        <Card className="px-5 py-4">
          <p className="text-xs text-haze">Total subscribers</p>
          <p className="mt-1 text-[1.35rem] font-semibold text-white">{num(subs.length)}</p>
        </Card>
        <Card className="px-5 py-4">
          <p className="text-xs text-haze">Joined in last 30 days</p>
          <p className="mt-1 text-[1.35rem] font-semibold text-white">{num(last30)}</p>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <div className="border-b border-white/[0.05] p-4">
          <label className="relative block max-w-sm">
            <span className="sr-only">Search subscribers</span>
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-haze" />
            <Input placeholder="Search email…" value={query} onChange={(e) => setQuery(e.target.value)} className="pl-9" />
          </label>
        </div>
        {rows.length === 0 ? (
          <EmptyState icon={<Mail className="h-6 w-6" />} title={subs.length ? "No matches" : "No subscribers yet"}>
            {subs.length ? "Try another search." : "Sign-ups from the website's newsletter form appear here."}
          </EmptyState>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead className="text-left text-xs text-haze">
                <tr>
                  <th className="px-5 py-3 font-medium">Email</th>
                  <th className="px-3 py-3 font-medium">Source</th>
                  <th className="px-3 py-3 font-medium">Joined</th>
                  <th className="px-3 py-3" />
                </tr>
              </thead>
              <tbody>
                {rows.map((s) => (
                  <tr key={s.id} className="group border-t border-white/[0.05]">
                    <td className="px-5 py-3 text-star">
                      <span className="flex items-center gap-2">
                        {s.email} {s.demo && <DemoBadge />}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <Badge tone={s.source === "website" ? "gold" : "neutral"}>{SOURCE_LABEL[s.source]}</Badge>
                    </td>
                    <td className="px-3 py-3 text-mist tabular-nums">{fmtDayYear(s.date.slice(0, 10))}</td>
                    <td className="px-3 py-3 text-right">
                      <IconButton label={`Remove ${s.email}`} onClick={() => remove(s)} className="opacity-60 group-hover:opacity-100 hover:!text-red-300">
                        <Trash2 className="h-4 w-4" />
                      </IconButton>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal
        open={adding}
        onClose={() => setAdding(false)}
        title="Add subscribers"
        footer={
          <>
            <Button variant="ghost" onClick={() => setAdding(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={add}>
              Add
            </Button>
          </>
        }
      >
        <p className="mb-3">Paste one or more email addresses — separated by commas, spaces or new lines. Duplicates are skipped.</p>
        <textarea
          autoFocus
          value={bulk}
          onChange={(e) => setBulk(e.target.value)}
          className="min-h-[120px] w-full rounded-xl border border-white/10 bg-[#080d24] p-3 text-star focus:border-gold/70 focus:outline-none"
          placeholder="reader@example.com, friend@example.com"
          aria-label="Email addresses"
        />
      </Modal>
    </div>
  );
}
