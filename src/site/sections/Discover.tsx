import { useRef } from "react";
import type { SiteContent } from "../../data/types";
import { THEME_ICONS } from "../components/Icons";
import SmartImage from "../components/SmartImage";
import { useReveal } from "../useReveal";

/** The book's themes as a clean grid of cards — what a reader will find inside. */
export default function Discover({ explores }: { explores: SiteContent["explores"] }) {
  const root = useRef<HTMLElement>(null);
  useReveal(root, [explores.themes.length]);

  return (
    <section id="discover" ref={root} className="relative overflow-hidden bg-sandlight py-24 md:py-32">
      <div className="wrap">
        <div className="grid items-end gap-8 md:grid-cols-[1fr_auto]">
          <div className="max-w-2xl">
            <p data-reveal className="kicker">{explores.eyebrow}</p>
            <h2 data-reveal className="title mt-4 text-[clamp(2.4rem,4.8vw,4rem)] text-navy">
              {explores.heading}
            </h2>
            {explores.intro && (
              <p data-reveal className="mt-4 text-lg text-slate">
                {explores.intro}
              </p>
            )}
          </div>
          <div data-reveal className="hidden h-36 w-36 overflow-hidden rounded-full ring-8 ring-white md:block">
            <SmartImage src={explores.backgroundImage} alt="" aria-hidden loading="lazy" className="h-full w-full object-cover" fallback={<div className="h-full w-full bg-[radial-gradient(circle_at_35%_30%,#7fd0ff,#1c4fa0_55%,#071a40)]" />} />
          </div>
        </div>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {explores.themes.map((t, i) => {
            const Icon = THEME_ICONS[t.icon] ?? THEME_ICONS.sparkles;
            return (
              <article key={t.id} data-reveal={(i % 3) * 0.08} className="card group p-7 transition-transform duration-500 hover:-translate-y-1.5">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-navy text-gold-light transition-colors duration-500 group-hover:bg-gold group-hover:text-navy">
                  <Icon className="h-5 w-5" strokeWidth={1.6} />
                </span>
                <h3 className="title mt-6 text-[1.75rem] text-navy">{t.title}</h3>
                {t.text && <p className="mt-2 text-slate">{t.text}</p>}
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
