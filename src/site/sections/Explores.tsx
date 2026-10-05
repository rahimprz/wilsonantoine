import { useRef } from "react";
import { gsap, MOTION_OK, useGSAP } from "../../lib/gsap";
import type { SiteContent, Theme } from "../../data/types";
import Book3D from "../components/Book3D";
import { THEME_ICONS } from "../components/Icons";
import RevealText from "../components/RevealText";
import SmartImage from "../components/SmartImage";

function ThemeCard({ theme, index, side }: { theme: Theme; index: number; side: "left" | "right" }) {
  const Icon = THEME_ICONS[theme.icon] ?? THEME_ICONS.sparkles;
  return (
    <article
      data-card
      data-side={side}
      className={`group relative overflow-hidden rounded-2xl border border-white/10 bg-[radial-gradient(120%_120%_at_0%_0%,rgba(1,13,25,0.85),rgba(1,13,25,0.35))] p-6 backdrop-blur-md transition-[transform,border-color,box-shadow] duration-500 hover:-translate-y-1.5 hover:border-gold/50 hover:shadow-[0_30px_60px_-30px_rgba(181,159,120,0.55)] ${
        side === "left" ? "lg:text-right" : ""
      }`}
    >
      <div className="pointer-events-none absolute -top-16 -right-16 h-40 w-40 rounded-full bg-gold/0 blur-3xl transition-colors duration-700 group-hover:bg-gold/20" />
      <div className={`flex items-center gap-4 ${side === "left" ? "lg:flex-row-reverse" : ""}`}>
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full border border-gold/50 bg-gold/10 text-gold transition-all duration-500 group-hover:rotate-[360deg] group-hover:bg-gold group-hover:text-void">
          <Icon className="h-5 w-5" strokeWidth={1.6} />
        </span>
        <span className="font-body text-sm font-medium tracking-[0.3em] text-gold/80 tabular-nums">{String(index + 1).padStart(2, "0")}</span>
      </div>
      <h3 className="mt-5 font-display text-[1.25rem] leading-snug font-semibold text-white">{theme.title}</h3>
      {theme.text && <p className="mt-2 text-[0.98rem] leading-relaxed text-mist">{theme.text}</p>}
    </article>
  );
}

export default function Explores({ explores }: { explores: SiteContent["explores"] }) {
  const root = useRef<HTMLElement>(null);
  const half = Math.ceil(explores.themes.length / 2);
  const left = explores.themes.slice(0, half);
  const right = explores.themes.slice(half);

  useGSAP(
    () => {
      const q = gsap.utils.selector(root);
      const mm = gsap.matchMedia();
      // "zoom-out-slow" on the Earth backdrop, like the original, but tied to scroll
      mm.add(MOTION_OK, () => {
        gsap.fromTo(q("[data-earth]"), { scale: 1.3, yPercent: -6 }, { scale: 1, yPercent: 6, ease: "none", scrollTrigger: { trigger: root.current, start: "top bottom", end: "bottom top", scrub: true } });
        gsap.from(q("[data-intro]"), { y: 30, opacity: 0, duration: 1.1, scrollTrigger: { trigger: root.current, start: "top 70%", once: true } });
        gsap.from(q("[data-center]"), {
          scale: 0.6,
          opacity: 0,
          rotate: -10,
          duration: 1.8,
          ease: "expo.out",
          scrollTrigger: { trigger: q("[data-grid]")[0], start: "top 75%", once: true },
        });
        gsap.fromTo(q("[data-center-par]"), { yPercent: 10 }, { yPercent: -10, ease: "none", scrollTrigger: { trigger: q("[data-grid]")[0], scrub: true } });
      });
      // cards emerge from behind the book toward their column
      mm.add(`${MOTION_OK} and (min-width: 1024px)`, () => {
        q("[data-card]").forEach((card, i) => {
          const fromLeft = card.getAttribute("data-side") === "left";
          gsap.from(card, {
            x: fromLeft ? 160 : -160,
            scale: 0.75,
            opacity: 0,
            rotateY: fromLeft ? -25 : 25,
            duration: 1.5,
            delay: 0.25 + (i % 3) * 0.14,
            ease: "expo.out",
            scrollTrigger: { trigger: q("[data-grid]")[0], start: "top 70%", once: true },
          });
        });
      });
      mm.add(`${MOTION_OK} and (max-width: 1023px)`, () => {
        q("[data-card]").forEach((card) => {
          gsap.from(card, { y: 50, opacity: 0, duration: 1.1, scrollTrigger: { trigger: card, start: "top 88%", once: true } });
        });
      });
    },
    { scope: root, dependencies: [explores.themes.length] },
  );

  return (
    <section id="explores" ref={root} className="relative z-10 overflow-hidden py-28 md:py-40">
      <div className="absolute inset-0 -z-0">
        <div data-earth className="absolute inset-0">
          <SmartImage src={explores.backgroundImage} alt="" aria-hidden loading="lazy" className="h-full w-full object-cover" />
        </div>
        <div className="absolute inset-0 bg-indigo/55 mix-blend-multiply" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,#03050d_0%,rgba(3,5,13,0.35)_22%,rgba(3,5,13,0.35)_78%,#03050d_100%)]" />
      </div>

      <div className="container-site relative">
        <div className="mx-auto max-w-3xl text-center">
          <p data-intro className="eyebrow justify-center">
            {explores.eyebrow}
          </p>
          <RevealText className="heading-lg mt-5 text-white">{explores.heading}</RevealText>
          {explores.intro && (
            <p data-intro className="mt-5 text-lg text-mist">
              {explores.intro}
            </p>
          )}
        </div>

        <div data-grid className="mt-16 grid items-center gap-6 [perspective:1400px] md:grid-cols-2 lg:mt-20 lg:grid-cols-[1fr_minmax(0,1.1fr)_1fr] lg:gap-8">
          <div className="grid gap-6">
            {left.map((t, i) => (
              <ThemeCard key={t.id} theme={t} index={i} side="left" />
            ))}
          </div>
          <div data-center className="relative order-first mx-auto w-full max-w-md md:col-span-2 lg:order-none lg:col-span-1">
            <div data-center-par className="relative">
              <div className="pointer-events-none absolute inset-[6%] rounded-full border border-dashed border-gold/30 animate-spin-slow" />
              <div className="pointer-events-none absolute inset-[16%] rounded-full bg-[radial-gradient(circle,rgba(42,196,234,0.35),transparent_70%)] blur-2xl" />
              <SmartImage
                src={explores.image}
                alt="Postmortem Life Continuation book mockup"
                loading="lazy"
                className="relative h-auto w-full drop-shadow-[0_40px_60px_rgba(0,0,0,0.7)]"
                fallback={<Book3D className="mx-auto w-[60%] py-8" />}
              />
            </div>
          </div>
          <div className="grid gap-6">
            {right.map((t, i) => (
              <ThemeCard key={t.id} theme={t} index={i + half} side="right" />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
