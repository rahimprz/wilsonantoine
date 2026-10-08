import { useEffect, useRef, useState } from "react";
import { ArrowRight, Menu, ShieldCheck, X } from "lucide-react";
import { resolveMedia } from "../../lib/media";
import type { Retailer, SiteContent } from "../../data/types";
import { onBuyClick } from "../buy";
import { lockScroll, scrollToTarget } from "../smooth";

export interface NavItem {
  id: string;
  label: string;
}

interface HeaderProps {
  nav: NavItem[];
  name: string;
  logo: string;
  announcement?: SiteContent["announcement"];
  retailer?: Retailer;
}

/**
 * Masthead: a slim announcement line, his WA quill logo, letter-spaced links with a gold underline,
 * and an Admin pill. Transparent over the hero, deep navy glass once the page scrolls, with a fine
 * gold line along the bottom that fills as you read.
 */
export default function Header({ nav, name, logo, announcement, retailer }: HeaderProps) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState(nav[0]?.id ?? "");
  const [logoOk, setLogoOk] = useState(true);
  const bar = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      setScrolled(window.scrollY > 10);
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (bar.current) bar.current.style.transform = `scaleX(${max > 0 ? Math.min(1, window.scrollY / max) : 0})`;
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
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [nav]);

  useEffect(() => {
    lockScroll(open);
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const go = (target: string) => {
    setOpen(false);
    requestAnimationFrame(() => scrollToTarget(target.startsWith("#") ? target : `#${target}`));
  };

  const logoUrl = resolveMedia(logo);
  const solid = scrolled || open;
  const showBar = !!announcement?.text && !scrolled && !open;

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      {announcement?.text && (
        <div className={`grid overflow-hidden bg-[#0a1015] transition-[grid-template-rows] duration-500 ease-[var(--ease-out-expo)] ${showBar ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
          <div className="min-h-0">
            <div className="wrap flex h-9 items-center justify-center gap-3 border-b border-gold/20 text-[0.82rem] text-mist">
              <span className="hidden h-px w-8 bg-gradient-to-r from-transparent to-gold sm:block" />
              <span className="truncate">{announcement.text}</span>
              {announcement.linkLabel && announcement.link && (
                <a
                  href={announcement.link}
                  onClick={(e) => {
                    if (announcement.link.startsWith("#")) {
                      e.preventDefault();
                      go(announcement.link);
                    }
                  }}
                  className="caps inline-flex shrink-0 items-center gap-1.5 text-[0.62rem] text-gold-light hover:text-white"
                >
                  {announcement.linkLabel} <ArrowRight className="h-3 w-3" />
                </a>
              )}
              <span className="hidden h-px w-8 bg-gradient-to-l from-transparent to-gold sm:block" />
            </div>
          </div>
        </div>
      )}

      <div
        className={`relative border-b transition-[background-color,border-color,box-shadow] duration-500 ${
          solid ? "border-gold/20 bg-[#0a1015]/88 shadow-[0_18px_40px_-28px_rgba(0,0,0,0.9)] backdrop-blur-xl" : "border-white/5 bg-transparent"
        }`}
      >
        <div className="wrap flex h-20 items-center justify-between gap-6">
          <button onClick={() => go(nav[0]?.id ?? "home")} className="group shrink-0" aria-label={`${name} — home`}>
            {logoUrl && logoOk ? (
              <img src={logoUrl} alt={name} onError={() => setLogoOk(false)} className="h-11 w-auto transition-transform duration-500 group-hover:scale-[1.03] md:h-[52px]" />
            ) : (
              <span className="font-[family-name:var(--font-heading)] text-[1.3rem] font-semibold tracking-[0.06em] text-star uppercase">{name}</span>
            )}
          </button>

          <nav aria-label="Main" className="hidden items-center gap-7 lg:flex xl:gap-9">
            {nav.map((n) => (
              <button
                key={n.id}
                onClick={() => go(n.id)}
                aria-current={active === n.id ? "true" : undefined}
                className={`caps relative py-1.5 text-[0.7rem] transition-colors duration-300 ${active === n.id ? "text-gold-light" : "text-white/70 hover:text-white"}`}
              >
                {n.label}
                <span className={`absolute -bottom-0.5 left-0 h-px w-full origin-left bg-gradient-to-r from-gold to-gold-light transition-transform duration-500 ease-[var(--ease-out-expo)] ${active === n.id ? "scale-x-100" : "scale-x-0"}`} />
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2.5">
            <a href="/admin" className="caps hidden items-center gap-2 rounded-full border border-gold/45 px-4 py-2.5 text-[0.62rem] text-gold-light transition hover:border-gold hover:bg-gold/10 sm:inline-flex">
              <ShieldCheck className="h-3.5 w-3.5" /> Admin
            </a>
            {retailer && (
              <a href={retailer.url} target="_blank" rel="noopener" onClick={() => onBuyClick(retailer)} className="btn-gold hidden !px-5 !py-3 !text-[0.64rem] xl:inline-flex">
                Get the Book
              </a>
            )}
            <button
              onClick={() => setOpen((o) => !o)}
              className="grid h-11 w-11 place-items-center rounded-full border border-white/20 text-white transition hover:border-gold lg:hidden"
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
        <span ref={bar} aria-hidden className="absolute inset-x-0 -bottom-px h-px origin-left scale-x-0 bg-gradient-to-r from-gold-deep via-gold to-cyan" />
      </div>

      {open && (
        <nav aria-label="Mobile" className="site stars-bg flex h-[calc(100svh-80px)] flex-col overflow-y-auto bg-[#0a1015]/97 backdrop-blur-xl lg:hidden">
          <div className="wrap flex flex-1 flex-col pt-6 pb-10">
            {nav.map((n, i) => (
              <button
                key={n.id}
                onClick={() => go(n.id)}
                style={{ animationDelay: `${i * 50}ms` }}
                className="flex items-baseline gap-4 border-b border-white/10 py-4 text-left animate-[fade-in_0.5s_ease_both]"
              >
                <span className="font-[family-name:var(--font-heading)] text-sm text-gold italic">0{i + 1}</span>
                <span className={`serif-head text-[2rem] ${active === n.id ? "!text-gold-light" : ""}`}>{n.label}</span>
              </button>
            ))}
            <div className="mt-auto flex flex-wrap gap-3 pt-10">
              {retailer && (
                <a href={retailer.url} target="_blank" rel="noopener" onClick={() => onBuyClick(retailer)} className="btn-gold">
                  Get the Book <ArrowRight className="h-4 w-4" />
                </a>
              )}
              <a href="/admin" className="btn-outline">
                <ShieldCheck className="h-4 w-4" /> Admin
              </a>
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}
