import { useEffect, useRef, useState } from "react";
import { gsap, prefersReducedMotion, SplitText } from "../../lib/gsap";
import type { SiteContent } from "../../data/types";
import Label from "../components/Label";

const DWELL = 7000;

/** Reader reviews, one at a time and large, cycling on a timer shown by the active tab's line. */
export default function Voices({ reviews }: { reviews: SiteContent["reviews"] }) {
  const items = reviews.items.filter((r) => r.quote.trim());
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const quote = useRef<HTMLQuoteElement>(null);
  const current = items[index % Math.max(1, items.length)];

  // advance on a timer (paused while hovered or focused)
  useEffect(() => {
    if (paused || items.length < 2) return;
    const t = setTimeout(() => setIndex((i) => (i + 1) % items.length), DWELL);
    return () => clearTimeout(t);
  }, [index, paused, items.length]);

  // each new quote rises in word by word
  useEffect(() => {
    if (!quote.current || prefersReducedMotion()) return;
    // no mask: a mask would clip the italic descenders
    const split = SplitText.create(quote.current, { type: "words" });
    const tween = gsap.from(split.words, { y: 40, opacity: 0, filter: "blur(8px)", duration: 1.1, stagger: 0.04, ease: "expo.out" });
    return () => {
      tween.kill();
      split.revert();
    };
  }, [index]);

  if (!current) return null;
  return (
    <section
      id="reviews"
      className="relative overflow-hidden bg-ink py-24 text-ivory md:py-36"
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="pointer-events-none absolute -bottom-1/3 left-1/2 h-[70vh] w-[70vw] -translate-x-1/2 rounded-full bg-ember/20 blur-[140px]" />
      <div className="wrap relative">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <Label n={7} className="text-dawn">
            {reviews.eyebrow}
          </Label>
          <p className="label text-[0.65rem] text-sand">{reviews.heading}</p>
        </div>

        <figure className="mt-16 min-h-[42svh] md:mt-24" aria-live="polite">
          <div className="flex gap-1.5 text-dawn" aria-label={`${current.rating} out of 5 stars`}>
            {Array.from({ length: 5 }, (_, i) => (
              <span key={i} className={i < current.rating ? "" : "opacity-25"}>★</span>
            ))}
          </div>
          <blockquote key={current.id} ref={quote} className="display mt-8 max-w-[22ch] text-[clamp(2.6rem,7vw,7.4rem)] leading-[1.05] italic">
            “{current.quote}”
          </blockquote>
          <figcaption className="label mt-10 text-[0.7rem] text-sand">— {current.name}</figcaption>
        </figure>

        {items.length > 1 && (
          <div className="mt-14 grid gap-4" style={{ gridTemplateColumns: `repeat(${Math.min(items.length, 6)}, minmax(0, 1fr))` }} role="tablist" aria-label="Reviews">
            {items.map((r, i) => (
              <button key={r.id} role="tab" aria-selected={i === index} onClick={() => setIndex(i)} className="group text-left">
                <span className="relative block h-px w-full overflow-hidden bg-ivory/20">
                  <span
                    key={i === index ? `on-${index}` : "off"}
                    className="absolute inset-0 origin-left bg-dawn"
                    style={{
                      transform: i === index ? undefined : "scaleX(0)",
                      animation: i === index && !paused && items.length > 1 ? `grow-x ${DWELL}ms linear forwards` : undefined,
                    }}
                  />
                </span>
                <span className={`label mt-3 block truncate text-[0.62rem] transition-colors ${i === index ? "text-ivory" : "text-sand group-hover:text-ivory"}`}>
                  {String(i + 1).padStart(2, "0")} {r.name}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
