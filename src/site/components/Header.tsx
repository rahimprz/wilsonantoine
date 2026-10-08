import { useEffect, useState } from "react";
import { Feather, Menu, ShieldCheck, X } from "lucide-react";
import { lockScroll, scrollToTarget } from "../smooth";

export interface NavItem {
  id: string;
  label: string;
}

/** Classic masthead: wordmark with a quill, letter-spaced links, an Admin pill. */
export default function Header({ nav, name, credentials }: { nav: NavItem[]; name: string; credentials: string }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState(nav[0]?.id ?? "");

  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      setScrolled(window.scrollY > 10);
      const line = window.innerHeight * 0.35;
      let current = nav[0]?.id ?? "";
      for (const { id } of nav) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= line) current = id;
      }
      setActive(current);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
    };
  }, [nav]);

  useEffect(() => {
    lockScroll(open);
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const go = (id: string) => {
    setOpen(false);
    requestAnimationFrame(() => scrollToTarget(`#${id}`));
  };

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 border-b transition-[background-color,border-color,box-shadow] duration-500 ${
        scrolled || open ? "border-line bg-parchment/92 shadow-[0_8px_30px_-20px_rgba(30,39,73,0.35)] backdrop-blur-md" : "border-transparent bg-transparent"
      }`}
    >
      <div className="wrap flex h-[84px] items-center justify-between gap-6">
        <button onClick={() => go(nav[0]?.id ?? "home")} className="shrink-0 text-left" aria-label={`${name} — home`}>
          <span className="flex items-center gap-2 font-[family-name:var(--font-heading)] text-[1.3rem] font-semibold tracking-[0.04em] text-ink-navy uppercase md:text-[1.45rem]">
            {name}
            <Feather className="h-5 w-5 text-gold" strokeWidth={1.6} />
          </span>
          <span className="caps mt-0.5 flex items-center gap-2 text-[0.6rem] text-muted">
            <span className="h-px w-5 bg-gold/70" />
            {credentials}
            <span className="h-px w-5 bg-gold/70" />
          </span>
        </button>

        <nav aria-label="Main" className="hidden items-center gap-8 lg:flex">
          {nav.map((n) => (
            <button
              key={n.id}
              onClick={() => go(n.id)}
              aria-current={active === n.id ? "true" : undefined}
              className={`caps relative py-1 text-[0.72rem] transition-colors ${active === n.id ? "text-ink-navy" : "text-ink-soft/80 hover:text-ink-navy"}`}
            >
              {n.label}
              <span className={`absolute -bottom-0.5 left-0 h-[1.5px] w-full origin-left bg-gold transition-transform duration-500 ${active === n.id ? "scale-x-100" : "scale-x-0"}`} />
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <a href="/admin" className="caps hidden items-center gap-2 rounded-full border border-ink-navy/25 px-5 py-2.5 text-[0.68rem] text-ink-navy transition hover:border-ink-navy sm:inline-flex">
            <ShieldCheck className="h-4 w-4 text-gold" /> Admin
          </a>
          <button
            onClick={() => setOpen((o) => !o)}
            className="grid h-11 w-11 place-items-center rounded-full border border-ink-navy/20 text-ink-navy lg:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <nav aria-label="Mobile" className="wrap flex h-[calc(100svh-84px)] flex-col pt-4 pb-10 lg:hidden">
          {nav.map((n) => (
            <button key={n.id} onClick={() => go(n.id)} className="serif-head border-b border-line py-4 text-left text-3xl animate-[fade-in_0.4s_ease_both]">
              {n.label}
            </button>
          ))}
          <a href="/admin" className="caps mt-8 inline-flex items-center gap-2 text-[0.75rem] text-ink-navy">
            <ShieldCheck className="h-4 w-4 text-gold" /> Admin
          </a>
        </nav>
      )}
    </header>
  );
}
