import { useRef } from "react";
import { ArrowRight, BookOpen, Sparkles } from "lucide-react";
import { gsap, MOTION_OK, useGSAP } from "../../lib/gsap";
import type { Retailer, SiteContent } from "../../data/types";
import SmartImage from "../components/SmartImage";
import { onBuyClick } from "../buy";
import { scrollToTarget } from "../smooth";

interface HeroProps {
  content: SiteContent;
  retailer?: Retailer;
  onExcerpt: () => void;
}

export default function Hero({ content, retailer, onExcerpt }: HeroProps) {
  const root = useRef<HTMLElement>(null);
  const { hero, author, chapters } = content;

  useGSAP(
    () => {
      const q = gsap.utils.selector(root);
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        gsap
          .timeline({ defaults: { ease: "power3.out" } })
          .from(q("[data-in]"), { y: 26, opacity: 0, duration: 1, stagger: 0.08 })
          .from(q("[data-books]"), { y: 40, opacity: 0, duration: 1.3 }, 0.15)
          .from(q("[data-badge]"), { y: -14, opacity: 0, duration: 0.8 }, 0.7)
          .from(q("[data-card]"), { y: 30, opacity: 0, duration: 1 }, 0.55);
        gsap.to(q("[data-float]"), { y: -10, duration: 3.2, ease: "sine.inOut", yoyo: true, repeat: -1 });
      });
    },
    { scope: root },
  );

  return (
    <section id="home" ref={root} className="relative overflow-hidden border-b border-line pt-[84px]">
      <div className="pointer-events-none absolute top-0 right-0 h-[620px] w-[620px] translate-x-1/3 -translate-y-1/4 rounded-full bg-[radial-gradient(closest-side,rgba(42,54,99,0.10),transparent)]" />
      <div className="wrap grid min-h-[calc(100svh-84px)] items-center gap-14 py-16 lg:grid-cols-[1fr_1fr] lg:gap-10 lg:py-20">
        <div>
          {hero.eyebrow && (
            <p data-in className="tag caps text-[0.68rem]">
              <Sparkles className="h-3.5 w-3.5" /> {hero.eyebrow}
            </p>
          )}
          <h1 data-in className="serif-head mt-8 text-[clamp(2.8rem,5.6vw,5.2rem)] leading-[1.02]">
            {hero.title}
          </h1>
          <div data-in className="mt-6 flex flex-wrap items-center gap-4">
            <span className="font-[family-name:var(--font-heading)] text-[1.35rem] text-gold-deep italic">by {author.name}</span>
            <span className="h-px w-16 bg-gold/60" />
            <span className="caps text-[0.68rem] text-ink-navy">{author.credentials.replace(/\s*·\s*/g, " · ")}</span>
          </div>
          <p data-in className="mt-6 max-w-xl text-[1.3rem] leading-relaxed text-ink-soft">
            {hero.subtitle}.
          </p>
          <div data-in className="mt-7 flex flex-wrap gap-3">
            {retailer && (
              <span className="chip">
                <span className="h-2 w-2 rounded-full bg-emerald-600" />
                <strong className="font-semibold">{retailer.format}</strong>
                <span className="text-sm text-muted">Available now</span>
              </span>
            )}
            {chapters.items.length > 0 && (
              <span className="chip">
                <BookOpen className="h-4 w-4 text-gold" />
                <strong className="font-semibold">Inside the Book</strong>
                <span className="text-sm text-muted">({chapters.items.length} featured chapters)</span>
              </span>
            )}
          </div>
          <div data-in className="mt-10 flex flex-wrap gap-4">
            {retailer && (
              <a href={retailer.url} target="_blank" rel="noopener" onClick={() => onBuyClick(retailer)} className="btn-solid">
                Buy on {retailer.label} <ArrowRight className="h-4 w-4" />
              </a>
            )}
            <button onClick={onExcerpt} className="btn-line">
              {hero.primaryCta}
            </button>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-[640px]">
          <div data-books className="relative">
            <span data-badge className="caps absolute top-0 left-1/2 z-10 inline-flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-full bg-ink-navy px-5 py-2.5 text-[0.65rem] text-white shadow-lg">
              <Sparkles className="h-3.5 w-3.5 text-gold" /> Featured Book
            </span>
            <div data-float className="pt-8">
              <SmartImage
                src={content.book.image}
                alt={`${hero.title} — paperback, hardcover and back cover`}
                fetchPriority="high"
                className="h-auto w-full drop-shadow-[0_30px_35px_rgba(30,39,73,0.35)]"
                fallback={<SmartImage src={content.book.cover} alt={hero.title} className="mx-auto h-auto w-1/2 shadow-2xl" />}
              />
            </div>
          </div>

          <div data-card className="paper relative mx-auto mt-6 max-w-md rounded-[6px] px-8 py-7 text-center">
            <p className="serif-head text-[1.55rem]">{hero.title}</p>
            <p className="mt-1 text-muted">by {author.name}</p>
            <div className="mt-4 flex items-center justify-center gap-4 text-[0.98rem] text-ink-navy">
              <span className="inline-flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-gold" /> {chapters.items.length} Chapters
              </span>
              <span className="h-px w-10 bg-line" />
              <span className="inline-flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-gold" /> {retailer?.format ?? "Book"}
              </span>
            </div>
            <button onClick={() => scrollToTarget("#about-book")} className="btn-solid mt-6 !px-6 !py-3.5">
              Discover the Book <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
