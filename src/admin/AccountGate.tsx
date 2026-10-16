import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import type { Session, SupabaseClient } from "@supabase/supabase-js";
import { Loader2, LogOut, Mail, ShieldAlert, UserRound } from "lucide-react";
import { getSupabase, SUPABASE_URL } from "../lib/supabase";
import { startSync, type SyncHandle } from "../data/remote";
import { AccountContext, type Account } from "./account";
import LockLayout from "./LockLayout";
import { Button, Input } from "./ui";

type Phase = "starting" | "signedOut" | "checking" | "notAdmin" | "loading" | "ready" | "error";

const card = "relative w-full max-w-sm rounded-3xl border border-gold/20 bg-[#0b1029]/90 p-8 shadow-2xl backdrop-blur";

/**
 * The dashboard's door when it runs on Supabase: a real account sign-in (email + password, or an
 * emailed link), a check that the account is on the admin list, then the whole dataset loaded from
 * the database before the dashboard opens.
 */
export default function AccountGate({ children }: { children: ReactNode }) {
  const [sb, setSb] = useState<SupabaseClient | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [phase, setPhase] = useState<Phase>("starting");
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const sync = useRef<SyncHandle | null>(null);
  const userId = session?.user.id ?? "";
  const email = session?.user.email ?? "";

  useEffect(() => {
    let unsub: (() => void) | undefined;
    getSupabase()!
      .then(async (client) => {
        setSb(client);
        const { data } = await client.auth.getSession();
        setSession(data.session);
        if (!data.session) setPhase("signedOut");
        const { data: listener } = client.auth.onAuthStateChange((_event, next) => {
          setSession(next);
          if (!next) setPhase("signedOut");
        });
        unsub = () => listener.subscription.unsubscribe();
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : String(err));
        setPhase("error");
      });
    return () => unsub?.();
  }, []);

  // a new sign-in (not a token refresh): check admin rights, then load the data
  useEffect(() => {
    if (!sb || !userId) return;
    let cancelled = false;
    (async () => {
      setPhase("checking");
      setError("");
      const { data: isAdmin, error: rpcError } = await sb.rpc("is_admin");
      if (cancelled) return;
      if (rpcError) {
        setError(rpcError.message);
        return setPhase("error");
      }
      if (!isAdmin) return setPhase("notAdmin");
      setPhase("loading");
      try {
        sync.current?.stop();
        sync.current = await startSync(sb, email);
        if (!cancelled) setPhase("ready");
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : String(err));
          setPhase("error");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [sb, userId, email, attempt]);

  useEffect(
    () => () => {
      sync.current?.stop();
    },
    [],
  );

  // coming back to the tab: pick up new sign-ups, events and edits made on other devices
  useEffect(() => {
    if (phase !== "ready") return;
    let last = Date.now();
    const onVisible = () => {
      if (document.visibilityState !== "visible" || Date.now() - last < 60_000) return;
      last = Date.now();
      sync.current?.refresh().catch(() => {});
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [phase]);

  const signOut = useCallback(async () => {
    try {
      await sync.current?.flush();
    } catch {
      /* the change stays in this browser and is retried at the next sign-in */
    }
    sync.current?.stop();
    sync.current = null;
    await sb?.auth.signOut();
    setPhase("signedOut");
  }, [sb]);

  const account = useMemo<Account | null>(
    () =>
      sb && email
        ? {
            email,
            signOut,
            refresh: async () => {
              await sync.current?.refresh();
            },
            setPassword: async (password) => {
              const { error: e } = await sb.auth.updateUser({ password });
              return e ? e.message : null;
            },
            databaseHost: SUPABASE_URL.replace(/^https?:\/\//, ""),
          }
        : null,
    [sb, email, signOut],
  );

  if (phase === "ready" && account) return <AccountContext.Provider value={account}>{children}</AccountContext.Provider>;

  return (
    <LockLayout>
      {phase === "signedOut" || !sb ? (
        sb ? (
          <SignIn sb={sb} />
        ) : (
          <Waiting text="Connecting…" />
        )
      ) : phase === "notAdmin" ? (
        <div className={`${card} text-center`}>
          <ShieldAlert className="mx-auto h-8 w-8 text-gold" />
          <h1 className="mt-4 font-heading text-[1.6rem] font-medium text-white">Not on the admin list</h1>
          <p className="mt-2 text-sm text-mist">
            <span className="text-star">{email}</span> can sign in, but it hasn't been given access to this dashboard.
          </p>
          <p className="mt-3 text-xs leading-relaxed text-haze">Add the address to ADMIN_EMAILS in Vercel and redeploy, or add it to the admins table in Supabase.</p>
          <Button className="mt-6 w-full" onClick={signOut}>
            <LogOut className="h-4 w-4" /> Use another account
          </Button>
        </div>
      ) : phase === "error" ? (
        <div className={`${card} text-center`}>
          <ShieldAlert className="mx-auto h-8 w-8 text-[#ff9a9a]" />
          <h1 className="mt-4 font-heading text-[1.6rem] font-medium text-white">Couldn't reach the database</h1>
          <p className="mt-2 text-sm break-words text-mist">{error || "Something went wrong."}</p>
          <div className="mt-6 grid gap-2">
            <Button variant="primary" onClick={() => setAttempt((n) => n + 1)}>
              Try again
            </Button>
            {session && (
              <Button variant="ghost" onClick={signOut}>
                Sign out
              </Button>
            )}
          </div>
        </div>
      ) : (
        <Waiting text={phase === "loading" ? "Loading your sales, statements and website…" : phase === "checking" ? "Checking your access…" : "Connecting…"} />
      )}
    </LockLayout>
  );
}

function Waiting({ text }: { text: string }) {
  return (
    <div className={`${card} flex flex-col items-center py-12 text-center`}>
      <Loader2 className="h-7 w-7 animate-spin text-gold" />
      <p className="mt-4 text-sm text-mist">{text}</p>
    </div>
  );
}

function SignIn({ sb }: { sb: SupabaseClient }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"password" | "link">("password");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setError("Enter your email address.");
    setBusy(true);
    if (mode === "password") {
      const { error: err } = await sb.auth.signInWithPassword({ email: email.trim(), password });
      if (err) setError(/invalid login/i.test(err.message) ? "That email and password don't match." : err.message);
    } else {
      const { error: err } = await sb.auth.signInWithOtp({ email: email.trim(), options: { emailRedirectTo: `${window.location.origin}/admin` } });
      if (err) setError(err.message);
      else setSent(true);
    }
    setBusy(false);
  };

  if (sent) {
    return (
      <div className={`${card} text-center`}>
        <Mail className="mx-auto h-8 w-8 text-gold" />
        <h1 className="mt-4 font-heading text-[1.6rem] font-medium text-white">Check your inbox</h1>
        <p className="mt-2 text-sm text-mist">
          A sign-in link is on its way to <span className="text-star">{email}</span>. Open it on this device to come straight back here.
        </p>
        <Button variant="ghost" className="mt-6" onClick={() => setSent(false)}>
          Back
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className={card}>
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-full border border-gold/40 bg-gold/10 text-gold">
        <UserRound className="h-5 w-5" />
      </div>
      <h1 className="mt-4 text-center font-heading text-[1.75rem] font-medium text-white">Sign in</h1>
      <p className="mt-2 text-center text-sm text-mist">{mode === "password" ? "Your sales dashboard, saved in the cloud." : "We'll email you a one-time sign-in link."}</p>
      <div className="mt-6 space-y-3">
        <Input type="email" autoFocus autoComplete="email" placeholder="Email" aria-label="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        {mode === "password" && <Input type="password" autoComplete="current-password" placeholder="Password" aria-label="Password" value={password} onChange={(e) => setPassword(e.target.value)} />}
      </div>
      {error && (
        <p className="mt-3 text-sm text-red-300" role="alert">
          {error}
        </p>
      )}
      <Button type="submit" variant="primary" className="mt-6 w-full" disabled={busy}>
        {busy && <Loader2 className="h-4 w-4 animate-spin" />}
        {mode === "password" ? "Sign in" : "Email me a sign-in link"}
      </Button>
      <button type="button" className="mt-4 block w-full text-center text-sm text-gold hover:text-gold-light" onClick={() => setMode(mode === "password" ? "link" : "password")}>
        {mode === "password" ? "No password yet, or forgot it? Email me a link" : "Sign in with a password instead"}
      </button>
      <a href="/" className="mt-5 block text-center text-xs text-mist hover:text-gold">
        ← Back to the website
      </a>
    </form>
  );
}
