import { useEffect, useRef, useState } from "react";
import { ArrowUpRight } from "lucide-react";
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

/** A full-screen reading page, deep navy under starlight, for the excerpt pasted into the dashboard. */
export default function ExcerptModal({ open, onClose, title, body, retailer }: ExcerptModalProps) {
  const root = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!open) return;
    lockScroll(true);
    const el = root.current!;
    const prev = document.activeElement as HTMLElement | null;
    el.querySelector<HTMLElement>("[data-close]")?.focus();
    gsap.fromTo(el, { clipPath: "inset(100% 0% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 1, ease: "expo.inOut" });
    gsap.from(el.querySelectorAll("[data-in]"), { y: 40, opacity: 0, duration: 1, stagger: 0.08, delay: 0.5 });
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      lockScroll(false);
      prev?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;
  const paragraphs = body.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);

  return (
    <div ref={root} className="site stars-bg fixed inset-0 z-[95] flex flex-col !bg-[#0a1015]" role="dialog" aria-modal="true" aria-label={title || "Excerpt"}>
      <div className="h-[2px] bg-white/10">
        <div className="h-full bg-gradient-to-r from-gold-deep via-gold to-gold-light" style={{ width: `${progress * 100}%` }} />
      </div>
      <div className="wrap flex h-16 shrink-0 items-center justify-between border-b border-white/10">
        <p className="caps text-gold">An excerpt</p>
        <button data-close onClick={onClose} className="btn-outline !py-2.5">
          Close
        </button>
      </div>
      <div
        data-lenis-prevent
        className="flex-1 overflow-y-auto"
        onScroll={(e) => {
          const t = e.currentTarget;
          setProgress(t.scrollHeight > t.clientHeight ? t.scrollTop / (t.scrollHeight - t.clientHeight) : 1);
        }}
      >
        <article className="mx-auto max-w-2xl px-6 pt-10 pb-24">
          {title && (
            <h2 data-in className="serif-head mb-12 text-[clamp(2.6rem,7vw,5rem)]">
              {title}
            </h2>
          )}
          <div data-in className="space-y-7 font-[family-name:var(--font-heading)] text-[1.45rem] leading-[1.65] first-letter:float-left first-letter:mr-3 first-letter:text-[4.6rem] first-letter:leading-[0.85] text-star/90 first-letter:text-gold">
            {paragraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
          {retailer && (
            <div data-in className="mt-16 border-t border-white/10 pt-10 text-center">
              <p className="serif-head text-4xl italic">Continue the journey.</p>
              <a href={retailer.url} target="_blank" rel="noopener" onClick={() => onBuyClick(retailer)} className="btn-gold mt-6">
                Get the full book <ArrowUpRight className="h-4 w-4" />
              </a>
            </div>
          )}
        </article>
      </div>
    </div>
  );
}
