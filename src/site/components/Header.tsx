import { useEffect, useRef, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { gsap } from "../../lib/gsap";
import type { Retailer } from "../../data/types";
import { onBuyClick } from "../buy";
import { lockScroll, scrollToTarget } from "../smooth";

export interface NavItem {
  id: string;
  label: string;
}

/**
 * Minimal masthead. The wordmark and links use mix-blend-difference, so the same white type reads
 * as white over the dark threshold and as ink over the ivory pages — no colour switching needed.
 */
export default function Header({ nav, retailer }: { nav: NavItem[]; retailer?: Retailer }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState("");
  const menu = useRef<HTMLDivElement>(null);

  // active link = the last section whose top has passed 45% of the viewport. Measured live, so it
  // stays right around the pinned scenes (whose spacers shift every position below them).
  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const line = window.innerHeight * 0.45;
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
    if (!open || !menu.current) return;
    const tl = gsap.timeline();
    tl.fromTo(menu.current, { clipPath: "inset(0% 0% 100% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 0.9, ease: "expo.inOut" }).from(
      menu.current.querySelectorAll("[data-item]"),
      { yPercent: 110, duration: 1, stagger: 0.06, ease: "expo.out" },
      "-=0.35",
    );
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      tl.kill();
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const go = (id: string) => {
    setOpen(false);
    requestAnimationFrame(() => scrollToTarget(`#${id}`));
  };

  return (
    <>
      {/* blended layer: white type in a difference blend reads on both the dark threshold and ivory pages.
          It has to be the fixed element itself, or the blend stays trapped in its own stacking context. */}
      <header className="pointer-events-none fixed inset-x-0 top-0 z-50 text-white mix-blend-difference">
        <div className="wrap flex h-20 items-center justify-between gap-6">
          <button onClick={() => go("home")} className="pointer-events-auto flex items-baseline gap-2" aria-label="Wilson Antoine, MD — back to the top">
            <span className="display text-[1.65rem] leading-none">Wilson Antoine</span>
            <span className="label text-[0.62rem] opacity-70">MD</span>
          </button>

          <nav aria-label="Main" className="pointer-events-auto hidden items-center gap-7 lg:flex">
            {nav.slice(1).map((item, i) => (
              <button
                key={item.id}
                onClick={() => go(item.id)}
                className="group label flex items-center gap-1.5 text-[0.68rem]"
                aria-current={active === item.id ? "true" : undefined}
              >
                <span className="opacity-50">{String(i + 1).padStart(2, "0")}</span>
                <span className="relative">
                  {item.label}
                  <span className={`absolute -bottom-1 left-0 h-px w-full origin-left bg-current transition-transform duration-500 ${active === item.id ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"}`} />
                </span>
              </button>
            ))}
          </nav>

          {/* spacer the size of the (unblended) buy pill + menu button */}
          <div className="flex items-center gap-2">
            <span className="w-[5.5rem] sm:w-[9.5rem]" aria-hidden />
            <button
              onClick={() => setOpen((o) => !o)}
              className="label pointer-events-auto rounded-full px-4 py-2.5 text-[0.68rem] ring-1 ring-white/70 lg:hidden"
              aria-expanded={open}
              aria-label={open ? "Close menu" : "Open menu"}
            >
              {open ? "Close" : "Menu"}
            </button>
          </div>
        </div>
      </header>

      {retailer && (
        <div className="pointer-events-none fixed inset-x-0 top-0 z-50">
          <div className="wrap flex h-20 items-center justify-end">
            <a
              href={retailer.url}
              target="_blank"
              rel="noopener"
              onClick={() => onBuyClick(retailer)}
              className="pill pill-ember pointer-events-auto !px-4 !py-2.5 !text-[0.82rem] max-lg:mr-[5.6rem] sm:!px-5"
            >
              Buy<span className="hidden sm:inline"> the book</span> <ArrowUpRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      )}

      {open && (
        <div ref={menu} className="fixed inset-0 z-40 flex flex-col justify-between bg-ink px-6 pt-28 pb-10 text-ivory lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <nav className="flex flex-col">
            {nav.map((item, i) => (
              <div key={item.id} className="overflow-hidden border-b border-ivory/10">
                <button data-item onClick={() => go(item.id)} className="flex w-full items-baseline gap-4 py-4 text-left">
                  <span className="label text-[0.65rem] text-sand">{String(i).padStart(2, "0")}</span>
                  <span className="display text-[clamp(2.4rem,11vw,4rem)]">{item.label}</span>
                </button>
              </div>
            ))}
          </nav>
          {retailer && (
            <div className="overflow-hidden">
              <a data-item href={retailer.url} target="_blank" rel="noopener" onClick={() => onBuyClick(retailer)} className="pill pill-ember w-full justify-center">
                Buy on {retailer.label} <ArrowUpRight className="h-4 w-4" />
              </a>
            </div>
          )}
        </div>
      )}
    </>
  );
}
