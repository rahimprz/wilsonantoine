import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, CheckCircle2, Info, X } from "lucide-react";

// ---------------------------------------------------------------- layout

export function Card({ className = "", children, as: As = "section" }: { className?: string; children: ReactNode; as?: "section" | "div" | "article" }) {
  return <As className={`rounded-2xl border border-white/[0.07] bg-[#0e1430] ${className}`}>{children}</As>;
}

export function CardHeader({ title, subtitle, action }: { title: ReactNode; subtitle?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 px-5 pt-5 md:px-6">
      <div>
        <h2 className="text-[0.95rem] font-semibold text-star">{title}</h2>
        {subtitle && <p className="mt-0.5 text-sm text-mist">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function PageHeader({ title, subtitle, actions }: { title: ReactNode; subtitle?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-heading text-[1.85rem] leading-tight font-medium text-white md:text-[2.15rem]">{title}</h1>
        {subtitle && <p className="mt-1.5 max-w-2xl text-[0.95rem] text-mist">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

// ---------------------------------------------------------------- controls

type Variant = "primary" | "secondary" | "ghost" | "danger";
const VARIANTS: Record<Variant, string> = {
  primary: "bg-gradient-to-br from-gold-light to-gold text-[#0b0c12] hover:brightness-110 shadow-[0_8px_24px_-12px_rgba(181,159,120,0.9)]",
  secondary: "border border-white/12 bg-white/[0.04] text-star hover:border-white/25 hover:bg-white/[0.07]",
  ghost: "text-mist hover:bg-white/[0.06] hover:text-star",
  danger: "border border-red-400/30 bg-red-500/10 text-red-200 hover:bg-red-500/20",
};

export function Button({
  variant = "secondary",
  size = "md",
  className = "",
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: "sm" | "md" }) {
  return (
    <button
      type="button"
      {...rest}
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-medium whitespace-nowrap transition disabled:cursor-not-allowed disabled:opacity-50 ${
        size === "sm" ? "px-3 py-1.5 text-[0.82rem]" : "px-4 py-2.5 text-sm"
      } ${VARIANTS[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

export function IconButton({ label, children, className = "", ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      {...rest}
      className={`grid h-9 w-9 place-items-center rounded-lg text-mist transition hover:bg-white/[0.07] hover:text-star disabled:opacity-40 ${className}`}
    >
      {children}
    </button>
  );
}

const fieldBase =
  "w-full rounded-xl border border-white/10 bg-[#080d24] px-3.5 py-2.5 text-[0.95rem] text-star placeholder:text-haze transition focus:border-gold/70 focus:outline-none focus:ring-2 focus:ring-gold/20";

export function Field({ label, hint, error, children, className = "" }: { label: string; hint?: ReactNode; error?: string; children: (id: string) => ReactNode; className?: string }) {
  const id = useId();
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-[0.8rem] font-medium tracking-wide text-mist">
        {label}
      </label>
      {children(id)}
      {error ? <p className="mt-1.5 text-xs text-red-300">{error}</p> : hint ? <p className="mt-1.5 text-xs text-haze">{hint}</p> : null}
    </div>
  );
}

export function Input({ className = "", ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...rest} className={`${fieldBase} ${className}`} />;
}

export function Textarea({ className = "", ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...rest} className={`${fieldBase} min-h-[110px] leading-relaxed ${className}`} />;
}

export function Select({ className = "", children, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...rest} className={`${fieldBase} appearance-none bg-[url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23aab3d8' stroke-width='2.5'><path d='m6 9 6 6 6-6'/></svg>")] bg-[length:12px] bg-[right_0.9rem_center] bg-no-repeat pr-9 ${className}`}>
      {children}
    </select>
  );
}

export function Toggle({ checked, onChange, label, description }: { checked: boolean; onChange: (v: boolean) => void; label: string; description?: string }) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4">
      <span>
        <span className="block text-[0.95rem] text-star">{label}</span>
        {description && <span className="mt-0.5 block text-sm text-haze">{description}</span>}
      </span>
      <span className="relative mt-0.5 shrink-0">
        <input type="checkbox" className="peer sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <span className="block h-6 w-11 rounded-full bg-white/15 transition peer-checked:bg-gold peer-focus-visible:ring-2 peer-focus-visible:ring-gold/50" />
        <span className="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition peer-checked:translate-x-5" />
      </span>
    </label>
  );
}

export function Badge({ children, tone = "neutral", className = "" }: { children: ReactNode; tone?: "neutral" | "gold" | "blue" | "good" | "warn" | "bad"; className?: string }) {
  const tones = {
    neutral: "bg-white/[0.07] text-mist",
    gold: "bg-gold/15 text-gold-light",
    blue: "bg-[#3f86ee]/15 text-[#9cc2ff]",
    good: "bg-[#0ca30c]/15 text-[#7ee07e]",
    warn: "bg-[#fab219]/15 text-[#ffd27a]",
    bad: "bg-[#d03b3b]/15 text-[#ff9a9a]",
  };
  return <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium ${tones[tone]} ${className}`}>{children}</span>;
}

export function DemoBadge() {
  return (
    <Badge tone="blue" className="!px-1.5 !py-0 text-[0.65rem] tracking-wider uppercase">
      Demo
    </Badge>
  );
}

export function EmptyState({ icon, title, children, action }: { icon: ReactNode; title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-2xl border border-gold/25 bg-gold/10 text-gold">{icon}</div>
      <p className="mt-4 font-semibold text-star">{title}</p>
      {children && <div className="mt-1.5 max-w-sm text-sm text-mist">{children}</div>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

// ---------------------------------------------------------------- overlays

function useEscape(open: boolean, onClose: () => void) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
}

/** Side panel for create/edit forms (full-height sheet on phones). */
export function Drawer({ open, onClose, title, children, footer }: { open: boolean; onClose: () => void; title: string; children: ReactNode; footer?: ReactNode }) {
  useEscape(open, onClose);
  const panel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (open) panel.current?.querySelector<HTMLElement>("input, select, textarea")?.focus();
  }, [open]);
  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-[80] flex justify-end" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-[fade-in_0.3s_ease_both]" onClick={onClose} />
      <div ref={panel} className="relative flex h-full w-full max-w-lg flex-col border-l border-white/10 bg-[#0b1029] shadow-2xl animate-[drawer-in_0.45s_cubic-bezier(0.16,1,0.3,1)_both]">
        <div className="flex items-center justify-between border-b border-white/[0.07] px-6 py-4">
          <h2 className="font-semibold text-star">{title}</h2>
          <IconButton label="Close" onClick={onClose}>
            <X className="h-5 w-5" />
          </IconButton>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-6">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-white/[0.07] px-6 py-4">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}

export function Modal({ open, onClose, title, children, footer, wide }: { open: boolean; onClose: () => void; title: string; children: ReactNode; footer?: ReactNode; wide?: boolean }) {
  useEscape(open, onClose);
  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-[85] grid place-items-center p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-black/65 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full ${wide ? "max-w-2xl" : "max-w-md"} rounded-2xl border border-white/10 bg-[#0b1029] shadow-2xl animate-[fade-in_0.3s_ease_both]`}>
        <div className="px-6 pt-6">
          <h2 className="font-semibold text-star">{title}</h2>
        </div>
        <div className="px-6 py-4 text-[0.95rem] text-mist">{children}</div>
        {footer && <div className="flex justify-end gap-2 px-6 pb-6">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}

// ---------------------------------------------------------------- toasts & confirm

type ToastTone = "good" | "info" | "bad";
interface ToastItem {
  id: number;
  text: string;
  tone: ToastTone;
  action?: { label: string; run: () => void };
}
interface Feedback {
  toast: (text: string, tone?: ToastTone, action?: ToastItem["action"]) => void;
  confirm: (opts: { title: string; body?: ReactNode; confirmLabel?: string; danger?: boolean }) => Promise<boolean>;
}
const FeedbackContext = createContext<Feedback | null>(null);

export function useFeedback(): Feedback {
  const ctx = useContext(FeedbackContext);
  if (!ctx) throw new Error("useFeedback must be used inside <FeedbackProvider>");
  return ctx;
}

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [ask, setAsk] = useState<{ title: string; body?: ReactNode; confirmLabel?: string; danger?: boolean; resolve: (v: boolean) => void } | null>(null);
  const seq = useRef(0);

  const toast = useCallback<Feedback["toast"]>((text, tone = "good", action) => {
    const id = ++seq.current;
    setToasts((t) => [...t, { id, text, tone, action }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), action ? 6000 : 3400);
  }, []);
  const confirm = useCallback<Feedback["confirm"]>((opts) => new Promise<boolean>((resolve) => setAsk({ ...opts, resolve })), []);
  const settle = (v: boolean) => {
    ask?.resolve(v);
    setAsk(null);
  };

  const ICON = { good: CheckCircle2, info: Info, bad: AlertTriangle };
  return (
    <FeedbackContext.Provider value={{ toast, confirm }}>
      {children}
      <div className="pointer-events-none fixed right-4 bottom-4 z-[95] flex w-[min(92vw,380px)] flex-col gap-2" aria-live="polite">
        {toasts.map((t) => {
          const Icon = ICON[t.tone];
          return (
            <div key={t.id} className="pointer-events-auto flex items-center gap-3 rounded-xl border border-white/10 bg-[#141b3d] px-4 py-3 text-sm text-star shadow-2xl animate-[fade-in_0.3s_ease_both]">
              <Icon className={`h-5 w-5 shrink-0 ${t.tone === "good" ? "text-[#4cd34c]" : t.tone === "bad" ? "text-[#ff8080]" : "text-[#9cc2ff]"}`} />
              <span className="flex-1">{t.text}</span>
              {t.action && (
                <button
                  className="font-semibold text-gold hover:text-gold-light"
                  onClick={() => {
                    t.action!.run();
                    setToasts((all) => all.filter((x) => x.id !== t.id));
                  }}
                >
                  {t.action.label}
                </button>
              )}
            </div>
          );
        })}
      </div>
      <Modal
        open={!!ask}
        onClose={() => settle(false)}
        title={ask?.title ?? ""}
        footer={
          <>
            <Button variant="ghost" onClick={() => settle(false)}>
              Cancel
            </Button>
            <Button variant={ask?.danger ? "danger" : "primary"} onClick={() => settle(true)} autoFocus>
              {ask?.confirmLabel ?? "Confirm"}
            </Button>
          </>
        }
      >
        {ask?.body}
      </Modal>
    </FeedbackContext.Provider>
  );
}
