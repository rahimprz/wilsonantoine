import { useRef } from "react";
import { Star } from "lucide-react";
import type { SiteContent } from "../../data/types";
import { useReveal } from "../useReveal";

export default function Reviews({ reviews }: { reviews: SiteContent["reviews"] }) {
  const root = useRef<HTMLElement>(null);
  const items = reviews.items.filter((r) => r.quote.trim());
  useReveal(root, [items.length]);
  if (!items.length) return null;
  return (
    <section id="reviews" ref={root} className="py-20 md:py-28">
      <div className="wrap">
        <div className="mx-auto max-w-2xl text-center">
          <p data-reveal className="caps text-[0.7rem] text-gold-deep">{reviews.eyebrow}</p>
          <h2 data-reveal className="serif-head mt-3 text-[clamp(2.2rem,4vw,3.4rem)]">
            {reviews.heading}
          </h2>
          <div data-reveal className="rule-gold mx-auto mt-6 w-24" />
        </div>
        <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {items.map((r, i) => (
            <figure key={r.id} data-reveal={(i % 3) * 0.08} className="paper flex flex-col rounded-[6px] p-8">
              <div className="flex gap-1 text-gold" aria-label={`${r.rating} out of 5 stars`}>
                {Array.from({ length: 5 }, (_, k) => (
                  <Star key={k} className={`h-4 w-4 ${k < r.rating ? "fill-current" : "opacity-30"}`} />
                ))}
              </div>
              <blockquote className="mt-5 flex-1 font-[family-name:var(--font-heading)] text-[1.4rem] leading-snug text-ink-navy italic">“{r.quote}”</blockquote>
              <figcaption className="mt-6 flex items-center gap-3 border-t border-line pt-5">
                <span className="h-px w-6 bg-gold" />
                <span className="caps text-[0.68rem] text-ink-navy">{r.name}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
