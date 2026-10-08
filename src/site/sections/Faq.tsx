import { useRef, useState } from "react";
import { MessageCircleQuestion, Plus } from "lucide-react";
import type { SiteContent } from "../../data/types";
import SectionHead from "../components/SectionHead";
import { scrollToTarget } from "../smooth";
import { useReveal } from "../useReveal";

export default function Faq({ n, faq }: { n?: number; faq: SiteContent["faq"] }) {
  const root = useRef<HTMLElement>(null);
  const items = faq.items.filter((f) => f.q.trim());
  const [open, setOpen] = useState(0);
  useReveal(root, [items.length]);
  if (!items.length) return null;
  return (
    <section id="faq" ref={root} className="relative overflow-clip py-20 md:py-28">
      <div className="pointer-events-none absolute top-1/4 -right-48 h-[520px] w-[520px] rounded-full bg-[radial-gradient(closest-side,rgba(24,54,165,0.3),transparent)]" />
      <div className="wrap grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <SectionHead n={n} eyebrow={faq.eyebrow} title={faq.heading} />
          <div data-reveal className="glass mt-10 hidden rounded-[4px] p-6 lg:block">
            <MessageCircleQuestion className="h-6 w-6 text-gold" strokeWidth={1.5} />
            <p className="serif-head mt-3 text-[1.3rem]">Still curious?</p>
            <p className="mt-1.5 text-[0.98rem] text-mist">Write to Dr. Antoine or join the newsletter for news on the book.</p>
            <button onClick={() => scrollToTarget("#contact")} className="caps mt-4 text-[0.6rem] text-gold-light transition hover:text-white">
              Get in touch →
            </button>
          </div>
        </div>
        <div className="space-y-3">
          {items.map((f, i) => {
            const isOpen = open === i;
            return (
              <div key={f.id} data-reveal={i * 0.05} className={`rounded-[4px] border transition-colors duration-500 ${isOpen ? "border-gold/50 bg-[linear-gradient(160deg,rgba(42,54,99,0.6),rgba(10,17,48,0.75))]" : "border-white/10 bg-white/[0.03] hover:border-white/25"}`}>
                <h3>
                  <button onClick={() => setOpen(isOpen ? -1 : i)} aria-expanded={isOpen} aria-controls={`faq-${f.id}`} className="flex w-full items-center gap-5 px-5 py-5 text-left md:px-7">
                    <span className={`font-[family-name:var(--font-heading)] text-[1.1rem] italic transition-colors ${isOpen ? "text-gold" : "text-white/30"}`}>{String(i + 1).padStart(2, "0")}</span>
                    <span className="serif-head flex-1 text-[1.2rem] md:text-[1.3rem]">{f.q}</span>
                    <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full border transition-all duration-500 ${isOpen ? "rotate-45 border-gold bg-gold text-night" : "border-gold/40 text-gold"}`}>
                      <Plus className="h-4 w-4" />
                    </span>
                  </button>
                </h3>
                <div id={`faq-${f.id}`} role="region" className={`grid transition-[grid-template-rows] duration-500 ease-[var(--ease-out-expo)] ${isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
                  <div className="overflow-hidden">
                    <p className="px-5 pb-6 pl-[3.6rem] text-[1.05rem] leading-relaxed text-mist md:px-7 md:pl-[4.6rem]">{f.a}</p>
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
