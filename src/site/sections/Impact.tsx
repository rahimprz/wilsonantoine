import { useRef } from "react";
import { Compass, HeartHandshake, Sun } from "lucide-react";
import { gsap, MOTION_OK, useGSAP } from "../../lib/gsap";
import type { SiteContent } from "../../data/types";
import Book3D from "../components/Book3D";
import RevealText from "../components/RevealText";
import SmartImage from "../components/SmartImage";

const PILLAR_ICONS = [Sun, Compass, HeartHandshake];

export default function Impact({ impact }: { impact: SiteContent["impact"] }) {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const q = gsap.utils.selector(root);
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        const enter = { trigger: q("[data-media]")[0], start: "top 75%", once: true };
        gsap.fromTo(q("[data-orb]"), { scale: 0 }, { scale: 1, duration: 1.6, delay: 0.5, ease: "expo.inOut", scrollTrigger: enter });
        gsap.fromTo(q("[data-reveal]"), { clipPath: "inset(0% 0% 0% 100%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.6, ease: "expo.inOut", scrollTrigger: enter });
        // the original's "-2 to 2" horizontal drift, image and orb moving against each other
        gsap.fromTo(q("[data-media-par]"), { xPercent: 5 }, { xPercent: -5, ease: "none", scrollTrigger: { trigger: root.current, scrub: true } });
        gsap.fromTo(q("[data-orb-par]"), { xPercent: -10 }, { xPercent: 10, ease: "none", scrollTrigger: { trigger: root.current, scrub: true } });
        gsap.from(q("[data-in]"), { y: 30, opacity: 0, stagger: 0.12, duration: 1.1, scrollTrigger: { trigger: root.current, start: "top 70%", once: true } });
        gsap.from(q("[data-pillar]"), { y: 40, opacity: 0, stagger: 0.14, duration: 1.1, scrollTrigger: { trigger: q("[data-pillars]")[0], start: "top 85%", once: true } });
      });
    },
    { scope: root },
  );

  return (
    <section id="impact" ref={root} className="relative z-10 overflow-hidden py-28 md:py-40">
      <div className="container-site grid items-center gap-16 lg:grid-cols-[5fr_7fr] lg:gap-16">
        <div>
          <p data-in className="eyebrow">
            {impact.eyebrow}
          </p>
          <RevealText className="heading-lg mt-5 text-white">{impact.heading}</RevealText>
          <p data-in className="mt-7 text-lg leading-relaxed text-mist md:text-[1.15rem]">
            {impact.body}
          </p>
          <div data-pillars className="mt-10 grid gap-4">
            {impact.pillars.map((p, i) => {
              const Icon = PILLAR_ICONS[i % PILLAR_ICONS.length];
              return (
                <div key={p.id} data-pillar className="group flex items-center gap-5 rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition-colors duration-500 hover:border-gold/50">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-gold-light to-gold-deep text-void shadow-[0_10px_30px_-10px_rgba(181,159,120,0.8)] transition-transform duration-500 group-hover:-rotate-6">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="font-display text-lg font-semibold text-white">{p.title}</p>
                    <p className="text-mist">{p.text}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div data-media className="relative">
          <div data-orb-par className="absolute right-0 bottom-0 h-full w-1/2">
            <div data-orb className="absolute right-0 bottom-0 aspect-square w-full max-w-full rounded-full bg-[radial-gradient(circle_at_35%_30%,#dccaa3,#b59f78_45%,#7d6844)] opacity-90" aria-hidden />
          </div>
          <div data-media-par className="relative">
            <div data-reveal className="relative">
              <SmartImage
                src={impact.image}
                alt="Postmortem Life Continuation in a reader's hands"
                loading="lazy"
                className="relative h-auto w-full rounded-xl drop-shadow-[0_40px_60px_rgba(0,0,0,0.6)]"
                fallback={<Book3D className="mx-auto w-[42%] py-10" />}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
