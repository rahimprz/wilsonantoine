import { useRef } from "react";
import { gsap, MOTION_OK, useGSAP } from "../../lib/gsap";
import type { SiteContent } from "../../data/types";
import Label from "../components/Label";
import ScrubText from "../components/ScrubText";
import SmartImage from "../components/SmartImage";

export default function Author({ author }: { author: SiteContent["author"] }) {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const q = gsap.utils.selector(root);
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        gsap.fromTo(q("[data-band]"), { xPercent: 0 }, { xPercent: -30, ease: "none", scrollTrigger: { trigger: root.current, start: "top bottom", end: "bottom top", scrub: true } });
        gsap.fromTo(
          q("[data-portrait]"),
          { clipPath: "inset(30% 20% 0% 20% round 999px 999px 0px 0px)" },
          { clipPath: "inset(0% 0% 0% 0% round 999px 999px 0px 0px)", ease: "none", scrollTrigger: { trigger: q("[data-portrait]")[0], start: "top 90%", end: "center 55%", scrub: true } },
        );
        gsap.fromTo(q("[data-portrait-img]"), { scale: 1.3, yPercent: -6 }, { scale: 1, yPercent: 6, ease: "none", scrollTrigger: { trigger: q("[data-portrait]")[0], start: "top bottom", end: "bottom top", scrub: true } });
        gsap.from(q("[data-in]"), { y: 30, opacity: 0, duration: 1.1, stagger: 0.1, scrollTrigger: { trigger: q("[data-copy]")[0], start: "top 80%", once: true } });
        q("[data-count]").forEach((el) => {
          const target = Number(el.getAttribute("data-count"));
          const suffix = el.getAttribute("data-suffix") ?? "";
          const s = { v: 0 };
          gsap.to(s, { v: target, duration: 2.4, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 90%", once: true }, onUpdate: () => void (el.textContent = `${Math.round(s.v)}${suffix}`) });
        });
      });
    },
    { scope: root },
  );

  const band = `${author.name} — `;

  return (
    <section id="author" ref={root} className="relative overflow-hidden bg-ivory pt-24 pb-24 md:pt-36 md:pb-36">
      <div className="overflow-hidden" aria-hidden>
        <p data-band className="display text-[clamp(5rem,17vw,17rem)] whitespace-nowrap text-ink/[0.07]">
          {band.repeat(4)}
        </p>
      </div>

      <div className="wrap -mt-[clamp(3rem,9vw,9rem)] grid items-end gap-14 lg:grid-cols-[5fr_7fr] lg:gap-24">
        <div className="relative mx-auto w-full max-w-md">
          <div data-portrait className="arch relative aspect-[4/5] overflow-hidden bg-paper">
            <div data-portrait-img className="absolute inset-0">
              <SmartImage
                src={author.image}
                alt={`Portrait of ${author.name}`}
                loading="lazy"
                className="h-full w-full object-cover"
                fallback={<div className="display grid h-full place-items-center bg-paper text-[8rem] text-ember/50 italic">W.A.</div>}
              />
            </div>
          </div>
          <p className="label mt-4 flex justify-between text-[0.65rem] text-stone">
            <span>{author.name}</span>
            <span>{author.credentials}</span>
          </p>
        </div>

        <div data-copy>
          <div data-in>
            <Label n={3} className="text-ember">
              {author.eyebrow}
            </Label>
          </div>
          <h2 data-in className="display mt-6 text-[clamp(3rem,6vw,6rem)]">
            {author.name.split(" ").slice(0, -1).join(" ")} <em className="text-ember">{author.name.split(" ").slice(-1)}</em>
          </h2>
          <ScrubText className="display mt-8 text-[clamp(1.5rem,2.3vw,2.25rem)] leading-[1.25]" dim={0.16}>
            {author.bio}
          </ScrubText>

          {author.highlights.length > 0 && (
            <dl data-in className="mt-14 grid grid-cols-2 border-t border-ink/15 sm:grid-cols-3">
              {author.highlights.map((h) => {
                const m = /^(\d+)(\+?)$/.exec(h.value.trim());
                return (
                  <div key={h.id} className="border-b border-ink/15 py-6 pr-4 sm:border-b-0 sm:border-r sm:last:border-r-0 sm:[&:not(:first-child)]:pl-6">
                    <dt className="sr-only">{h.label}</dt>
                    <dd>
                      <span className="display block text-[clamp(3.2rem,5vw,4.8rem)] leading-none text-ember" data-count={m ? m[1] : undefined} data-suffix={m ? m[2] : undefined}>
                        {h.value}
                      </span>
                      <span className="label mt-3 block text-[0.62rem] leading-relaxed text-stone">{h.label}</span>
                    </dd>
                  </div>
                );
              })}
            </dl>
          )}
        </div>
      </div>
    </section>
  );
}
