import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, X } from "lucide-react";
import { gsap, ScrollTrigger } from "../../lib/gsap";
import { resolveMedia } from "../../lib/media";
import type { Retailer } from "../../data/types";
import { onBuyClick } from "../buy";
import { lockScroll, scrollToTarget } from "../smooth";

export interface NavItem {
  id: string;
  label: string;
}

interface HeaderProps {
  logo: string;
  brand: string;
  nav: NavItem[];
  retailer?: Retailer;
}

/** Transparent over the hero, frosted once scrolled; tucks away on the way down and returns on the way up. */
export default function Header({ logo, brand, nav, retailer }: HeaderProps) {
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(nav[0]?.id ?? "");
  const [logoFailed, setLogoFailed] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let last = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 40);
      setHidden(y > window.innerHeight * 0.9 && y > last + 4 ? true : y < last - 4 ? false : (h) => h);
      last = y;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // active link follows whichever section holds the middle of the viewport
  useEffect(() => {
    const triggers = nav
      .map(({ id }) => {
        const el = document.getElementById(id);
        if (!el) return null;
        return ScrollTrigger.create({
          trigger: el,
          start: "top 50%",
          end: "bottom 50%",
          onToggle: (self) => self.isActive && setActive(id),
        });
      })
      .filter(Boolean);
    return () => triggers.forEach((t) => t!.kill());
  }, [nav]);

  useEffect(() => {
    lockScroll(open);
    if (!open || !menuRef.current) return;
    const items = menuRef.current.querySelectorAll("[data-menu-item]");
    const tween = gsap.fromTo(items, { yPercent: 120, opacity: 0 }, { yPercent: 0, opacity: 1, stagger: 0.06, duration: 0.9, delay: 0.15 });
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      tween.kill();
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const go = (id: string) => {
    setOpen(false);
    // wait a frame so the menu's scroll lock releases before Lenis scrolls
    requestAnimationFrame(() => scrollToTarget(`#${id}`));
  };

  const Logo = (
    <button onClick={() => go(nav[0]?.id ?? "home")} className="relative z-10 flex shrink-0 items-center" aria-label={`${brand} — back to top`}>
      {!logoFailed ? (
        <img
          src={resolveMedia(logo)}
          alt={brand}
          className={`w-auto transition-all duration-500 ${scrolled ? "h-11 md:h-12" : "h-12 md:h-[60px]"}`}
          onError={() => setLogoFailed(true)}
        />
      ) : (
        <span className="flex items-baseline gap-2 font-serif text-2xl">
          <span className="font-semibold text-gold">WA</span>
          <span className="font-display text-sm tracking-[0.2em] text-white">{brand.toUpperCase()}</span>
        </span>
      )}
    </button>
  );

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-[transform,background-color,box-shadow,backdrop-filter] duration-500 ease-[var(--ease-out-expo)] ${
          hidden && !open ? "-translate-y-full" : "translate-y-0"
        } ${scrolled ? "bg-void/70 shadow-[0_10px_40px_-20px_rgba(0,0,0,0.9)] backdrop-blur-xl" : "bg-transparent"}`}
      >
        <div className="container-site flex h-[76px] items-center justify-between gap-6 md:h-[88px]">
          {Logo}
          <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
            {nav.map((item) => (
              <button
                key={item.id}
                onClick={() => go(item.id)}
                className={`group relative rounded-full px-4 py-2 text-[0.82rem] font-medium tracking-[0.14em] uppercase transition-colors duration-300 ${
                  active === item.id ? "text-void" : "text-white/85 hover:text-white"
                }`}
                aria-current={active === item.id ? "true" : undefined}
              >
                <span
                  className={`absolute inset-0 -z-0 rounded-full bg-gold transition-[transform,opacity] duration-500 ease-[var(--ease-out-expo)] ${
                    active === item.id ? "scale-100 opacity-100" : "scale-50 opacity-0 group-hover:scale-100 group-hover:opacity-25"
                  }`}
                />
                <span className="relative">{item.label}</span>
              </button>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            {retailer && (
              <a
                href={retailer.url}
                target="_blank"
                rel="noopener"
                onClick={() => onBuyClick(retailer)}
                className="btn btn-gold hidden !px-5 !py-2.5 !text-[0.78rem] sm:inline-flex"
              >
                Buy the Book
              </a>
            )}
            <button
              onClick={() => setOpen((o) => !o)}
              className="relative z-10 grid h-11 w-11 place-items-center rounded-full border border-white/25 lg:hidden"
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
            >
              <span className={`absolute h-[1.5px] w-5 bg-white transition-transform duration-500 ${open ? "rotate-45" : "-translate-y-1"}`} />
              <span className={`absolute h-[1.5px] w-5 bg-white transition-transform duration-500 ${open ? "-rotate-45" : "translate-y-1"}`} />
            </button>
          </div>
        </div>
      </header>

      {/* mobile / tablet fullscreen menu */}
      <div
        ref={menuRef}
        className={`fixed inset-0 z-40 flex flex-col bg-void/95 backdrop-blur-2xl transition-[clip-path] duration-700 ease-[var(--ease-out-expo)] lg:hidden ${
          open ? "[clip-path:circle(150%_at_calc(100%-3rem)_2.75rem)]" : "pointer-events-none [clip-path:circle(0%_at_calc(100%-3rem)_2.75rem)]"
        }`}
        aria-hidden={!open}
      >
        <div className="absolute inset-0 bg-[radial-gradient(80%_60%_at_80%_10%,rgba(24,54,165,0.4),transparent_70%)]" />
        <nav aria-label="Mobile" className="container-site relative mt-28 flex flex-col gap-2">
          {nav.map((item, i) => (
            <div key={item.id} className="overflow-hidden">
              <button
                data-menu-item
                tabIndex={open ? 0 : -1}
                onClick={() => go(item.id)}
                className="flex w-full items-baseline gap-4 py-2 text-left font-display text-[clamp(1.8rem,7vw,3rem)] font-semibold text-white"
              >
                <span className="font-body text-sm text-gold tabular-nums">0{i + 1}</span>
                {item.label}
              </button>
            </div>
          ))}
          {retailer && (
            <div className="mt-8 overflow-hidden">
              <a data-menu-item href={retailer.url} target="_blank" rel="noopener" onClick={() => onBuyClick(retailer)} className="btn btn-gold" tabIndex={open ? 0 : -1}>
                Buy on {retailer.label} <ArrowUpRight className="h-4 w-4" />
              </a>
            </div>
          )}
        </nav>
        <button onClick={() => setOpen(false)} className="sr-only" tabIndex={open ? 0 : -1}>
          <X /> Close menu
        </button>
      </div>
    </>
  );
}
