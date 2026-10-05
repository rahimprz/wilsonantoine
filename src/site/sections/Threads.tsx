import { useRef } from "react";
import { gsap, MOTION_OK, useGSAP } from "../../lib/gsap";
import type { SiteContent } from "../../data/types";
import BookCover from "../components/BookCover";
import { THEME_ICONS } from "../components/Icons";
import Label from "../components/Label";
import SmartImage from "../components/SmartImage";

/**
 * The book's themes as a horizontal gallery: on larger screens the section pins and vertical scroll
 * slides the panels sideways, each numeral drifting at its own pace. Phones get a plain vertical list.
 */
export default function Threads({ explores }: { explores: SiteContent["explores"] }) {
  const root = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const q = gsap.utils.selector(root);
      const mm = gsap.matchMedia();
      mm.add(`${MOTION_OK} and (min-width: 900px)`, () => {
        const el = track.current!;
        const distance = () => el.scrollWidth - window.innerWidth;
        const slide = gsap.to(el, {
          x: () => -distance(),
          ease: "none",
          scrollTrigger: { trigger: root.current, start: "top top", end: () => `+=${distance()}`, pin: true, scrub: 0.8, invalidateOnRefresh: true },
        });
        q("[data-num]").forEach((n) => {
          gsap.fromTo(n, { xPercent: 40 }, { xPercent: -40, ease: "none", scrollTrigger: { trigger: n.parentElement, containerAnimation: slide, start: "left right", end: "right left", scrub: true } });
        });
        q("[data-panel-in]").forEach((p) => {
          gsap.from(p, { y: 60, opacity: 0, ease: "none", scrollTrigger: { trigger: p, containerAnimation: slide, start: "left 95%", end: "left 55%", scrub: true } });
        });
        gsap.to(q("[data-progress]"), { scaleX: 1, ease: "none", scrollTrigger: { trigger: root.current, start: "top top", end: () => `+=${distance()}`, scrub: true } });
      });
      mm.add(`${MOTION_OK} and (max-width: 899px)`, () => {
        q("[data-panel-in]").forEach((p) => gsap.from(p, { y: 50, opacity: 0, duration: 1.1, scrollTrigger: { trigger: p, start: "top 88%", once: true } }));
      });
    },
    { scope: root, dependencies: [explores.themes.length] },
  );

  return (
    <section id="explores" ref={root} className="relative overflow-hidden bg-paper text-ink min-[900px]:h-[100svh]">
      <div ref={track} className="flex h-full flex-col min-[900px]:w-max min-[900px]:flex-row">
        {/* opening panel */}
        <div className="flex shrink-0 flex-col justify-center gap-10 px-[clamp(1.25rem,4vw,3.5rem)] pt-28 pb-14 min-[900px]:w-[62vw] min-[900px]:py-0">
          <div data-panel-in>
            <Label n={2} className="text-ember">
              {explores.eyebrow}
            </Label>
            <h2 className="display mt-8 text-[clamp(3.2rem,8vw,9rem)]">{explores.heading}</h2>
            {explores.intro && <p className="mt-6 max-w-md text-[1.1rem] text-stone">{explores.intro}</p>}
          </div>
          <div data-panel-in className="flex items-center gap-6">
            <div className="relative h-36 w-36 shrink-0 overflow-hidden rounded-full bg-ivory md:h-44 md:w-44">
              <SmartImage src={explores.image} alt="" aria-hidden loading="lazy" className="h-full w-full object-cover" fallback={<div className="grid h-full place-items-center"><BookCover className="w-[42%]" /></div>} />
            </div>
            <p className="label hidden max-w-[14rem] text-[0.65rem] leading-relaxed text-stone min-[900px]:block">Scroll — the threads run sideways →</p>
          </div>
        </div>

        {explores.themes.map((t, i) => {
          const Icon = THEME_ICONS[t.icon] ?? THEME_ICONS.sparkles;
          return (
            <article
              key={t.id}
              className="relative flex shrink-0 flex-col justify-end overflow-hidden border-t border-ink/15 px-[clamp(1.25rem,4vw,3.5rem)] py-14 min-[900px]:w-[44vw] min-[900px]:border-t-0 min-[900px]:border-l min-[900px]:py-24"
            >
              <span
                data-num
                aria-hidden
                className="display pointer-events-none absolute top-[8%] right-[6%] text-[clamp(8rem,22vw,22rem)] leading-none text-transparent [-webkit-text-stroke:1px_rgba(184,92,39,0.45)] max-[899px]:top-4 max-[899px]:text-[7rem]"
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <div data-panel-in className="relative">
                <span className="grid h-14 w-14 place-items-center rounded-full border border-ink/25 text-ember">
                  <Icon className="h-6 w-6" strokeWidth={1.3} />
                </span>
                <h3 className="display mt-8 max-w-[12ch] text-[clamp(2.6rem,4.6vw,5rem)]">{t.title}</h3>
                {t.text && <p className="mt-5 max-w-sm text-[1.08rem] leading-relaxed text-stone">{t.text}</p>}
              </div>
            </article>
          );
        })}

        {/* closing panel: Earth in an arch */}
        <div className="flex shrink-0 items-center justify-center px-[clamp(1.25rem,4vw,3.5rem)] py-16 min-[900px]:w-[48vw] min-[900px]:border-l min-[900px]:border-ink/15">
          <div data-panel-in className="arch relative aspect-[3/4] w-full max-w-sm overflow-hidden bg-ink">
            <SmartImage src={explores.backgroundImage} alt="Earth seen from space" loading="lazy" className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/70 to-transparent" />
            <p className="display absolute inset-x-0 bottom-8 text-center text-3xl text-ivory italic">Life, continued.</p>
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-[clamp(1.25rem,4vw,3.5rem)] bottom-8 hidden h-px bg-ink/15 min-[900px]:block">
        <div data-progress className="h-full origin-left scale-x-0 bg-ember" />
      </div>
    </section>
  );
}
