import { useRef } from "react";
import { Stethoscope } from "lucide-react";
import { gsap, MOTION_OK, useGSAP } from "../../lib/gsap";
import { resolveMedia } from "../../lib/media";
import type { SiteContent } from "../../data/types";
import SectionHead from "../components/SectionHead";
import SmartImage from "../components/SmartImage";
import { useReveal } from "../useReveal";

export default function Author({ n, author, logo }: { n?: number; author: SiteContent["author"]; logo: string }) {
  const root = useRef<HTMLElement>(null);
  useReveal(root, [author.highlights.length]);
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        gsap.from("[data-portrait]", { clipPath: "inset(100% 0% 0% 0%)", duration: 1.8, ease: "expo.inOut", scrollTrigger: { trigger: "[data-portrait]", start: "top 80%", once: true } });
        gsap.from("[data-offset]", { x: -30, y: -30, opacity: 0, duration: 1.6, delay: 0.5, ease: "expo.out", scrollTrigger: { trigger: "[data-portrait]", start: "top 80%", once: true } });
        gsap.fromTo("[data-portrait-img]", { scale: 1.15, yPercent: -4 }, { scale: 1, yPercent: 4, ease: "none", scrollTrigger: { trigger: root.current, start: "top bottom", end: "bottom top", scrub: true } });
        gsap.utils.toArray<HTMLElement>("[data-count]").forEach((el) => {
          const target = Number(el.dataset.count);
          const suffix = el.dataset.suffix ?? "";
          const s = { v: 0 };
          gsap.to(s, { v: target, duration: 2, ease: "power2.out", scrollTrigger: { trigger: el, start: "top 92%", once: true }, onUpdate: () => void (el.textContent = `${Math.round(s.v)}${suffix}`) });
        });
      });
    },
    { scope: root },
  );

  const logoUrl = resolveMedia(logo);
  return (
    <section id="author" ref={root} className="relative isolate overflow-hidden bg-[linear-gradient(180deg,#0a1130,#101a45_50%,#0a1130)] py-20 md:py-28">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute top-[10%] left-[-10%] h-[520px] w-[520px] rounded-full bg-[radial-gradient(closest-side,rgba(51,84,210,0.35),transparent)] [animation:drift-a_18s_ease-in-out_infinite]" />
        <div className="absolute right-[-8%] bottom-[5%] h-[460px] w-[460px] rounded-full bg-[radial-gradient(closest-side,rgba(181,159,120,0.16),transparent)] [animation:drift-b_22s_ease-in-out_infinite]" />
      </div>
      <div className="wrap grid items-center gap-14 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
        <div className="relative mx-auto w-full max-w-[420px]">
          <div data-offset aria-hidden className="absolute inset-0 translate-x-5 translate-y-5 rounded-[4px] border border-gold/50" />
          <div data-portrait className="corners relative overflow-hidden rounded-[4px] bg-indigo shadow-[0_50px_80px_-40px_rgba(0,0,0,0.95)]">
            <div data-portrait-img>
              <SmartImage
                src={author.image}
                alt={`Portrait of ${author.name}`}
                loading="lazy"
                className="aspect-[4/5] w-full object-cover"
                fallback={
                  <div className="relative grid aspect-[4/5] place-items-center bg-[radial-gradient(80%_70%_at_50%_45%,#1a2c7a,#0a1130)] p-12">
                    <span className="stars-bg pointer-events-none absolute inset-0" />
                    {logoUrl ? <img src={logoUrl} alt="" className="relative w-full opacity-90" /> : <span className="font-[family-name:var(--font-heading)] text-7xl text-gold italic">WA</span>}
                  </div>
                }
              />
            </div>
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#0a1015]/95 via-[#0a1015]/60 to-transparent px-6 pt-16 pb-5">
              <p className="serif-head text-[1.4rem]">{author.name}</p>
              <p className="caps mt-1 inline-flex items-center gap-2 text-[0.56rem] text-gold-light">
                <Stethoscope className="h-3.5 w-3.5" /> {author.credentials}
              </p>
            </div>
          </div>
        </div>

        <div>
          <SectionHead n={n} eyebrow={author.eyebrow} title={author.name} />
          <p data-reveal className="mt-5 font-[family-name:var(--font-heading)] text-[1.3rem] text-gold-light italic">
            {author.credentials}
          </p>
          <p data-reveal className="mt-6 text-[1.14rem] leading-relaxed text-mist">
            {author.bio}
          </p>
          {author.highlights.length > 0 && (
            <dl data-reveal className="mt-10 grid grid-cols-3 gap-3 md:gap-4">
              {author.highlights.map((h) => {
                const m = /^(\d+)(\+?)$/.exec(h.value.trim());
                return (
                  <div key={h.id} className="glass rounded-[4px] px-3 py-6 text-center">
                    <dd className="serif-head gold-text text-[2.3rem] leading-none md:text-[2.7rem]" data-count={m ? m[1] : undefined} data-suffix={m ? m[2] : undefined}>
                      {h.value}
                    </dd>
                    <dt className="caps mt-3 text-[0.52rem] leading-relaxed text-mist">{h.label}</dt>
                  </div>
                );
              })}
            </dl>
          )}
          <p data-reveal className="mt-10 font-[family-name:var(--font-heading)] text-[2rem] text-gold/80 italic">
            — {author.name.replace(/^Dr\.?\s+/i, "")}
          </p>
        </div>
      </div>
    </section>
  );
}
