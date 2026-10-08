import { useRef } from "react";
import { gsap, MOTION_OK, useGSAP } from "../../lib/gsap";
import type { SiteContent } from "../../data/types";
import SideLabel from "../components/SideLabel";
import SmartImage from "../components/SmartImage";
import { useReveal } from "../useReveal";

export default function Author({ author }: { author: SiteContent["author"] }) {
  const root = useRef<HTMLElement>(null);
  useReveal(root);
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        gsap.utils.toArray<HTMLElement>("[data-count]").forEach((el) => {
          const target = Number(el.dataset.count);
          const suffix = el.dataset.suffix ?? "";
          const s = { v: 0 };
          gsap.to(s, { v: target, duration: 1.8, ease: "power2.out", scrollTrigger: { trigger: el, start: "top 90%", once: true }, onUpdate: () => void (el.textContent = `${Math.round(s.v)}${suffix}`) });
        });
      });
    },
    { scope: root },
  );

  return (
    <section id="author" ref={root} className="py-20 md:py-28">
      <div className="wrap">
        <div className="panel relative grid items-center gap-12 px-6 py-12 md:px-14 md:py-16 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16 lg:pl-24">
          <SideLabel>The Author</SideLabel>
          <div className="order-2 lg:order-1">
            <p data-reveal className="caps text-[0.7rem] text-gold-deep">{author.eyebrow}</p>
            <h2 data-reveal className="serif-head mt-3 text-[clamp(2.2rem,4vw,3.4rem)]">
              {author.name}
            </h2>
            <p data-reveal className="mt-2 font-[family-name:var(--font-heading)] text-[1.2rem] text-gold-deep italic">
              {author.credentials}
            </p>
            <div data-reveal className="rule-gold mt-6 w-24" />
            <p data-reveal className="mt-6 text-[1.18rem] leading-relaxed">
              {author.bio}
            </p>
            {author.highlights.length > 0 && (
              <dl data-reveal className="mt-9 grid grid-cols-3 gap-3">
                {author.highlights.map((h) => {
                  const m = /^(\d+)(\+?)$/.exec(h.value.trim());
                  return (
                    <div key={h.id} className="rounded-[6px] border border-line bg-parchment px-3 py-5 text-center">
                      <dd className="serif-head text-[2.2rem] leading-none text-ink-navy" data-count={m ? m[1] : undefined} data-suffix={m ? m[2] : undefined}>
                        {h.value}
                      </dd>
                      <dt className="caps mt-2 text-[0.56rem] leading-relaxed text-muted">{h.label}</dt>
                    </div>
                  );
                })}
              </dl>
            )}
          </div>
          <div data-reveal className="order-1 lg:order-2">
            <div className="paper mx-auto w-full max-w-sm rounded-[6px] p-3">
              <SmartImage
                src={author.image}
                alt={`Portrait of ${author.name}`}
                loading="lazy"
                className="aspect-[4/5] w-full rounded-[3px] object-cover"
                fallback={<div className="grid aspect-[4/5] place-items-center rounded-[3px] bg-brand-navy font-[family-name:var(--font-heading)] text-7xl text-gold italic">WA</div>}
              />
              <p className="caps mt-3 text-center text-[0.6rem] text-muted">{author.name}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
