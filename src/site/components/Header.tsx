import { useEffect, useState } from "react";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { resolveMedia } from "../../lib/media";
import type { Retailer } from "../../data/types";
import { onBuyClick } from "../buy";
import { lockScroll, scrollToTarget } from "../smooth";

export interface NavItem {
  id: string;
  label: string;
}

/** Transparent over the hero, solid navy once scrolled — so the logo always sits on its own colour. */
export default function Header({ nav, retailer, logo, brand }: { nav: NavItem[]; retailer?: Retailer; logo: string; brand: string }) {
  const [solid, setSolid] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState("");
  const [logoFailed, setLogoFailed] = useState(false);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      setSolid(window.scrollY > 30);
      const line = window.innerHeight * 0.4;
      let current = "";
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
    <header className={`fixed inset-x-0 top-0 z-50 transition-[background-color,box-shadow] duration-500 ${solid || open ? "bg-navy/90 shadow-[0_10px_30px_-15px_rgba(0,0,0,0.6)] backdrop-blur-xl" : "bg-transparent"}`}>
      <div className="wrap flex h-[76px] items-center justify-between gap-6">
        <button onClick={() => go("home")} aria-label={`${brand} — back to top`} className="shrink-0">
          {!logoFailed ? (
            <img src={resolveMedia(logo)} alt={brand} className="h-11 w-auto md:h-12" onError={() => setLogoFailed(true)} />
          ) : (
            <span className="title text-2xl text-white">
              Wilson Antoine <span className="text-sm text-gold-light">MD</span>
            </span>
          )}
        </button>

        <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
          {nav.map((n) => (
            <button
              key={n.id}
              onClick={() => go(n.id)}
              aria-current={active === n.id ? "true" : undefined}
              className={`rounded-full px-4 py-2 text-[0.9rem] font-medium transition-colors ${active === n.id ? "text-gold-light" : "text-white/80 hover:text-white"}`}
            >
              {n.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {retailer && (
            <a href={retailer.url} target="_blank" rel="noopener" onClick={() => onBuyClick(retailer)} className="btn-buy !px-5 !py-2.5 !text-[0.85rem]">
              Buy now <ArrowUpRight className="h-4 w-4" />
            </a>
          )}
          <button onClick={() => setOpen((o) => !o)} className="grid h-11 w-11 place-items-center rounded-full text-white ring-1 ring-white/25 lg:hidden" aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open}>
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <nav aria-label="Mobile" className="wrap flex h-[calc(100svh-76px)] flex-col gap-1 pt-6 pb-10 lg:hidden">
          {nav.map((n) => (
            <button key={n.id} onClick={() => go(n.id)} className="title border-b border-white/10 py-4 text-left text-4xl text-white animate-[fade-in_0.5s_ease_both]">
              {n.label}
            </button>
          ))}
        </nav>
      )}
    </header>
  );
}
