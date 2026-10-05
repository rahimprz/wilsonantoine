import { useRef } from "react";
import { Compass, HeartHandshake, Sun } from "lucide-react";
import type { SiteContent } from "../../data/types";
import SmartImage from "../components/SmartImage";
import { useReveal } from "../useReveal";

const ICONS = [Sun, Compass, HeartHandshake];

/** Who the book is for — the reader's reason to pick it up. */
export default function ForWhom({ impact }: { impact: SiteContent["impact"] }) {
  const root = useRef<HTMLElement>(null);
  useReveal(root, [impact.pillars.length]);
  return (
    <section id="impact" ref={root} className="relative bg-sandlight py-24 md:py-32">
      <div className="wrap grid items-center gap-14 lg:grid-cols-2 lg:gap-20">
        <div>
          <p data-reveal className="kicker">{impact.eyebrow}</p>
          <h2 data-reveal className="title mt-4 text-[clamp(2.4rem,4.8vw,4rem)] text-navy">
            {impact.heading}
          </h2>
          <p data-reveal className="mt-6 text-[1.15rem] leading-[1.8] text-inkblue/85">
            {impact.body}
          </p>
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {impact.pillars.map((p, i) => {
              const Icon = ICONS[i % ICONS.length];
              return (
                <div key={p.id} data-reveal={i * 0.08} className="card p-5">
                  <Icon className="h-6 w-6 text-gold-deep" />
                  <p className="title mt-4 text-2xl text-navy">{p.title}</p>
                  <p className="mt-1 text-sm text-slate">{p.text}</p>
                </div>
              );
            })}
          </div>
        </div>
        <div data-reveal className="overflow-hidden rounded-[28px] shadow-[0_40px_80px_-40px_rgba(11,22,56,0.6)]">
          <SmartImage src={impact.image} alt="The book in a reader's hands" loading="lazy" className="h-auto w-full" fallback={<div className="aspect-[3/2] bg-gradient-to-br from-navy-2 to-navy" />} />
        </div>
      </div>
    </section>
  );
}
