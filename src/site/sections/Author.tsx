import { useRef } from "react";
import { Stethoscope } from "lucide-react";
import { gsap, MOTION_OK, useGSAP } from "../../lib/gsap";
import type { SiteContent } from "../../data/types";
import SmartImage from "../components/SmartImage";
import { useReveal } from "../useReveal";

export default function Author({ author }: { author: SiteContent["author"] }) {
  const root = useRef<HTMLElement>(null);
  useReveal(root);
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        gsap.from("[data-portrait]", { clipPath: "inset(100% 0% 0% 0% round 24px)", duration: 1.6, ease: "expo.inOut", scrollTrigger: { trigger: "[data-portrait]", start: "top 80%", once: true } });
        gsap.utils.toArray<HTMLElement>("[data-count]").forEach((el) => {
          const target = Number(el.dataset.count);
          const suffix = el.dataset.suffix ?? "";
          const s = { v: 0 };
          gsap.to(s, { v: target, duration: 2, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 90%", once: true }, onUpdate: () => void (el.textContent = `${Math.round(s.v)}${suffix}`) });
        });
      });
    },
    { scope: root },
  );

  return (
    <section id="author" ref={root} className="relative py-24 md:py-32">
      <div className="wrap grid items-center gap-14 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
        <div className="relative mx-auto w-full max-w-md">
          <div className="absolute -inset-3 -z-10 translate-x-5 translate-y-5 rounded-[28px] bg-sandlight" />
          <div data-portrait className="overflow-hidden rounded-[24px] bg-navy shadow-[0_40px_80px_-40px_rgba(11,22,56,0.6)]">
            <SmartImage
              src={author.image}
              alt={`Portrait of ${author.name}`}
              loading="lazy"
              className="aspect-[4/5] h-full w-full object-cover"
              fallback={<div className="title grid aspect-[4/5] place-items-center text-8xl text-gold-light">WA</div>}
            />
          </div>
          <div className="card absolute -bottom-6 left-6 flex items-center gap-3 px-5 py-3.5">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-navy text-gold-light">
              <Stethoscope className="h-5 w-5" />
            </span>
            <span className="text-sm font-semibold text-navy">{author.credentials}</span>
          </div>
        </div>

        <div>
          <p data-reveal className="kicker">{author.eyebrow}</p>
          <h2 data-reveal className="title mt-4 text-[clamp(2.4rem,4.8vw,4rem)] text-navy">
            {author.name}
          </h2>
          <p data-reveal className="mt-6 text-[1.15rem] leading-[1.8] text-inkblue/85">
            {author.bio}
          </p>
          {author.highlights.length > 0 && (
            <dl data-reveal className="mt-10 grid grid-cols-3 gap-4">
              {author.highlights.map((h) => {
                const m = /^(\d+)(\+?)$/.exec(h.value.trim());
                return (
                  <div key={h.id} className="card px-4 py-5 text-center">
                    <dd className="title text-[clamp(2.2rem,3.4vw,3rem)] leading-none text-gold-deep" data-count={m ? m[1] : undefined} data-suffix={m ? m[2] : undefined}>
                      {h.value}
                    </dd>
                    <dt className="mt-2 text-xs leading-snug text-slate">{h.label}</dt>
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
