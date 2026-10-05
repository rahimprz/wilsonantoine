import { useRef } from "react";
import { gsap, MOTION_OK, useGSAP } from "../../lib/gsap";
import type { SiteContent } from "../../data/types";
import BgVideo from "../components/BgVideo";
import Label from "../components/Label";
import ScrubText from "../components/ScrubText";

/**
 * A pause between chapters: a small window of rising light opens to full-bleed as you scroll,
 * then the premise lights up word by word over it.
 */
export default function Interlude({ manifesto }: { manifesto: SiteContent["manifesto"] }) {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const q = gsap.utils.selector(root);
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        gsap.fromTo(
          q("[data-window]"),
          { clipPath: "inset(22% 34% 22% 34% round 32px)" },
          { clipPath: "inset(0% 0% 0% 0% round 0px)", ease: "none", scrollTrigger: { trigger: root.current, start: "top 80%", end: "top top", scrub: true } },
        );
        gsap.fromTo(q("[data-video]"), { scale: 1.35 }, { scale: 1, ease: "none", scrollTrigger: { trigger: root.current, start: "top bottom", end: "bottom top", scrub: true } });
      });
    },
    { scope: root },
  );

  return (
    <section ref={root} className="relative bg-ivory" aria-label={manifesto.eyebrow}>
      <div data-window className="relative flex min-h-[115svh] items-center overflow-hidden bg-ink text-ivory">
        <div data-video className="absolute inset-0">
          <BgVideo src={manifesto.video} className="h-full w-full" />
        </div>
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,13,10,0.55),rgba(15,13,10,0.15)_40%,rgba(15,13,10,0.7))]" />
        <div className="wrap relative py-32">
          <Label n={5} className="text-dawn">
            {manifesto.eyebrow}
          </Label>
          <ScrubText as="blockquote" className="display mt-10 max-w-[20ch] text-[clamp(2.8rem,7.2vw,7.6rem)] leading-[0.98] italic" dim={0.15} start="top 70%" end="bottom 70%">
            {manifesto.quote}
          </ScrubText>
        </div>
      </div>
    </section>
  );
}
