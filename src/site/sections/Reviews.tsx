import { useRef } from "react";
import { Quote as QuoteIcon, Star } from "lucide-react";
import { gsap, MOTION_OK, useGSAP } from "../../lib/gsap";
import type { SiteContent } from "../../data/types";
import SectionHead from "../components/SectionHead";
import { useReveal } from "../useReveal";

export default function Reviews({ n, reviews }: { n?: number; reviews: SiteContent["reviews"] }) {
  const root = useRef<HTMLElement>(null);
  const items = reviews.items.filter((r) => r.quote.trim());
  const rated = items.filter((r) => r.rating > 0);
  const avg = rated.length ? rated.reduce((s, r) => s + r.rating, 0) / rated.length : 0;
  useReveal(root, [items.length]);
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        gsap.from("[data-review]", { y: 60, rotateX: -12, opacity: 0, duration: 1.3, stagger: 0.12, ease: "expo.out", transformPerspective: 900, scrollTrigger: { trigger: "[data-reviews]", start: "top 85%", once: true } });
      });
    },
    { scope: root, dependencies: [items.length] },
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
        <div data-reviews className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {items.map((r) => (
            <figure key={r.id} data-review className="glass group relative flex flex-col overflow-hidden rounded-[4px] p-8 transition-[translate,border-color,box-shadow] duration-500 hover:-translate-y-1.5 hover:border-gold/60 hover:shadow-[0_30px_60px_-30px_rgba(0,0,0,0.9)]">
              <QuoteIcon aria-hidden className="absolute top-6 right-6 h-12 w-12 rotate-180 text-gold/15 transition-colors duration-500 group-hover:text-gold/35" strokeWidth={1} />
              <div className="flex gap-1 text-gold" aria-label={`${r.rating} out of 5 stars`}>
                {Array.from({ length: 5 }, (_, k) => (
                  <Star key={k} className={`h-4 w-4 ${k < r.rating ? "fill-current" : "opacity-30"}`} />
                ))}
              </div>
              <blockquote className="mt-6 flex-1 font-[family-name:var(--font-heading)] text-[1.45rem] leading-snug text-star italic">“{r.quote}”</blockquote>
              <figcaption className="mt-7 flex items-center gap-3.5 border-t border-white/10 pt-5">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-gold-light to-gold-deep font-[family-name:var(--font-heading)] text-[1.05rem] text-night">
                  {r.name.trim().charAt(0).toUpperCase()}
                </span>
                <span>
                  <span className="block font-medium text-star">{r.name}</span>
                  <span className="caps text-[0.52rem] text-gold">Reader</span>
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
