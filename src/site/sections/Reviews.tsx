import { useRef } from "react";
import { Quote, Star } from "lucide-react";
import type { SiteContent } from "../../data/types";
import { useReveal } from "../useReveal";

export default function Reviews({ reviews }: { reviews: SiteContent["reviews"] }) {
  const root = useRef<HTMLElement>(null);
  const items = reviews.items.filter((r) => r.quote.trim());
  useReveal(root, [items.length]);
  if (!items.length) return null;
  return (
    <section id="reviews" ref={root} className="relative py-24 md:py-32">
      <div className="wrap">
        <div className="mx-auto max-w-2xl text-center">
          <p data-reveal className="kicker">{reviews.eyebrow}</p>
          <h2 data-reveal className="title mt-4 text-[clamp(2.4rem,4.8vw,4rem)] text-navy">
            {reviews.heading}
          </h2>
        </div>
        <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {items.map((r, i) => (
            <figure key={r.id} data-reveal={(i % 3) * 0.08} className="card relative flex flex-col p-8">
              <Quote className="absolute top-7 right-7 h-8 w-8 text-gold/30" />
              <div className="flex gap-1 text-gold" aria-label={`${r.rating} out of 5 stars`}>
                {Array.from({ length: 5 }, (_, k) => (
                  <Star key={k} className={`h-4 w-4 ${k < r.rating ? "fill-current" : "opacity-30"}`} />
                ))}
              </div>
              <blockquote className="title mt-5 flex-1 text-[1.65rem] leading-snug text-navy">“{r.quote}”</blockquote>
              <figcaption className="mt-6 flex items-center gap-3 border-t border-navy/10 pt-5">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-navy text-sm font-semibold text-gold-light">
                  {r.name.split(/\s+/).map((w) => w[0]).join("").slice(0, 2)}
                </span>
                <span className="font-semibold text-navy">{r.name}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
