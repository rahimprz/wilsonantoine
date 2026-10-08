import { useRef, useState } from "react";
import { Plus } from "lucide-react";
import type { SiteContent } from "../../data/types";
import { useReveal } from "../useReveal";

export default function Faq({ faq }: { faq: SiteContent["faq"] }) {
  const root = useRef<HTMLElement>(null);
  const items = faq.items.filter((f) => f.q.trim());
  const [open, setOpen] = useState(0);
  useReveal(root, [items.length]);
  if (!items.length) return null;
  return (
    <section id="faq" ref={root} className="border-t border-line bg-parchment-2/60 py-20 md:py-28">
      <div className="wrap grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
        <div>
          <p data-reveal className="caps text-[0.7rem] text-gold-deep">{faq.eyebrow}</p>
          <h2 data-reveal className="serif-head mt-3 text-[clamp(2.2rem,4vw,3.4rem)]">
            {faq.heading}
          </h2>
          <div data-reveal className="rule-gold mt-6 w-24" />
        </div>
        <div className="border-t border-line">
          {items.map((f, i) => {
            const isOpen = open === i;
            return (
              <div key={f.id} data-reveal={i * 0.04} className="border-b border-line">
                <h3>
                  <button onClick={() => setOpen(isOpen ? -1 : i)} aria-expanded={isOpen} aria-controls={`faq-${f.id}`} className="flex w-full items-center justify-between gap-6 py-6 text-left">
                    <span className="serif-head text-[1.35rem]">{f.q}</span>
                    <Plus className={`h-5 w-5 shrink-0 text-gold transition-transform duration-500 ${isOpen ? "rotate-45" : ""}`} />
                  </button>
                </h3>
                <div id={`faq-${f.id}`} role="region" className={`grid transition-[grid-template-rows] duration-500 ease-[var(--ease-out-expo)] ${isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
                  <div className="overflow-hidden">
                    <p className="pb-6 text-[1.1rem] leading-relaxed">{f.a}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
