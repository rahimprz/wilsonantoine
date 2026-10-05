import { useEffect, useState, type FormEvent } from "react";
import { NavLink, Route, Routes, useLocation } from "react-router-dom";
import {
  ExternalLink,
  Globe,
  KeyRound,
  LayoutDashboard,
  Lock,
  Mail,
  Menu,
  Receipt,
  Settings as SettingsIcon,
  SquareKanban,
  UsersRound,
  X,
} from "lucide-react";
import { onStorageError, useStore } from "../lib/store";
import { hashPasscode, isUnlocked, newSalt, setUnlocked } from "../lib/passcode";
import { resolveMedia } from "../lib/media";
import { clearDemoData, hasDemoData } from "../data/demo";
import { contentStore, eventsStore, leadsStore, repsStore, salesStore, settingsStore, subscribersStore } from "../data/stores";
import { AdminProvider } from "./context";
import { Button, FeedbackProvider, Input, useFeedback } from "./ui";
import Overview from "./views/Overview";
import Sales from "./views/Sales";
import Pipeline from "./views/Pipeline";
import Reps from "./views/Reps";
import Subscribers from "./views/Subscribers";
import Website from "./views/Website";
import Settings from "./views/Settings";

const NAV = [
  { to: "/admin", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/admin/sales", label: "Sales", icon: Receipt },
  { to: "/admin/pipeline", label: "Pipeline", icon: SquareKanban },
  { to: "/admin/reps", label: "Sales reps", icon: UsersRound },
  { to: "/admin/subscribers", label: "Subscribers", icon: Mail },
  { to: "/admin/website", label: "Website", icon: Globe },
  { to: "/admin/settings", label: "Settings", icon: SettingsIcon },
];

export default function Admin() {
  const [unlocked, setUnlockedState] = useState(isUnlocked);

  useEffect(() => {
    document.title = "Dashboard — Wilson Antoine";
    document.documentElement.style.overflow = "";
  }, []);

  if (!unlocked) {
    return (
      <LockScreen
        onUnlock={() => {
          setUnlocked(true);
          setUnlockedState(true);
        }}
      />
    );
  }
  return (
    <FeedbackProvider>
      <AdminProvider>
        <Shell
          onLock={() => {
            setUnlocked(false);
            setUnlockedState(false);
          }}
        />
      </AdminProvider>
    </FeedbackProvider>
  );
}

// ---------------------------------------------------------------- lock screen

function LockScreen({ onUnlock }: { onUnlock: () => void }) {
  const settings = useStore(settingsStore);
  const content = useStore(contentStore);
  const creating = !settings.passHash;
  const [pass, setPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [fails, setFails] = useState(0);
  const [waitUntil, setWaitUntil] = useState(0);
  const [, force] = useState(0);

  useEffect(() => {
    if (!waitUntil) return;
    const t = setInterval(() => (Date.now() >= waitUntil ? (setWaitUntil(0), setError("")) : force((n) => n + 1)), 500);
    return () => clearInterval(t);
  }, [waitUntil]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (waitUntil) return;
    setError("");
    if (creating) {
      if (pass.length < 4) return setError("Use at least 4 characters.");
      if (pass !== confirm) return setError("The two passcodes don't match.");
      setBusy(true);
      const salt = newSalt();
      const hash = await hashPasscode(pass, salt);
      settingsStore.set((s) => ({ ...s, passHash: hash, passSalt: salt }));
      onUnlock();
      return;
    }
    setBusy(true);
    const hash = await hashPasscode(pass, settings.passSalt);
    setBusy(false);
    if (hash === settings.passHash) return onUnlock();
    const n = fails + 1;
    setFails(n);
    setPass("");
    if (n % 5 === 0) {
      setWaitUntil(Date.now() + 30_000);
      setError("Too many attempts. Try again in 30 seconds.");
    } else setError("That passcode isn't right.");
  };

  const secondsLeft = waitUntil ? Math.ceil((waitUntil - Date.now()) / 1000) : 0;

  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden bg-void px-4">
      <div className="absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_30%,rgba(24,54,165,0.35),transparent_70%)]" />
      <form onSubmit={submit} className="relative w-full max-w-sm rounded-3xl border border-white/10 bg-[#0b1029]/90 p-8 shadow-2xl backdrop-blur">
        <img src={resolveMedia(content.brand.logo)} alt={content.brand.name} className="mx-auto h-14 w-auto" onError={(e) => (e.currentTarget.style.display = "none")} />
        <div className="mx-auto mt-6 grid h-12 w-12 place-items-center rounded-2xl bg-gold/15 text-gold">
          <KeyRound className="h-6 w-6" />
        </div>
        <h1 className="mt-4 text-center font-display text-xl font-semibold text-white">{creating ? "Set up your dashboard" : "Welcome back"}</h1>
        <p className="mt-2 text-center text-sm text-mist">
          {creating ? "Choose a passcode to keep the sales dashboard private on this device." : "Enter your passcode to open the dashboard."}
        </p>
        <div className="mt-6 space-y-3">
          <Input type="password" autoFocus autoComplete={creating ? "new-password" : "current-password"} placeholder="Passcode" value={pass} onChange={(e) => setPass(e.target.value)} aria-label="Passcode" disabled={!!waitUntil} />
          {creating && <Input type="password" autoComplete="new-password" placeholder="Confirm passcode" value={confirm} onChange={(e) => setConfirm(e.target.value)} aria-label="Confirm passcode" />}
        </div>
        {error && (
          <p className="mt-3 text-sm text-red-300" role="alert">
            {error}
            {secondsLeft > 0 && ` (${secondsLeft}s)`}
          </p>
        )}
        <Button type="submit" variant="primary" className="mt-6 w-full" disabled={busy || !!waitUntil}>
          {creating ? "Create passcode & continue" : "Unlock"}
        </Button>
        <p className="mt-6 text-center text-xs leading-relaxed text-haze">
          Records are saved in this browser until the dashboard is connected to a server. Export a backup from Settings anytime.
        </p>
        <a href="/" className="mt-4 block text-center text-xs text-mist hover:text-gold">
          ← Back to the website
        </a>
      </form>
    </div>
  );
}

// ---------------------------------------------------------------- shell

function Shell({ onLock }: { onLock: () => void }) {
  const [menu, setMenu] = useState(false);
  const location = useLocation();
  const { toast, confirm } = useFeedback();
  // re-render the demo banner whenever any collection changes
  useStore(salesStore);
  useStore(leadsStore);
  useStore(repsStore);
  useStore(subscribersStore);
  useStore(eventsStore);
  const demo = hasDemoData();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);
  useEffect(() => onStorageError((msg) => toast(msg, "bad")), [toast]);

  const sidebar = (
    <nav className="flex h-full flex-col gap-1 p-4" aria-label="Dashboard">
      <a href="/" className="mb-6 flex items-center gap-3 px-2 pt-1" target="_blank" rel="noopener">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-gold-light to-gold-deep font-serif text-lg font-semibold text-void">WA</span>
        <span>
          <span className="block text-sm font-semibold text-star">Wilson Antoine</span>
          <span className="block text-xs text-haze">Book sales dashboard</span>
        </span>
      </a>
      {NAV.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          onClick={() => setMenu(false)}
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-xl px-3 py-2.5 text-[0.92rem] transition ${
              isActive ? "bg-gradient-to-r from-gold/20 to-gold/[0.04] font-medium text-gold-light shadow-[inset_2px_0_0_#b59f78]" : "text-mist hover:bg-white/[0.05] hover:text-star"
            }`
          }
        >
          <Icon className="h-[18px] w-[18px]" />
          {label}
        </NavLink>
      ))}
      <div className="mt-auto space-y-1 border-t border-white/[0.06] pt-4">
        <a href="/" target="_blank" rel="noopener" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[0.92rem] text-mist transition hover:bg-white/[0.05] hover:text-star">
          <ExternalLink className="h-[18px] w-[18px]" /> View website
        </a>
        <button onClick={onLock} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[0.92rem] text-mist transition hover:bg-white/[0.05] hover:text-star">
          <Lock className="h-[18px] w-[18px]" /> Lock dashboard
        </button>
      </div>
    </nav>
  );

  return (
    <div className="min-h-screen bg-[#070b1c] text-star">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-white/[0.06] bg-[#080d22] lg:block">{sidebar}</aside>

      {/* phone / tablet */}
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-white/[0.06] bg-[#080d22]/90 px-4 py-3 backdrop-blur lg:hidden">
        <span className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-gold-light to-gold-deep font-serif font-semibold text-void">WA</span>
          <span className="text-sm font-semibold">Dashboard</span>
        </span>
        <button onClick={() => setMenu(true)} aria-label="Open navigation" className="grid h-10 w-10 place-items-center rounded-lg text-mist hover:bg-white/5">
          <Menu className="h-5 w-5" />
        </button>
      </div>
      {menu && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMenu(false)} />
          <div className="relative h-full w-72 border-r border-white/10 bg-[#080d22] animate-[fade-in_0.25s_ease_both]">
            <button onClick={() => setMenu(false)} aria-label="Close navigation" className="absolute top-4 right-3 grid h-9 w-9 place-items-center rounded-lg text-mist hover:bg-white/5">
              <X className="h-5 w-5" />
            </button>
            {sidebar}
          </div>
        </div>
      )}

      <div className="lg:pl-64">
        {demo && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#3f86ee]/20 bg-[#3f86ee]/10 px-4 py-2.5 text-sm md:px-8">
            <p className="text-[#bcd5ff]">
              You're viewing <strong className="font-semibold">demo records</strong> (badged “Demo”). Your own entries are kept when you clear them.
            </p>
            <Button
              size="sm"
              variant="secondary"
              onClick={async () => {
                if (await confirm({ title: "Clear demo data?", body: "Removes every record marked Demo. Anything you entered yourself stays.", confirmLabel: "Clear demo data" })) {
                  clearDemoData();
                  toast("Demo data cleared");
                }
              }}
            >
              Clear demo data
            </Button>
          </div>
        )}
        <main className="mx-auto max-w-[1400px] px-4 py-6 md:px-8 md:py-8">
          <Routes>
            <Route index element={<Overview />} />
            <Route path="sales" element={<Sales />} />
            <Route path="pipeline" element={<Pipeline />} />
            <Route path="reps" element={<Reps />} />
            <Route path="subscribers" element={<Subscribers />} />
            <Route path="website" element={<Website />} />
            <Route path="settings" element={<Settings onLock={onLock} />} />
            <Route path="*" element={<Overview />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
