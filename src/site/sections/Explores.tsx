import { useRef } from "react";
import type { SiteContent, Theme } from "../../data/types";
import { gsap, MOTION_OK, useGSAP } from "../../lib/gsap";
import { THEME_ICONS } from "../components/Icons";
import SectionHead from "../components/SectionHead";
import SmartImage from "../components/SmartImage";
import Stars from "../components/Stars";
import { useReveal } from "../useReveal";

function ThemeCard({ t, i, side }: { t: Theme; i: number; side: "l" | "r" }) {
  const Icon = THEME_ICONS[t.icon] ?? THEME_ICONS.sparkles;
  return (
    <article data-card={side} className="group glass relative overflow-hidden rounded-[4px] p-6 transition-[translate,border-color,box-shadow] duration-500 hover:-translate-y-1 hover:border-gold/60 hover:shadow-[0_30px_50px_-30px_rgba(181,159,120,0.5)] md:p-7">
      <span className="pointer-events-none absolute -top-10 -right-10 h-28 w-28 rounded-full bg-[radial-gradient(closest-side,rgba(181,159,120,0.25),transparent)] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
      <div className="flex items-center justify-between">
        <span className="grid h-12 w-12 place-items-center rounded-full border border-gold/45 text-gold transition-colors duration-500 group-hover:bg-gold group-hover:text-night">
          <Icon className="h-5 w-5" strokeWidth={1.5} />
        </span>
        <span className="font-[family-name:var(--font-heading)] text-[1.7rem] text-white/15 italic transition-colors duration-500 group-hover:text-gold/50">{String(i + 1).padStart(2, "0")}</span>
      </div>
      <h3 className="serif-head mt-5 text-[1.35rem]">{t.title}</h3>
      {t.text && <p className="mt-2 text-[0.98rem] leading-relaxed text-mist">{t.text}</p>}
    </article>
  );
}

export default function Explores({ n, explores }: { n?: number; explores: SiteContent["explores"] }) {
  const root = useRef<HTMLElement>(null);
  const half = Math.ceil(explores.themes.length / 2);
  const left = explores.themes.slice(0, half);
  const right = explores.themes.slice(half);
  useReveal(root, [explores.themes.length]);
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        gsap.fromTo("[data-earth]", { yPercent: -10, scale: 1.1 }, { yPercent: 10, scale: 1, ease: "none", scrollTrigger: { trigger: root.current, start: "top bottom", end: "bottom top", scrub: true } });
        gsap.utils.toArray<HTMLElement>("[data-card]").forEach((el, i) => {
          gsap.from(el, { x: el.dataset.card === "l" ? -50 : 50, opacity: 0, duration: 1.3, delay: (i % 3) * 0.08, ease: "expo.out", scrollTrigger: { trigger: el, start: "top 88%", once: true } });
        });
        gsap.fromTo("[data-centre]", { rotate: -6, y: 50 }, { rotate: 4, y: -50, ease: "none", scrollTrigger: { trigger: root.current, start: "top bottom", end: "bottom top", scrub: true } });
      });
    },
    { scope: root, dependencies: [explores.themes.length] },
  );

  return (
    <section id="explores" ref={root} className="relative isolate overflow-hidden py-20 md:py-28">
      <div data-earth className="absolute inset-0 -z-10">
        <SmartImage src={explores.backgroundImage} alt="" aria-hidden loading="lazy" className="h-full w-full object-cover opacity-50" />
      </div>
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,#0a1130_0%,rgba(42,54,99,0.82)_40%,rgba(42,54,99,0.82)_60%,#0a1130_100%)]" />
      <Stars className="absolute inset-0 -z-10 h-full w-full" density={14000} gold={0.15} />

      <div className="wrap">
        <SectionHead n={n} eyebrow={explores.eyebrow} title={explores.heading} intro={explores.intro} center />

        <div className="mt-16 grid items-center gap-6 lg:grid-cols-[1fr_minmax(260px,0.8fr)_1fr] lg:gap-8">
          <div className="order-2 grid gap-5 sm:grid-cols-2 lg:order-1 lg:grid-cols-1">
            {left.map((t, i) => (
              <ThemeCard key={t.id} t={t} i={i} side="l" />
            ))}
          </div>
          <div className="relative order-1 mx-auto w-full max-w-[380px] lg:order-2">
            <div aria-hidden className="absolute inset-[-8%] rounded-full border border-gold/20">
              <span className="absolute inset-[8%] rounded-full border border-dashed border-cyan/20 [animation:spin-rev_70s_linear_infinite]" />
              <span className="absolute inset-0 rounded-full bg-[radial-gradient(closest-side,rgba(42,196,234,0.25),rgba(24,54,165,0.25)_55%,transparent)] animate-pulse-glow" />
            </div>
            <div data-centre>
              <SmartImage src={explores.image} alt="Postmortem Life Continuation" loading="lazy" className="relative h-auto w-full drop-shadow-[0_40px_40px_rgba(0,0,0,0.6)]" />
            </div>
          </div>
          <div className="order-3 grid gap-5 sm:grid-cols-2 lg:grid-cols-1">
            {right.map((t, i) => (
              <ThemeCard key={t.id} t={t} i={half + i} side="r" />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
