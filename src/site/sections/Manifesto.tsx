import { useRef } from "react";
import { gsap, MOTION_OK, useGSAP } from "../../lib/gsap";
import type { SiteContent } from "../../data/types";
import BgVideo from "../components/BgVideo";
import ScrubText from "../components/ScrubText";

/** One line, given the whole screen: words light up as the rising-light loop plays behind them. */
export default function Manifesto({ manifesto }: { manifesto: SiteContent["manifesto"] }) {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const q = gsap.utils.selector(root);
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        gsap.fromTo(q("[data-video]"), { scale: 1.25 }, { scale: 1, ease: "none", scrollTrigger: { trigger: root.current, start: "top bottom", end: "bottom top", scrub: true } });
        gsap.from(q("[data-mark]"), { scale: 0, rotate: -30, opacity: 0, duration: 1.4, ease: "back.out(1.6)", scrollTrigger: { trigger: root.current, start: "top 60%", once: true } });
      });
    },
    { scope: root },
  );

  return (
    <section ref={root} className="relative z-10 flex min-h-[105svh] items-center overflow-hidden" aria-label={manifesto.eyebrow}>
      <div data-video className="absolute inset-0">
        <BgVideo src={manifesto.video} className="h-full w-full" />
      </div>
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#03050d_0%,rgba(3,5,13,0.2)_25%,rgba(3,5,13,0.2)_75%,#03050d_100%)]" />
      <div className="container-site relative py-32 text-center">
        <svg data-mark viewBox="0 0 48 36" className="mx-auto h-10 w-14 text-gold" aria-hidden>
          <path
            fill="currentColor"
            d="M0 36V22C0 9.9 6.2 2.6 18.6 0l2 4.6C13.9 6.6 10.3 10.8 9.8 17H19v19H0zm28 0V22C28 9.9 34.2 2.6 46.6 0l2 4.6C41.9 6.6 38.3 10.8 37.8 17H47v19H28z"
          />
        </svg>
        <p className="eyebrow mt-8 justify-center">{manifesto.eyebrow}</p>
        <ScrubText
          as="blockquote"
          start="top 80%"
          end="center 45%"
          dim={0.12}
          className="mx-auto mt-8 max-w-5xl font-serif text-[clamp(2.2rem,5.6vw,5.2rem)] leading-[1.12] font-medium text-white italic"
        >
          {manifesto.quote}
        </ScrubText>
      </div>
    </section>
  );
}
