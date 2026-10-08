import { useRef } from "react";
import type { SiteContent } from "../../data/types";
import { THEME_ICONS } from "../components/Icons";
import { useReveal } from "../useReveal";

export default function Explores({ explores }: { explores: SiteContent["explores"] }) {
  const root = useRef<HTMLElement>(null);
  useReveal(root, [explores.themes.length]);
  return (
    <section id="explores" ref={root} className="py-20 md:py-28">
      <div className="wrap">
        <div className="mx-auto max-w-2xl text-center">
          <p data-reveal className="caps text-[0.7rem] text-gold-deep">{explores.eyebrow}</p>
          <h2 data-reveal className="serif-head mt-3 text-[clamp(2.2rem,4vw,3.4rem)]">
            {explores.heading}
          </h2>
          <div data-reveal className="rule-gold mx-auto mt-6 w-24" />
          {explores.intro && (
            <p data-reveal className="mt-6 text-[1.2rem]">
              {explores.intro}
            </p>
          )}
        </div>
        <div className="mt-14 grid gap-px overflow-hidden rounded-[10px] border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
          {explores.themes.map((t, i) => {
            const Icon = THEME_ICONS[t.icon] ?? THEME_ICONS.sparkles;
            return (
              <article key={t.id} data-reveal={(i % 3) * 0.06} className="group bg-parchment p-8 transition-colors duration-500 hover:bg-[#fcfaf6] md:p-10">
                <span className="grid h-12 w-12 place-items-center rounded-full border border-gold/50 text-gold transition-colors duration-500 group-hover:bg-ink-navy group-hover:text-white">
                  <Icon className="h-5 w-5" strokeWidth={1.5} />
                </span>
                <h3 className="serif-head mt-6 text-[1.5rem]">{t.title}</h3>
                {t.text && <p className="mt-2 text-[1.05rem] leading-relaxed">{t.text}</p>}
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
