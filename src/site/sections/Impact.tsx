import { useRef } from "react";
import { gsap, MOTION_OK, useGSAP } from "../../lib/gsap";
import type { SiteContent } from "../../data/types";
import BookCover from "../components/BookCover";
import Label from "../components/Label";
import RevealText from "../components/RevealText";
import SmartImage from "../components/SmartImage";

const TONES = ["bg-ember text-ivory", "bg-ink text-ivory", "bg-paper text-ink", "bg-dawn text-ink"];

/**
 * Why it matters — a sticky statement on the left while cards stack on the right: each new card
 * slides over the last, which settles back and dims, like pages laid on a pile.
 */
export default function Impact({ impact }: { impact: SiteContent["impact"] }) {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const q = gsap.utils.selector(root);
      const mm = gsap.matchMedia();
      mm.add(`${MOTION_OK} and (min-width: 1024px)`, () => {
        const cards = q("[data-card]");
        cards.forEach((card, i) => {
          if (i === cards.length - 1) return;
          gsap.to(card, {
            scale: 0.9 + i * 0.02,
            filter: "brightness(0.82)",
            ease: "none",
            scrollTrigger: { trigger: cards[i + 1], start: "top bottom", end: "top 20%", scrub: true },
          });
        });
      });
      mm.add(MOTION_OK, () => {
        gsap.from(q("[data-in]"), { y: 30, opacity: 0, stagger: 0.1, duration: 1.1, scrollTrigger: { trigger: root.current, start: "top 70%", once: true } });
      });
    },
    { scope: root, dependencies: [impact.pillars.length] },
  );

  return (
    <section id="impact" ref={root} className="relative bg-ivory py-24 md:py-36">
      <div className="wrap grid gap-14 lg:grid-cols-[5fr_6fr] lg:gap-20">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <div data-in>
            <Label n={6} className="text-ember">
              {impact.eyebrow}
            </Label>
          </div>
          <RevealText className="display mt-8 text-[clamp(3rem,6.4vw,6.6rem)]">{impact.heading}</RevealText>
          <p data-in className="mt-8 max-w-lg text-[1.12rem] leading-relaxed text-stone">
            {impact.body}
          </p>
        </div>

        <div className="space-y-6 lg:space-y-[18vh]">
          <div data-card className="sticky top-24 overflow-hidden rounded-[28px] bg-paper shadow-[0_30px_60px_-30px_rgba(15,13,10,0.45)]">
            <SmartImage
              src={impact.image}
              alt="The book in a reader's hands"
              loading="lazy"
              className="aspect-[4/3] w-full object-cover"
              fallback={<div className="grid aspect-[4/3] place-items-center"><BookCover className="w-[28%]" /></div>}
            />
          </div>
          {impact.pillars.map((p, i) => (
            <article
              key={p.id}
              data-card
              className={`sticky flex min-h-[46svh] flex-col justify-between rounded-[28px] p-8 shadow-[0_30px_60px_-30px_rgba(15,13,10,0.5)] md:p-12 ${TONES[i % TONES.length]}`}
              style={{ top: `calc(6rem + ${(i + 1) * 1.4}rem)` }}
            >
              <span className="label text-[0.65rem] opacity-70">{String(i + 1).padStart(2, "0")} / {String(impact.pillars.length).padStart(2, "0")}</span>
              <div>
                <h3 className="display text-[clamp(3.6rem,7vw,7rem)]">{p.title}</h3>
                <p className="mt-3 max-w-sm text-[1.15rem] opacity-85">{p.text}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
