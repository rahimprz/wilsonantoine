import { Fragment, useRef } from "react";
import { gsap, MOTION_OK, useGSAP } from "../../lib/gsap";
import type { SiteContent } from "../../data/types";
import BgVideo from "../components/BgVideo";
import Ornament from "../components/Ornament";
import Stars from "../components/Stars";
import { useReveal } from "../useReveal";

/** The book's promise in one line, lighting up word by word over the rising-light loop. */
export default function Quote({ manifesto, author }: { manifesto: SiteContent["manifesto"]; author: string }) {
  const root = useRef<HTMLElement>(null);
  const words = manifesto.quote.trim().split(/\s+/);
  useReveal(root);
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        gsap.fromTo("[data-qw]", { opacity: 0.14 }, { opacity: 1, stagger: 0.12, ease: "none", scrollTrigger: { trigger: "[data-quote]", start: "top 80%", end: "bottom 45%", scrub: true } });
        gsap.from("[data-mark]", { scale: 0.4, opacity: 0, rotate: -12, duration: 1.6, ease: "expo.out", scrollTrigger: { trigger: root.current, start: "top 70%", once: true } });
        gsap.fromTo("[data-qbg]", { scale: 1.15 }, { scale: 1, ease: "none", scrollTrigger: { trigger: root.current, start: "top bottom", end: "bottom top", scrub: true } });
      });
    },
    { scope: root, dependencies: [manifesto.quote] },
  );

  return (
    <section ref={root} className="relative isolate overflow-hidden border-y border-gold/15 bg-[#0a1015]" aria-label={manifesto.eyebrow}>
      <div data-qbg className="absolute inset-0 -z-10">
        <BgVideo src={manifesto.video} className="absolute inset-0 h-full w-full opacity-70" />
      </div>
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(60%_70%_at_50%_50%,rgba(42,54,99,0.35),rgba(10,16,21,0.92))]" />
      <Stars className="absolute inset-0 -z-10 h-full w-full" density={12000} gold={0.4} />

      <div className="wrap flex min-h-[78svh] flex-col items-center justify-center py-24 text-center">
        <p data-reveal className="caps text-gold">{manifesto.eyebrow}</p>
        <span data-mark aria-hidden className="mt-6 block h-16 font-[family-name:var(--font-heading)] text-[7rem] leading-[0.9] text-gold/70">
          “
        </span>
        <blockquote data-quote className="mx-auto max-w-4xl font-[family-name:var(--font-heading)] text-[clamp(2rem,4.4vw,3.7rem)] leading-[1.2] text-star italic">
          {words.map((w, i) => (
            <Fragment key={i}>
              {i > 0 && " "}
              <span data-qw className="inline-block">
                {w}
              </span>
            </Fragment>
          ))}
        </blockquote>
        <div data-reveal className="mt-10 flex flex-col items-center gap-4">
          <Ornament center />
          <p className="caps text-[0.62rem] text-gold-light">{author}</p>
        </div>
      </div>
    </section>
  );
}
