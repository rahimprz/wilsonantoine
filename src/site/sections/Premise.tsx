import { useRef } from "react";
import { gsap, MOTION_OK, useGSAP } from "../../lib/gsap";
import type { SiteContent } from "../../data/types";
import BgVideo from "../components/BgVideo";
import ScrubText from "../components/ScrubText";

/** One line from the book's promise, over the rising-light loop. */
export default function Premise({ manifesto }: { manifesto: SiteContent["manifesto"] }) {
  const root = useRef<HTMLElement>(null);
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        gsap.fromTo("[data-video]", { scale: 1.2 }, { scale: 1, ease: "none", scrollTrigger: { trigger: root.current, start: "top bottom", end: "bottom top", scrub: true } });
      });
    },
    { scope: root },
  );
  return (
    <section ref={root} className="on-dark relative overflow-hidden bg-navy py-32 text-center text-white md:py-44" aria-label={manifesto.eyebrow}>
      <div data-video className="absolute inset-0">
        <BgVideo src={manifesto.video} className="h-full w-full" />
      </div>
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#0b1638,rgba(11,22,56,0.35)_30%,rgba(11,22,56,0.35)_70%,#0b1638)]" />
      <div className="wrap relative">
        <p className="kicker">{manifesto.eyebrow}</p>
        <ScrubText as="blockquote" className="title mx-auto mt-6 max-w-4xl text-[clamp(2.2rem,5vw,4.4rem)] leading-[1.1] italic" dim={0.2} start="top 80%" end="bottom 60%">
          {manifesto.quote}
        </ScrubText>
      </div>
    </section>
  );
}
