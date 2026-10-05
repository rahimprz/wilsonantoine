import { useRef } from "react";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import { gsap, MOTION_OK, useGSAP } from "../../lib/gsap";
import type { Retailer, SiteContent } from "../../data/types";
import BgVideo from "../components/BgVideo";
import SmartImage from "../components/SmartImage";
import { onBuyClick } from "../buy";
import { onIntroDone } from "../intro";

interface HeroProps {
  hero: SiteContent["hero"];
  announcement?: SiteContent["announcement"];
  retailer?: Retailer;
  onExcerpt: () => void;
}

/** Splits the title into three lines for the staggered layout: first word, middle (italic), rest. */
function titleLines(title: string): [string, string, string] {
  const w = title.trim().split(/\s+/);
  if (w.length >= 3) return [w[0], w.slice(1, -1).join(" "), w[w.length - 1]];
  if (w.length === 2) return [w[0], "", w[1]];
  return [title, "", ""];
}

/**
 * The threshold. A doorway of light stands in the dark with the title spread across it; scrolling
 * pins the scene and carries you through the doorway — it swells until its light fills the screen
 * and the ivory pages of the site begin.
 */
export default function Hero({ hero, announcement, retailer, onExcerpt }: HeroProps) {
  const root = useRef<HTMLElement>(null);
  const [l1, l2, l3] = titleLines(hero.title);

  useGSAP(
    () => {
      const q = gsap.utils.selector(root);
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        gsap.set(q("[data-arch]"), { clipPath: "inset(100% 0% 0% 0%)" });
        gsap.set(q("[data-line] > span"), { yPercent: 110 });
        gsap.set(q("[data-fade]"), { opacity: 0, y: 20 });
        gsap.set(q("[data-sky]"), { opacity: 0, scale: 1.15 });

        let intro: gsap.core.Timeline | undefined;
        const stop = onIntroDone(() => {
          intro = gsap
            .timeline()
            .to(q("[data-sky]"), { opacity: 1, scale: 1, duration: 2.4, ease: "power2.out" })
            .to(q("[data-arch]"), { clipPath: "inset(0% 0% 0% 0%)", duration: 1.8, ease: "expo.inOut" }, 0)
            .to(q("[data-line] > span"), { yPercent: 0, duration: 1.4, stagger: 0.12, ease: "expo.out" }, 0.7)
            .to(q("[data-fade]"), { opacity: 1, y: 0, duration: 1, stagger: 0.08, ease: "expo.out" }, 1.2);
        });

        // stepping through: pinned while the doorway grows to fill the screen
        const arch = q("[data-arch]")[0];
        const through = gsap.timeline({
          scrollTrigger: { trigger: root.current, start: "top top", end: "+=140%", pin: true, scrub: 0.9, invalidateOnRefresh: true },
        });
        through
          .to(arch, {
            scale: () => {
              const r = arch.getBoundingClientRect();
              const w = r.width / (Number(gsap.getProperty(arch, "scale")) || 1);
              const h = r.height / (Number(gsap.getProperty(arch, "scale")) || 1);
              return Math.max(window.innerWidth / w, window.innerHeight / h) * 1.35;
            },
            borderRadius: 0,
            ease: "power2.in",
            duration: 1,
          }, 0)
          .to(q("[data-line-1]"), { xPercent: -60, opacity: 0, ease: "power2.in", duration: 0.7 }, 0)
          .to(q("[data-line-3]"), { xPercent: 60, opacity: 0, ease: "power2.in", duration: 0.7 }, 0)
          .to(q("[data-line-2]"), { scale: 2.4, opacity: 0, ease: "power2.in", duration: 0.6 }, 0.05)
          .to(q("[data-chrome]"), { opacity: 0, y: 30, duration: 0.35 }, 0)
          .to(q("[data-sky]"), { scale: 1.3, opacity: 0, duration: 0.8 }, 0)
          .to(q("[data-flash]"), { opacity: 1, duration: 0.3, ease: "power1.in" }, 0.72);

        return () => {
          stop();
          intro?.kill();
        };
      });
    },
    { scope: root, dependencies: [hero.title] },
  );

  const announceExternal = announcement?.link && !announcement.link.startsWith("#");

  return (
    <section id="home" ref={root} className="relative isolate h-[100svh] overflow-hidden bg-ink text-ivory" aria-label="Introduction">
      {/* the night around the doorway */}
      <div data-sky className="absolute inset-0 -z-10">
        <SmartImage src={hero.backgroundImage} alt="" aria-hidden className="h-full w-full object-cover opacity-25 saturate-50" fetchPriority="high" />
        <div className="absolute inset-0 bg-[radial-gradient(45%_55%_at_50%_55%,rgba(184,92,39,0.28),transparent_70%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_50%,transparent_40%,#0f0d0a_95%)]" />
      </div>

      {/* the doorway of light */}
      <div
        data-arch
        className="arch absolute top-[54%] left-1/2 z-0 h-[min(66svh,118vw)] w-[min(31vw,40svh)] min-w-[200px] -translate-x-1/2 -translate-y-1/2 overflow-hidden bg-[#2b1a0e] shadow-[0_0_120px_30px_rgba(243,201,139,0.18)] max-md:w-[58vw]"
      >
        <BgVideo src={hero.backgroundVideo} className="absolute inset-0 h-full w-full scale-[1.4]" />
        <div className="absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_60%,rgba(255,236,200,0.35),transparent_70%)] mix-blend-screen" />
      </div>

      {/* the title, spread across the doorway */}
      <h1 className="display pointer-events-none absolute inset-0 z-10 text-white mix-blend-difference" aria-label={hero.title}>
        <span data-line data-line-1 className="absolute top-[17%] left-[4vw] block overflow-hidden text-[clamp(3.6rem,13.5vw,15rem)] max-md:top-[19%]">
          <span className="block">{l1}</span>
        </span>
        {l2 && (
          <span data-line data-line-2 className="absolute top-[41%] left-1/2 block -translate-x-1/2 overflow-hidden text-[clamp(3.4rem,11vw,12rem)] italic">
            <span className="block">{l2}</span>
          </span>
        )}
        <span data-line data-line-3 className="absolute top-[62%] right-[4vw] block overflow-hidden text-[clamp(3.6rem,13.5vw,15rem)] max-md:top-[60%]">
          <span className="block">{l3}</span>
        </span>
      </h1>

      <div data-flash className="pointer-events-none absolute inset-0 z-30 bg-ivory opacity-0" />

      {/* chrome: credit line, subtitle, actions */}
      <div data-chrome className="absolute inset-x-0 top-0 bottom-0 z-20 flex flex-col justify-between pt-24 pb-6 md:pb-8">
        <div className="wrap flex items-start justify-between gap-6">
          <p data-fade className="label max-w-[16rem] text-[0.65rem] leading-relaxed text-sand">
            {hero.eyebrow}
          </p>
          {announcement?.text && (
            <a
              data-fade
              href={announcement.link || "#buy"}
              target={announceExternal ? "_blank" : undefined}
              rel={announceExternal ? "noopener" : undefined}
              className="label hidden max-w-[18rem] text-right text-[0.65rem] leading-relaxed text-dawn hover:text-ivory md:block"
            >
              ● {announcement.text}
              {announcement.linkLabel && <span className="mt-1 block underline underline-offset-4">{announcement.linkLabel} →</span>}
            </a>
          )}
        </div>

        <div className="wrap flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-md">
            <p data-fade className="display text-[clamp(1.5rem,2.6vw,2.2rem)] leading-[1.1] italic text-ivory/95">
              {hero.subtitle}
            </p>
            <div data-fade className="mt-6 flex flex-wrap gap-3">
              <button onClick={onExcerpt} className="pill pill-line-light" data-cursor="Read">
                {hero.primaryCta}
              </button>
              {retailer && (
                <a href={retailer.url} target="_blank" rel="noopener" onClick={() => onBuyClick(retailer)} className="pill pill-ember">
                  {hero.secondaryCta} <ArrowUpRight className="h-4 w-4" />
                </a>
              )}
            </div>
          </div>
          <p data-fade className="label hidden items-center gap-3 text-[0.65rem] text-sand md:flex">
            Scroll to step through <ArrowDown className="h-3.5 w-3.5 animate-bounce" />
          </p>
        </div>
      </div>
    </section>
  );
}
