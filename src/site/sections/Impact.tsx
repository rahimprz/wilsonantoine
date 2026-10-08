import { Fragment, useRef } from "react";
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
        gsap.from("[data-frame]", { scale: 0.7, opacity: 0, duration: 1.8, ease: "expo.out", scrollTrigger: { trigger: "[data-frame]", start: "top 85%", once: true } });
        gsap.from("[data-pillar]", { y: 40, opacity: 0, duration: 1.2, stagger: 0.12, ease: "expo.out", scrollTrigger: { trigger: "[data-pillars]", start: "top 88%", once: true } });
      });
    },
    { scope: root, dependencies: [impact.pillars.length] },
  );

  return (
    <section id="impact" ref={root} className="relative overflow-hidden py-20 md:py-32">
      <div className="pointer-events-none absolute top-0 left-1/2 h-px w-[min(90%,1100px)] -translate-x-1/2 bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
      <div className="wrap grid items-center gap-14 lg:grid-cols-[1fr_1fr] lg:gap-20">
        <div className="relative mx-auto w-full max-w-[560px]">
          <div data-frame aria-hidden className="absolute top-1/2 left-1/2 aspect-square w-[92%] -translate-1/2 rounded-full">
            <span className="absolute inset-0 rounded-full bg-[radial-gradient(closest-side,rgba(51,84,210,0.45),rgba(24,54,165,0.12)_60%,transparent)] animate-pulse-glow" />
            <span className="absolute inset-[6%] rounded-full border border-gold/20" />
            <span className="absolute inset-[18%] rounded-full border border-dashed border-cyan/20 [animation:spin-rev_80s_linear_infinite]" />
            <span className="absolute top-[6%] left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-gold-light shadow-[0_0_14px_3px_rgba(220,202,163,0.7)]" />
          </div>
          <div data-pair className="relative">
            <SmartImage src={impact.image} alt="Postmortem Life Continuation — front and back cover" loading="lazy" className="h-auto w-full drop-shadow-[0_40px_40px_rgba(0,0,0,0.6)]" />
          </div>
          <div aria-hidden className="floor-glow mx-auto -mt-6 h-10 w-2/3" />
        </div>

        <div>
          <SectionHead n={n} eyebrow={impact.eyebrow} title={impact.heading} />
          <p data-reveal className="mt-7 text-[1.14rem] leading-relaxed text-mist">
            {impact.body}
          </p>
          <div data-pillars className="mt-12">
            <div className="hrule" />
            <div className="grid gap-y-8 py-8 sm:flex sm:items-stretch sm:justify-between">
              {impact.pillars.map((p, i) => {
                const Icon = ICONS[i % ICONS.length];
                return (
                  <Fragment key={p.id}>
                    {i > 0 && <span aria-hidden className="vrule hidden sm:block" />}
                    <div data-pillar className="group flex items-start gap-4 sm:flex-1 sm:flex-col sm:items-center sm:px-4 sm:text-center">
                      <span className="medallion h-12 w-12 group-hover:text-night group-hover:[background:#b59f78]">
                        <Icon className="h-5 w-5" strokeWidth={1.5} />
                      </span>
                      <div>
                        <p className="serif-head text-[1.45rem] !text-gold-light italic sm:mt-4">{p.title}</p>
                        <p className="mt-1 text-[0.98rem] leading-snug text-mist">{p.text}</p>
                      </div>
                    </div>
                  </Fragment>
                );
              })}
            </div>
            <div className="hrule" />
          </div>
        </div>
      </div>
    </section>
  );
}
