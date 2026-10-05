import { useRef, useState } from "react";
import { Plus } from "lucide-react";
import type { SiteContent } from "../../data/types";
import Ornament from "../components/Ornament";
import { useReveal } from "../useReveal";

export default function Faq({ faq }: { faq: SiteContent["faq"] }) {
  const root = useRef<HTMLElement>(null);
  const items = faq.items.filter((f) => f.q.trim());
  const [open, setOpen] = useState(0);
  useReveal(root, [items.length]);
  if (!items.length) return null;
  return (
    <section id="faq" ref={root} className="relative bg-sandlight py-24 md:py-32">
      <div className="wrap grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
        <div>
          <Ornament className="mb-5" />
          <p data-reveal className="kicker">{faq.eyebrow}</p>
          <h2 data-reveal className="title mt-4 text-[clamp(2.4rem,4.8vw,4rem)] text-navy">
            {faq.heading}
          </h2>
        </div>
        <div className="space-y-3">
          {items.map((f, i) => {
            const isOpen = open === i;
            return (
              <div key={f.id} data-reveal={i * 0.05} className={`card transition-shadow ${isOpen ? "ring-1 ring-gold/50" : ""}`}>
                <h3>
                  <button onClick={() => setOpen(isOpen ? -1 : i)} aria-expanded={isOpen} aria-controls={`faq-${f.id}`} className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left">
                    <span className="title text-[1.45rem] text-navy">{f.q}</span>
                    <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full transition-all duration-500 ${isOpen ? "rotate-45 bg-gold text-navy" : "bg-navy text-gold-light"}`}>
                      <Plus className="h-4 w-4" />
                    </span>
                  </button>
                </h3>
                <div id={`faq-${f.id}`} role="region" className={`grid transition-[grid-template-rows] duration-500 ease-[var(--ease-out-expo)] ${isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
                  <div className="overflow-hidden">
                    <p className="px-6 pb-6 text-[1.05rem] leading-relaxed text-slate">{f.a}</p>
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
