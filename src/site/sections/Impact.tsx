import { useRef } from "react";
import { Compass, Heart, Sunrise, type LucideIcon } from "lucide-react";
import { gsap, MOTION_OK, useGSAP } from "../../lib/gsap";
import type { SiteContent } from "../../data/types";
import SectionHead from "../components/SectionHead";
import SmartImage from "../components/SmartImage";
import { useReveal } from "../useReveal";

const ICONS: LucideIcon[] = [Heart, Compass, Sunrise];

/** Why it matters: who the book is for, in three words — comfort, clarity, reassurance. */
export default function Impact({ n, impact }: { n?: number; impact: SiteContent["impact"] }) {
  const root = useRef<HTMLElement>(null);
  useReveal(root, [impact.pillars.length]);
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        gsap.fromTo("[data-pair]", { y: 70 }, { y: -50, ease: "none", scrollTrigger: { trigger: root.current, start: "top bottom", end: "bottom top", scrub: true } });
        gsap.from("[data-frame]", { x: 24, y: 24, opacity: 0, duration: 1.6, ease: "expo.out", scrollTrigger: { trigger: "[data-frame]", start: "top 85%", once: true } });
        gsap.from("[data-pillar]", { y: 40, opacity: 0, duration: 1.2, stagger: 0.12, ease: "expo.out", scrollTrigger: { trigger: "[data-pillars]", start: "top 88%", once: true } });
      });
    },
    { scope: root, dependencies: [impact.pillars.length] },
  );

  return (
    <section id="impact" ref={root} className="stars-bg relative overflow-hidden py-20 md:py-28">
      <div className="pointer-events-none absolute top-0 left-1/2 h-px w-[min(90%,1100px)] -translate-x-1/2 bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
      <div className="wrap grid items-center gap-14 lg:grid-cols-[1fr_1fr] lg:gap-20">
        <div className="relative mx-auto w-full max-w-[560px]">
          <div data-frame aria-hidden className="absolute inset-[8%_-3%_-4%_6%] rounded-[4px] border border-gold/40" />
          <div className="relative overflow-hidden rounded-[4px] bg-[radial-gradient(90%_80%_at_50%_40%,#1a2c7a,#0a1130)] p-6 shadow-[0_50px_80px_-40px_rgba(0,0,0,0.9)] md:p-10">
            <div className="stars-bg pointer-events-none absolute inset-0 opacity-60" />
            <div data-pair className="relative">
              <SmartImage src={impact.image} alt="Postmortem Life Continuation — front and back cover" loading="lazy" className="h-auto w-full drop-shadow-[0_30px_30px_rgba(0,0,0,0.6)]" />
            </div>
          </div>
        </div>

        <div>
          <SectionHead n={n} eyebrow={impact.eyebrow} title={impact.heading} />
          <p data-reveal className="mt-7 text-[1.14rem] leading-relaxed text-mist">
            {impact.body}
          </p>
          <div data-pillars className="mt-10 grid gap-4 sm:grid-cols-3">
            {impact.pillars.map((p, i) => {
              const Icon = ICONS[i % ICONS.length];
              return (
                <div key={p.id} data-pillar className="glass group relative rounded-[4px] px-5 py-6 text-center transition-[translate,border-color] duration-500 hover:-translate-y-1 hover:border-gold/60">
                  <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-gold-light/25 to-gold-deep/10 text-gold ring-1 ring-gold/40 transition-colors duration-500 group-hover:bg-gold group-hover:text-night">
                    <Icon className="h-5 w-5" strokeWidth={1.5} />
                  </span>
                  <p className="serif-head mt-4 text-[1.35rem] !text-gold-light italic">{p.title}</p>
                  <p className="mt-1.5 text-[0.95rem] leading-snug text-mist">{p.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
