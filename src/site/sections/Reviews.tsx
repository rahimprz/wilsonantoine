import { useEffect, useRef, useState } from "react";
import { Star } from "lucide-react";
import { gsap, MOTION_OK, prefersReducedMotion, useGSAP } from "../../lib/gsap";
import type { SiteContent } from "../../data/types";
import SectionHead from "../components/SectionHead";
import { useReveal } from "../useReveal";

const HOLD = 6500;

/** One reader's words at a time, large and centred, turning over slowly; pick a reader to jump to them. */
export default function Reviews({ n, reviews }: { n?: number; reviews: SiteContent["reviews"] }) {
  const root = useRef<HTMLElement>(null);
  const items = reviews.items.filter((r) => r.quote.trim());
  const rated = items.filter((r) => r.rating > 0);
  const avg = rated.length ? rated.reduce((s, r) => s + r.rating, 0) / rated.length : 0;
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const current = Math.min(active, Math.max(0, items.length - 1));
  useReveal(root, [items.length]);

  useEffect(() => {
    if (items.length < 2 || paused || prefersReducedMotion()) return;
    const t = setTimeout(() => setActive((a) => (a + 1) % items.length), HOLD);
    return () => clearTimeout(t);
  }, [current, paused, items.length]);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        gsap.from("[data-qmark]", { scale: 0.5, opacity: 0, rotate: -10, duration: 1.6, ease: "expo.out", scrollTrigger: { trigger: "[data-stage]", start: "top 85%", once: true } });
      });
    },
    { scope: root },
  );

  if (!items.length) return null;
  return (
    <section id="reviews" ref={root} className="relative isolate overflow-hidden bg-[linear-gradient(180deg,#0a1130_0%,#1f2b5c_22%,#2a3663_50%,#1f2b5c_78%,#0a1130_100%)] py-20 md:py-28">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute top-[-20%] left-1/2 h-[640px] w-[640px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(51,84,210,0.5),transparent)] [animation:drift-a_20s_ease-in-out_infinite]" />
        <div className="stars-bg absolute inset-0 opacity-50" />
      </div>
      <div className="wrap">
        <SectionHead n={n} eyebrow={reviews.eyebrow} title={reviews.heading} center />
        {avg > 0 && (
          <p data-reveal className="mt-6 flex items-center justify-center gap-3 text-mist">
            <span className="flex gap-0.5 text-gold">
              {Array.from({ length: 5 }, (_, k) => (
                <Star key={k} className={`h-4 w-4 ${k < Math.round(avg) ? "fill-current" : "opacity-30"}`} />
              ))}
            </span>
            <span>
              <strong className="font-semibold text-star">{avg.toFixed(1)}</strong> average from readers
            </span>
          </p>
        )}

        <div data-stage data-reveal className="relative mx-auto mt-14 max-w-4xl text-center" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
          <span data-qmark aria-hidden className="block h-20 font-[family-name:var(--font-heading)] text-[9rem] leading-[0.95] text-gold/40">
            “
          </span>
          <div className="grid" aria-live="polite">
            {items.map((r, i) => (
              <figure
                key={r.id}
                aria-hidden={i !== current}
                className={`col-start-1 row-start-1 transition-[opacity,translate] duration-1000 ease-[var(--ease-out-expo)] ${i === current ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"}`}
              >
                <blockquote className="font-[family-name:var(--font-heading)] text-[clamp(1.9rem,3.8vw,3.1rem)] leading-[1.25] text-star italic">{r.quote}</blockquote>
                <figcaption className="mt-6 flex items-center justify-center gap-3">
                  <span className="flex gap-0.5 text-gold" aria-label={`${r.rating} out of 5 stars`}>
                    {Array.from({ length: 5 }, (_, k) => (
                      <Star key={k} className={`h-3.5 w-3.5 ${k < r.rating ? "fill-current" : "opacity-30"}`} />
                    ))}
                  </span>
                  <span className="h-px w-8 bg-gold/50" />
                  <span className="caps text-[0.62rem] text-gold-light">{r.name}</span>
                </figcaption>
              </figure>
            ))}
          </div>

          {items.length > 1 && (
            <div className="mt-12 flex flex-wrap items-start justify-center gap-6 md:gap-10" role="tablist" aria-label="Choose a review">
              {items.map((r, i) => (
                <button key={r.id} role="tab" aria-selected={i === current} onClick={() => setActive(i)} className="group flex w-24 flex-col items-center gap-2.5">
                  <span
                    className={`grid h-12 w-12 place-items-center rounded-full font-[family-name:var(--font-heading)] text-[1.15rem] transition-all duration-500 ${
                      i === current ? "bg-gradient-to-br from-gold-light to-gold-deep text-night shadow-[0_0_30px_-4px_rgba(181,159,120,0.7)]" : "border border-gold/40 text-gold-light group-hover:border-gold"
                    }`}
                  >
                    {r.name.trim().charAt(0).toUpperCase()}
                  </span>
                  <span className={`text-sm transition-colors ${i === current ? "text-star" : "text-mist group-hover:text-star"}`}>{r.name}</span>
                  <span className="relative h-px w-full overflow-hidden bg-white/10">
                    {i === current && <span key={`${current}-${paused}`} className={`absolute inset-y-0 left-0 w-full origin-left bg-gold ${paused ? "" : "animate-[grow-x_6.5s_linear_both]"}`} />}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
