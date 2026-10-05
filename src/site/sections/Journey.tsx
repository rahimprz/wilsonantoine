import { useRef } from "react";
import { ArrowUpRight } from "lucide-react";
import { gsap, MOTION_OK, useGSAP } from "../../lib/gsap";
import type { SiteContent } from "../../data/types";
import BgVideo from "../components/BgVideo";
import BookCover from "../components/BookCover";
import Label from "../components/Label";
import { onBuyClick } from "../buy";

/**
 * Begin the journey: the heading runs across the page as scroll-driven type, and the stores are
 * set as large rows that fill with ink on hover — next to the book standing in a window of night.
 */
export default function Journey({ buy }: { buy: SiteContent["buy"] }) {
  const root = useRef<HTMLElement>(null);
  const retailers = buy.retailers.filter((r) => r.url);
  const ordered = [...retailers].sort((a, b) => Number(b.primary) - Number(a.primary));

  useGSAP(
    () => {
      const q = gsap.utils.selector(root);
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        gsap.fromTo(q("[data-ticker]"), { xPercent: 0 }, { xPercent: -35, ease: "none", scrollTrigger: { trigger: root.current, start: "top bottom", end: "bottom top", scrub: true } });
        gsap.from(q("[data-window]"), { clipPath: "inset(100% 0% 0% 0% round 999px 999px 0 0)", duration: 1.8, ease: "expo.inOut", scrollTrigger: { trigger: q("[data-window]")[0], start: "top 80%", once: true } });
        gsap.from(q("[data-cover]"), { yPercent: 40, rotate: -8, opacity: 0, duration: 1.8, delay: 0.6, ease: "expo.out", scrollTrigger: { trigger: q("[data-window]")[0], start: "top 80%", once: true } });
        gsap.from(q("[data-store]"), { y: 50, opacity: 0, stagger: 0.1, duration: 1.1, scrollTrigger: { trigger: q("[data-stores]")[0], start: "top 85%", once: true } });
      });
    },
    { scope: root },
  );

  return (
    <section id="buy" ref={root} className="paper-grain relative overflow-hidden bg-paper py-24 md:py-32">
      <div className="overflow-hidden">
        <p data-ticker className="display text-[clamp(5rem,15vw,15rem)] whitespace-nowrap">
          {buy.heading} <em className="text-ember">—</em> {buy.heading} <em className="text-ember">—</em> {buy.heading}
        </p>
      </div>

      <div className="wrap mt-12 grid items-center gap-14 md:mt-16 lg:grid-cols-[5fr_7fr] lg:gap-24">
        <div data-window className="arch relative mx-auto grid aspect-[4/5] w-full max-w-md place-items-center overflow-hidden bg-ink">
          <BgVideo src={buy.video} className="absolute inset-0 h-full w-full" />
          <div data-cover className="relative w-[48%]">
            <BookCover />
          </div>
        </div>

        <div>
          <Label n={8} className="text-ember">
            {buy.eyebrow}
          </Label>
          <p className="display mt-6 max-w-xl text-[clamp(2rem,3.4vw,3.2rem)] leading-[1.1] italic">{buy.body}</p>
          <ul data-stores className="mt-10 border-b border-ink/15">
            {ordered.map((r) => (
              <li key={r.id} data-store className="border-t border-ink/15">
                <a
                  href={r.url}
                  target="_blank"
                  rel="noopener"
                  onClick={() => onBuyClick(r)}
                  data-cursor="Buy"
                  className="group relative isolate grid grid-cols-[1fr_auto] items-center gap-4 overflow-hidden px-2 py-6 transition-colors duration-500 hover:text-ivory md:px-4 md:py-7"
                >
                  <span className="absolute inset-0 -z-10 translate-y-full bg-ink transition-transform duration-700 ease-[var(--ease-out-expo)] group-hover:translate-y-0" />
                  <span>
                    <span className="display block text-[clamp(2.2rem,4vw,3.6rem)] leading-none">
                      {r.label}
                      {r.primary && retailers.length > 1 && <span className="label ml-3 align-middle text-[0.6rem] text-ember">Recommended</span>}
                    </span>
                    <span className="label mt-2 block text-[0.65rem] opacity-60">
                      {r.format}
                      {r.price && ` · ${r.price}`}
                    </span>
                  </span>
                  <span className="grid h-14 w-14 place-items-center rounded-full bg-ember text-ivory transition-transform duration-500 group-hover:rotate-45">
                    <ArrowUpRight className="h-5 w-5" />
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
