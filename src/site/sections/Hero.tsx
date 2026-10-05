import { useRef } from "react";
import { ArrowUpRight, BookOpen, Star } from "lucide-react";
import { gsap, MOTION_OK, useGSAP } from "../../lib/gsap";
import type { Retailer, SiteContent } from "../../data/types";
import BgVideo from "../components/BgVideo";
import Book3D from "../components/Book3D";
import SmartImage from "../components/SmartImage";
import { onBuyClick } from "../buy";

interface HeroProps {
  content: SiteContent;
  retailer?: Retailer;
  onExcerpt: () => void;
  showAnnouncement: boolean;
}

/** The book, front and centre: cover on the right, title, promise, author and the buy button on the left. */
export default function Hero({ content, retailer, onExcerpt, showAnnouncement }: HeroProps) {
  const root = useRef<HTMLElement>(null);
  const { hero, announcement, author, reviews, book } = content;
  const praise = reviews.items.find((r) => r.quote.trim());

  useGSAP(
    () => {
      const q = gsap.utils.selector(root);
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        gsap
          .timeline({ delay: 0.15 })
          .from(q("[data-sky]"), { opacity: 0, duration: 1.6, ease: "power2.out" })
          .from(q("[data-book]"), { y: 80, rotateY: -70, opacity: 0, duration: 1.8, ease: "expo.out" }, 0.1)
          .from(q("[data-in]"), { y: 30, opacity: 0, duration: 1.1, stagger: 0.09, ease: "expo.out" }, 0.3);
        // as you scroll on, the book rises a little and the sky deepens
        gsap.to(q("[data-book-par]"), { yPercent: -12, ease: "none", scrollTrigger: { trigger: root.current, start: "top top", end: "bottom top", scrub: true } });
        gsap.to(q("[data-sky]"), { yPercent: 18, ease: "none", scrollTrigger: { trigger: root.current, start: "top top", end: "bottom top", scrub: true } });
      });
    },
    { scope: root },
  );

  const credit = `by ${author.name}${/\bMD\b/.test(author.name) ? "" : ", MD"}`;

  return (
    <section id="home" ref={root} className="on-dark relative isolate overflow-hidden bg-navy text-white">
      <div data-sky className="absolute inset-0 -z-10">
        <SmartImage src={hero.backgroundImage} alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover opacity-50" fetchPriority="high" />
        <BgVideo src={hero.backgroundVideo} className="absolute inset-0 h-full w-full opacity-80 mix-blend-screen" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(11,22,56,0.95)_0%,rgba(11,22,56,0.75)_45%,rgba(11,22,56,0.2)_100%)] max-lg:bg-[linear-gradient(180deg,rgba(11,22,56,0.55),rgba(11,22,56,0.9))]" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-navy" />
      </div>

      <div className="wrap grid min-h-[100svh] items-center gap-12 pt-28 pb-16 lg:grid-cols-[1.1fr_0.9fr] lg:gap-8 lg:pt-24">
        <div className="max-lg:order-2 max-lg:text-center">
          {showAnnouncement && announcement.text && (
            <p data-in className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-4 py-1.5 text-[0.8rem] font-medium text-gold-light">
              <span className="h-1.5 w-1.5 rounded-full bg-gold-light" /> {announcement.text}
            </p>
          )}
          <h1 data-in className="title mt-6 text-[clamp(2.9rem,6.4vw,5.8rem)]">
            {hero.title}
          </h1>
          <p data-in className="mt-5 text-[clamp(1.2rem,1.9vw,1.55rem)] leading-snug text-white/90">
            {hero.subtitle}
          </p>
          <p data-in className="mt-4 font-medium text-gold-light">
            {credit}
          </p>

          <div data-in className="mt-9 flex flex-wrap gap-3 max-lg:justify-center">
            {retailer && (
              <a href={retailer.url} target="_blank" rel="noopener" onClick={() => onBuyClick(retailer)} className="btn-buy">
                Buy on {retailer.label} <ArrowUpRight className="h-4 w-4" />
              </a>
            )}
            <button onClick={onExcerpt} className="btn-ghost-light">
              <BookOpen className="h-4 w-4" /> {hero.primaryCta}
            </button>
          </div>
          {retailer && (
            <p data-in className="mt-4 text-sm text-white/60">
              Available now as a {retailer.format}
              {retailer.price && ` · ${retailer.price}`}
            </p>
          )}

          {praise && (
            <figure data-in className="mt-10 flex items-start gap-4 border-t border-white/10 pt-6 max-lg:justify-center max-lg:text-left">
              <div className="flex shrink-0 gap-0.5 pt-1 text-gold-light" aria-label={`${praise.rating} out of 5 stars`}>
                {Array.from({ length: 5 }, (_, i) => (
                  <Star key={i} className={`h-4 w-4 ${i < praise.rating ? "fill-current" : "opacity-30"}`} />
                ))}
              </div>
              <div>
                <blockquote className="title text-xl italic text-white/90">“{praise.quote}”</blockquote>
                <figcaption className="mt-1 text-sm text-white/55">— {praise.name}, reader</figcaption>
              </div>
            </figure>
          )}
        </div>

        <div className="relative max-lg:order-1">
          <div className="pointer-events-none absolute top-1/2 left-1/2 -z-10 h-[80%] w-[80%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(201,163,90,0.35),rgba(42,196,234,0.12)_60%,transparent)] blur-2xl" />
          <div data-book-par>
            <div data-book className="mx-auto w-[min(50vw,300px)] lg:w-[min(30vw,400px)]">
              <Book3D cover={book.cover} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
