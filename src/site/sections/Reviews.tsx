import { useRef } from "react";
import { Star } from "lucide-react";
import { gsap, MOTION_OK, useGSAP } from "../../lib/gsap";
import type { Review, SiteContent } from "../../data/types";
import RevealText from "../components/RevealText";

function ReviewCard({ review }: { review: Review }) {
  return (
    <figure className="relative mx-3 flex w-[300px] shrink-0 flex-col rounded-[10px] border-2 border-gold/80 bg-[linear-gradient(160deg,rgba(255,255,255,0.06),rgba(255,255,255,0.01))] p-7 backdrop-blur-sm sm:w-[380px]">
      <div className="flex gap-1 text-gold" aria-label={`${review.rating} out of 5 stars`}>
        {Array.from({ length: 5 }, (_, i) => (
          <Star key={i} className={`h-5 w-5 ${i < review.rating ? "fill-current" : "opacity-30"}`} />
        ))}
      </div>
      <blockquote className="mt-5 flex-1 font-serif text-[1.55rem] leading-snug text-white italic">“{review.quote}”</blockquote>
      <figcaption className="mt-6 flex items-center gap-3">
        <span className="h-px w-8 bg-gold" />
        <span className="font-body text-sm font-semibold tracking-[0.18em] text-gold-light uppercase">{review.name}</span>
      </figcaption>
    </figure>
  );
}

export default function Reviews({ reviews }: { reviews: SiteContent["reviews"] }) {
  const root = useRef<HTMLElement>(null);
  const items = reviews.items.filter((r) => r.quote.trim());

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        gsap.from("[data-rows]", { opacity: 0, y: 50, duration: 1.4, scrollTrigger: { trigger: root.current, start: "top 70%", once: true } });
      });
    },
    { scope: root },
  );

  if (!items.length) return null;
  // enough copies for each half of the loop to overfill the widest screens
  const copies = Math.max(2, Math.ceil(8 / items.length));
  const row = Array.from({ length: copies }, () => items).flat();
  const rowB = [...row].reverse();

  return (
    <section id="reviews" ref={root} className="relative z-10 overflow-hidden py-28 md:py-36">
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#03050d,#141d47_30%,#2a3663_60%,#03050d)]" />
      <div className="pointer-events-none absolute top-1/3 left-1/2 h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-azure/30 blur-[140px] [animation:drift-a_16s_ease-in-out_infinite]" />
      <div className="container-site relative text-center">
        <p className="eyebrow justify-center">{reviews.eyebrow}</p>
        <RevealText className="heading-lg mt-5 text-white">{reviews.heading}</RevealText>
      </div>
      <div data-rows className="relative mt-16 space-y-6 [mask-image:linear-gradient(90deg,transparent,black_10%,black_90%,transparent)]">
        <div className="marquee-pause flex overflow-hidden">
          <div className="marquee-track flex w-max" style={{ ["--marquee-duration" as string]: `${row.length * 7}s` }}>
            {[...row, ...row].map((r, i) => (
              <ReviewCard key={`a${i}`} review={r} />
            ))}
          </div>
        </div>
        <div className="marquee-pause flex overflow-hidden">
          <div className="marquee-track flex w-max" style={{ ["--marquee-duration" as string]: `${row.length * 8}s`, ["--marquee-direction" as string]: "reverse" }}>
            {[...rowB, ...rowB].map((r, i) => (
              <ReviewCard key={`b${i}`} review={r} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
