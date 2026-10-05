import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, X } from "lucide-react";
import { gsap } from "../../lib/gsap";
import type { Retailer } from "../../data/types";
import { onBuyClick } from "../buy";
import { lockScroll } from "../smooth";

interface ExcerptModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  body: string;
  retailer?: Retailer;
}

/** A quiet reading room for the excerpt the author pastes into the dashboard. */
export default function ExcerptModal({ open, onClose, title, body, retailer }: ExcerptModalProps) {
  const root = useRef<HTMLDivElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!open) return;
    lockScroll(true);
    const el = root.current!;
    const prevFocus = document.activeElement as HTMLElement | null;
    el.querySelector<HTMLElement>("[data-close]")?.focus();
    gsap.fromTo(el, { opacity: 0 }, { opacity: 1, duration: 0.5, ease: "power2.out" });
    gsap.fromTo(el.querySelector("[data-panel]"), { y: 60, opacity: 0, scale: 0.98 }, { y: 0, opacity: 1, scale: 1, duration: 0.9, delay: 0.05 });
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      lockScroll(false);
      prevFocus?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;
  const paragraphs = body.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);

  return (
    <div ref={root} className="fixed inset-0 z-[90] flex items-end justify-center bg-void/80 backdrop-blur-md md:items-center" role="dialog" aria-modal="true" aria-label={title || "Excerpt"} onClick={onClose}>
      <div data-panel className="relative flex max-h-[92svh] w-full max-w-3xl flex-col overflow-hidden rounded-t-3xl border border-white/10 bg-[#0b1029] shadow-2xl md:rounded-3xl" onClick={(e) => e.stopPropagation()}>
        <div className="h-[2px] bg-white/5">
          <div className="h-full bg-gradient-to-r from-gold to-cyan transition-[width] duration-150" style={{ width: `${progress * 100}%` }} />
        </div>
        <div className="flex items-center justify-between gap-4 border-b border-white/5 px-6 py-4 md:px-10">
          <p className="eyebrow !text-[0.7rem]">Excerpt</p>
          <button data-close onClick={onClose} aria-label="Close excerpt" className="grid h-10 w-10 place-items-center rounded-full border border-white/15 text-white/80 transition hover:border-gold hover:text-gold">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div
          ref={scroller}
          data-lenis-prevent
          className="overflow-y-auto px-6 py-8 md:px-14 md:py-12"
          onScroll={(e) => {
            const t = e.currentTarget;
            setProgress(t.scrollHeight > t.clientHeight ? t.scrollTop / (t.scrollHeight - t.clientHeight) : 1);
          }}
        >
          {title && <h2 className="mb-8 font-display text-2xl font-semibold text-white md:text-3xl">{title}</h2>}
          <div className="space-y-6 font-serif text-[1.35rem] leading-[1.75] text-star/90 first-letter:float-left first-letter:mr-3 first-letter:font-display first-letter:text-6xl first-letter:leading-none first-letter:text-gold">
            {paragraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
          {retailer && (
            <div className="mt-12 rounded-2xl border border-gold/30 bg-gradient-to-br from-royal/30 to-transparent p-6 text-center md:p-8">
              <p className="font-serif text-2xl italic text-white">Continue the journey.</p>
              <a href={retailer.url} target="_blank" rel="noopener" onClick={() => onBuyClick(retailer)} className="btn btn-gold mt-5">
                Get the full book <ArrowUpRight className="h-4 w-4" />
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
