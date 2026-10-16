import { useMemo, useRef, useState, type ReactNode } from "react";
import { Database, Download, HardDrive, KeyRound, Lock, RefreshCw, Sparkles, Trash2, Upload } from "lucide-react";
import { storageBytes, useStore } from "../../lib/store";
import { hashPasscode, newSalt } from "../../lib/passcode";
import { download } from "../../lib/csv";
import { isoDay, num } from "../../lib/format";
import { CURRENCIES, DEFAULT_ROYALTY, FORMATS } from "../../data/constants";
import { clearDemoData, hasDemoData, loadDemoData } from "../../data/demo";
import { ALL_STORES, DEFAULT_SETTINGS, eventsStore, exportBackup, importBackup, salesStore, settingsStore } from "../../data/stores";
import { Progress } from "../charts";
import { Button, Card, Field, Input, Modal, PageHeader, Select, useFeedback } from "../ui";
import { useAccount } from "../account";

const QUOTA = 5 * 1024 * 1024; // typical per-site localStorage allowance

export default function Settings({ onLock }: { onLock: () => void }) {
  const account = useAccount();
  const settings = useStore(settingsStore);
  const sales = useStore(salesStore);
  const events = useStore(eventsStore);
  const { toast, confirm } = useFeedback();
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    ownerName: settings.ownerName,
    currency: settings.currency,
    royaltyRates: Object.fromEntries(FORMATS.map((f) => [f, String(settings.royaltyRates[f] ?? DEFAULT_ROYALTY[f])])) as Record<string, string>,
  });
  const [pass, setPass] = useState({ current: "", next: "", confirm: "" });
  const [passError, setPassError] = useState("");
  const [erase, setErase] = useState(false);
  const [eraseText, setEraseText] = useState("");
  // re-measured whenever the collections it reflects change (they're read above via useStore)
  const bytes = useMemo(() => storageBytes(), [settings, sales, events]); // eslint-disable-line react-hooks/exhaustive-deps

  const saveBusiness = () => {
    const royaltyRates = Object.fromEntries(Object.entries(form.royaltyRates).map(([k, v]) => [k, Math.min(100, Math.max(0, Number(v) || 0))]));
    settingsStore.set((s) => ({ ...s, ownerName: form.ownerName.trim(), currency: form.currency, royaltyRates }));
    toast("Settings saved");
  };

  const changePass = async () => {
    setPassError("");
    if ((await hashPasscode(pass.current, settings.passSalt)) !== settings.passHash) return setPassError("Your current passcode isn't right.");
    if (pass.next.length < 4) return setPassError("Use at least 4 characters.");
    if (pass.next !== pass.confirm) return setPassError("The new passcodes don't match.");
    const salt = newSalt();
    const hash = await hashPasscode(pass.next, salt);
    settingsStore.set((s) => ({ ...s, passHash: hash, passSalt: salt }));
    setPass({ current: "", next: "", confirm: "" });
    toast("Passcode changed");
  };

  const restore = async (file: File) => {
    try {
      const json = JSON.parse(await file.text());
      if (!(await confirm({ title: "Restore this backup?", body: `It replaces the dashboard's current data with the backup from ${json?.exportedAt ? new Date(json.exportedAt).toLocaleString() : "the file"}. Your passcode stays the same.`, confirmLabel: "Restore", danger: true }))) return;
      const n = importBackup(json);
      toast(`Backup restored (${n} collections)`);
    } catch (e) {
      toast(e instanceof Error ? e.message : "Couldn't read that file.", "bad");
    }
  };

  const eraseAll = () => {
    const { passHash, passSalt } = settingsStore.get();
    ALL_STORES.forEach((s) => s.reset());
    settingsStore.set({ ...DEFAULT_SETTINGS, passHash, passSalt });
    setErase(false);
    setEraseText("");
    toast("Everything erased. The website is back to its original content.", "info");
  };

  const demo = hasDemoData();

  return (
    <div className="space-y-4">
      <PageHeader title="Settings" subtitle="Targets, royalty assumptions, security and your data. The publishing deal itself lives under Profit & split." />

      <Section icon={<Sparkles className="h-5 w-5" />} title="Business" description="Used for greetings, money formatting, monthly goals and the default net earnings on each sale.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Your name (for the greeting)">{(id) => <Input id={id} value={form.ownerName} onChange={(e) => setForm({ ...form, ownerName: e.target.value })} />}</Field>
          <Field label="Currency">
            {(id) => (
              <Select id={id} value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}>
                {CURRENCIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </Select>
            )}
          </Field>
        </div>
        <p className="mt-6 mb-3 text-sm font-medium text-star">Net received by format, for sales outside the printing deal (% of the sale price)</p>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {FORMATS.map((f) => (
            <Field key={f} label={f}>
              {(id) => (
                <Input id={id} type="number" min={0} max={100} value={form.royaltyRates[f]} onChange={(e) => setForm({ ...form, royaltyRates: { ...form.royaltyRates, [f]: e.target.value } })} />
              )}
            </Field>
          ))}
        </div>
        <p className="mt-3 text-xs text-haze">These pre-fill the net received on eBook and audio sales (KDP eBooks are typically 70% or 35%). Printed copies use the distributor share and printing cost set under Profit & split and Print & stock. Any single sale can be overridden.</p>
        <div className="mt-5">
          <Button variant="primary" onClick={saveBusiness}>
            Save settings
          </Button>
        </div>
      </Section>

      {account ? <AccountSection /> : (
        <Section icon={<KeyRound className="h-5 w-5" />} title="Security" description="The passcode keeps the dashboard private. Change the starting passcode after your first sign-in — a new one is saved for this browser as a salted hash.">
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Current passcode">{(id) => <Input id={id} type="password" autoComplete="current-password" value={pass.current} onChange={(e) => setPass({ ...pass, current: e.target.value })} />}</Field>
            <Field label="New passcode">{(id) => <Input id={id} type="password" autoComplete="new-password" value={pass.next} onChange={(e) => setPass({ ...pass, next: e.target.value })} />}</Field>
            <Field label="Confirm new passcode" error={passError}>
              {(id) => <Input id={id} type="password" autoComplete="new-password" value={pass.confirm} onChange={(e) => setPass({ ...pass, confirm: e.target.value })} />}
            </Field>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button variant="primary" onClick={changePass} disabled={!pass.current || !pass.next}>
              Change passcode
            </Button>
            <Button onClick={onLock}>
              <Lock className="h-4 w-4" /> Lock now
            </Button>
          </div>
        </Section>
      )}

      <Section
        icon={<Database className="h-5 w-5" />}
        title="Your data"
        description={
          account
            ? `Saved in your Supabase database (${account.databaseHost}) and available on any device you sign in from. A backup file is still a good idea now and then.`
            : "Everything lives in this browser for now. Export a backup regularly — and before clearing your browser or switching computers."
        }
      >
        {!account && (
        <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-mist">
              <HardDrive className="h-4 w-4" /> Browser storage used
            </span>
            <span className="text-star tabular-nums">
              {(bytes / 1024).toFixed(0)} KB of ~{(QUOTA / 1024 / 1024).toFixed(0)} MB
            </span>
          </div>
          <Progress value={bytes / QUOTA} label="Storage used" />
          <p className="mt-2 text-xs text-haze">
            {num(sales.length)} sales · {num(events.length)} website events recorded
          </p>
        </div>
        )}
        <div className="mt-5 flex flex-wrap gap-2">
          <Button
            variant="primary"
            onClick={() => {
              download(`wilson-antoine-backup-${isoDay()}.json`, JSON.stringify(exportBackup(), null, 2), "application/json");
              toast("Backup downloaded");
            }}
          >
            <Download className="h-4 w-4" /> Export backup
          </Button>
          <Button onClick={() => fileRef.current?.click()}>
            <Upload className="h-4 w-4" /> Restore backup
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) restore(f);
              e.target.value = "";
            }}
          />
          {demo ? (
            <Button
              onClick={() => {
                clearDemoData();
                toast("Demo data cleared");
              }}
            >
              Clear demo data
            </Button>
          ) : (
            <Button
              onClick={() => {
                loadDemoData();
                toast("Demo data loaded");
              }}
            >
              <Sparkles className="h-4 w-4" /> Load demo data
            </Button>
          )}
          <Button
            variant="ghost"
            onClick={async () => {
              if (await confirm({ title: "Reset website engagement stats?", body: "Clears recorded visits, chapter opens and buy clicks. Sales and subscribers are untouched.", confirmLabel: "Reset stats", danger: true })) {
                eventsStore.reset();
                toast("Engagement stats reset", "info");
              }
            }}
          >
            Reset engagement stats
          </Button>
        </div>
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-400/20 bg-red-500/[0.05] p-4">
          <div>
            <p className="text-sm font-medium text-red-200">Erase everything</p>
            <p className="text-xs text-haze">Deletes all sales, reps, subscribers and website edits {account ? "from the database" : "on this device"}.</p>
          </div>
          <Button variant="danger" onClick={() => setErase(true)}>
            <Trash2 className="h-4 w-4" /> Erase…
          </Button>
        </div>
      </Section>

      <Modal
        open={erase}
        onClose={() => setErase(false)}
        title="Erase all dashboard data?"
        footer={
          <>
            <Button variant="ghost" onClick={() => setErase(false)}>
              Cancel
            </Button>
            <Button variant="danger" disabled={eraseText !== "ERASE"} onClick={eraseAll}>
              Erase everything
            </Button>
          </>
        }
      >
        <p>
          This can't be undone{account ? " — it also deletes every record in the database, for every device" : ""}. Export a backup first if you might need it. Type <strong className="text-star">ERASE</strong> to confirm.
        </p>
        <Input className="mt-4" value={eraseText} onChange={(e) => setEraseText(e.target.value)} aria-label="Type ERASE to confirm" autoFocus />
      </Modal>
    </div>
  );
}

function Section({ icon, title, description, children }: { icon: ReactNode; title: string; description: string; children: ReactNode }) {
  return (
    <Card className="p-5 md:p-7">
      <div className="mb-6 flex items-start gap-4">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gold/15 text-gold">{icon}</span>
        <div>
          <h2 className="font-semibold text-star">{title}</h2>
          <p className="mt-0.5 text-sm text-mist">{description}</p>
        </div>
      </div>
      {children}
    </Card>
  );
}

/** Database mode: the signed-in account, a password of its own, and a manual "sync now". */
function AccountSection() {
  const account = useAccount()!;
  const { toast } = useFeedback();
  const [pw, setPw] = useState({ next: "", confirm: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const save = async () => {
    setError("");
    if (pw.next.length < 8) return setError("Use at least 8 characters.");
    if (pw.next !== pw.confirm) return setError("The two passwords don't match.");
    setBusy(true);
    const problem = await account.setPassword(pw.next);
    setBusy(false);
    if (problem) return setError(problem);
    setPw({ next: "", confirm: "" });
    toast("Password saved — use it to sign in from now on");
  };
  return (
    <Section icon={<KeyRound className="h-5 w-5" />} title="Account" description={`Signed in as ${account.email}. Only addresses on the dashboard's admin list can open it.`}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="New password">{(id) => <Input id={id} type="password" autoComplete="new-password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} />}</Field>
        <Field label="Confirm new password" error={error}>
          {(id) => <Input id={id} type="password" autoComplete="new-password" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} />}
        </Field>
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        <Button variant="primary" onClick={save} disabled={busy || !pw.next}>
          Set password
        </Button>
        <Button
          onClick={async () => {
            try {
              await account.refresh();
              toast("Up to date with the database");
            } catch (err) {
              toast(err instanceof Error ? err.message : "Couldn't reach the database", "bad");
            }
          }}
        >
          <RefreshCw className="h-4 w-4" /> Sync now
        </Button>
        <Button onClick={() => void account.signOut()}>
          <Lock className="h-4 w-4" /> Sign out
        </Button>
      </div>
    </Section>
  );
}
