import { Fragment, useRef } from "react";
import { ArrowRight, BookOpen, Feather, Sparkles, Star } from "lucide-react";
import { gsap, MOTION_OK, useGSAP } from "../../lib/gsap";
import type { Retailer, SiteContent } from "../../data/types";
import BgVideo from "../components/BgVideo";
import SmartImage from "../components/SmartImage";
import Stars from "../components/Stars";
import { onBuyClick } from "../buy";
import { scrollToTarget } from "../smooth";

interface HeroProps {
  content: SiteContent;
  retailer?: Retailer;
  onExcerpt: () => void;
  topOffset: number;
}

export default function Hero({ content, retailer, onExcerpt, topOffset }: HeroProps) {
  const root = useRef<HTMLElement>(null);
  const { hero, author, chapters, reviews, explores } = content;
  const words = hero.title.trim().split(/\s+/);
  const review = reviews.items.find((r) => r.quote.trim());
  const rated = reviews.items.filter((r) => r.rating > 0);
  const avg = rated.length ? rated.reduce((s, r) => s + r.rating, 0) / rated.length : 0;

  useGSAP(
    () => {
      const q = gsap.utils.selector(root);
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        gsap
          .timeline({ defaults: { ease: "expo.out" }, delay: 0.15 })
          .from(q("[data-bg]"), { scale: 1.18, opacity: 0, duration: 2.6, ease: "power2.out" }, 0)
          .from(q("[data-tag]"), { y: 18, opacity: 0, duration: 1 }, 0.2)
          .from(q("[data-w]"), { yPercent: 110, rotate: 4, opacity: 0, duration: 1.4, stagger: 0.09 }, 0.3)
          .from(q("[data-in]"), { y: 26, opacity: 0, duration: 1.1, stagger: 0.08 }, 0.75)
          .from(q("[data-ring]"), { scale: 0.6, opacity: 0, duration: 2, stagger: 0.12 }, 0.3)
          .from(q("[data-books]"), { y: 70, scale: 0.92, opacity: 0, duration: 1.8 }, 0.45)
          .from(q("[data-badge]"), { y: -16, opacity: 0, duration: 1, stagger: 0.1 }, 1.1)
          .from(q("[data-card]"), { y: 40, opacity: 0, duration: 1.3 }, 1)
          .from(q("[data-cue]"), { opacity: 0, duration: 1 }, 1.6);

        gsap.to(q("[data-float]"), { y: -12, duration: 3.6, ease: "sine.inOut", yoyo: true, repeat: -1 });
        q("[data-bob]").forEach((el, i) => gsap.to(el, { y: i % 2 ? 9 : -9, duration: 2.6 + i * 0.7, ease: "sine.inOut", yoyo: true, repeat: -1 }));

        // scroll: background drifts slower than the page, the copy lifts and fades
        const st = { trigger: root.current, start: "top top", end: "bottom top", scrub: true };
        gsap.to(q("[data-bg]"), { yPercent: 18, ease: "none", scrollTrigger: st });
        gsap.to(q("[data-copy]"), { y: -90, opacity: 0.15, ease: "none", scrollTrigger: st });
        gsap.to(q("[data-stage]"), { y: -50, ease: "none", scrollTrigger: st });

        // pointer: the book spread tilts toward the cursor, the rings answer the other way
        const stage = q("[data-tilt]")[0];
        const rings = q("[data-rings]")[0];
        if (stage && rings) {
          const rx = gsap.quickTo(stage, "rotationX", { duration: 1, ease: "power3.out" });
          const ry = gsap.quickTo(stage, "rotationY", { duration: 1, ease: "power3.out" });
          const gx = gsap.quickTo(rings, "x", { duration: 1.6, ease: "power3.out" });
          const gy = gsap.quickTo(rings, "y", { duration: 1.6, ease: "power3.out" });
          const onMove = (e: PointerEvent) => {
            const px = e.clientX / window.innerWidth - 0.5;
            const py = e.clientY / window.innerHeight - 0.5;
            ry(px * 10);
            rx(-py * 8);
            gx(-px * 30);
            gy(-py * 30);
          };
          window.addEventListener("pointermove", onMove, { passive: true });
          return () => window.removeEventListener("pointermove", onMove);
        }
      });
    },
    { scope: root },
  );

  return (
    <section id="home" ref={root} className="relative isolate flex min-h-[100svh] flex-col overflow-hidden bg-[#0a1015]" style={{ paddingTop: topOffset }}>
      {/* sky: his galaxy photograph, the nebula loop, then live stars */}
      <div data-bg className="absolute inset-0 -z-10">
        <SmartImage src={hero.backgroundImage} alt="" aria-hidden fetchPriority="high" className="absolute inset-0 h-full w-full object-cover opacity-55" />
        <BgVideo src={hero.backgroundVideo} className="absolute inset-0 h-full w-full opacity-45 mix-blend-screen" />
      </div>
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(135deg,rgba(10,16,21,0.94)_0%,rgba(10,16,21,0.72)_38%,rgba(42,54,99,0.45)_70%,rgba(24,54,165,0.35)_100%)]" />
      <div className="absolute inset-x-0 bottom-0 -z-10 h-48 bg-gradient-to-b from-transparent to-night" />
      <Stars className="absolute inset-0 -z-10 h-full w-full" density={7000} gold={0.22} />

      <div className="wrap grid flex-1 items-center gap-14 py-14 lg:grid-cols-[1.02fr_0.98fr] lg:gap-8 lg:py-16">
        <div data-copy className="relative z-10">
          {hero.eyebrow && (
            <p data-tag className="tag caps text-[0.64rem]">
              <Sparkles className="h-3.5 w-3.5 text-gold" /> {hero.eyebrow}
            </p>
          )}
          <h1 className="serif-head mt-7 text-[clamp(2.8rem,5vw,4.7rem)] leading-[1.02]">
            {words.map((w, i) => (
              <Fragment key={i}>
                {i > 0 && " "}
                <span className="-mr-[0.1em] inline-block overflow-hidden pr-[0.1em] pb-[0.12em] align-top">
                  <span data-w className={`inline-block ${i === words.length - 1 ? "gold-text italic" : ""}`}>
                    {w}
                  </span>
                </span>
              </Fragment>
            ))}
          </h1>
          <p data-in className="mt-3 max-w-xl font-[family-name:var(--font-heading)] text-[clamp(1.25rem,1.9vw,1.55rem)] leading-snug text-star/90 italic">
            {hero.subtitle}
          </p>
          <div data-in className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2">
            <span className="inline-flex items-center gap-2 font-[family-name:var(--font-heading)] text-[1.2rem] text-gold-light italic">
              <Feather className="h-4 w-4 text-gold" strokeWidth={1.6} /> by {author.name}
            </span>
            <span className="h-px w-12 bg-gradient-to-r from-gold to-transparent" />
            <span className="caps text-[0.62rem] text-mist">{author.credentials.replace(/\s*·\s*/g, " · ")}</span>
          </div>

          <div data-in className="mt-7 flex flex-wrap gap-2.5">
            {retailer && (
              <span className="chip">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                </span>
                <strong className="font-medium">{retailer.format}</strong>
                <span className="text-sm text-mist">Available now</span>
              </span>
            )}
            {chapters.items.length > 0 && (
              <span className="chip">
                <BookOpen className="h-4 w-4 text-gold" />
                <strong className="font-medium">{chapters.items.length} chapters</strong>
                <span className="text-sm text-mist">featured inside</span>
              </span>
            )}
          </div>

          <div data-in className="mt-9 flex flex-wrap gap-3.5">
            {retailer && (
              <a href={retailer.url} target="_blank" rel="noopener" onClick={() => onBuyClick(retailer)} className="btn-gold">
                {hero.secondaryCta || `Buy on ${retailer.label}`} <ArrowRight className="h-4 w-4" />
              </a>
            )}
            <button onClick={onExcerpt} className="btn-outline">
              <BookOpen className="h-4 w-4" /> {hero.primaryCta}
            </button>
          </div>

          {review && (
            <figure data-in className="mt-10 flex max-w-md items-start gap-4 border-l border-gold/50 pl-5">
              <div>
                <div className="flex gap-0.5 text-gold" aria-label={`${review.rating} out of 5 stars`}>
                  {Array.from({ length: 5 }, (_, k) => (
                    <Star key={k} className={`h-3.5 w-3.5 ${k < review.rating ? "fill-current" : "opacity-30"}`} />
                  ))}
                </div>
                <blockquote className="mt-2 font-[family-name:var(--font-heading)] text-[1.1rem] leading-snug text-star/90 italic">“{review.quote}”</blockquote>
                <figcaption className="caps mt-2 text-[0.58rem] text-mist">— {review.name}, reader</figcaption>
              </div>
            </figure>
          )}
        </div>

        <div data-stage className="relative mx-auto w-full max-w-[660px] [perspective:1400px]">
          {/* orbit rings with travelling lights */}
          <div data-rings aria-hidden className="pointer-events-none absolute top-1/2 left-1/2 -z-10 aspect-square w-[118%] -translate-x-1/2 -translate-y-[54%]">
            <div className="absolute inset-0 rounded-full bg-[radial-gradient(closest-side,rgba(51,84,210,0.5),rgba(24,54,165,0.18)_50%,transparent_72%)] animate-pulse-glow" />
            <div data-ring className="absolute inset-[4%] rounded-full border border-gold/25 animate-spin-slow">
              <span className="absolute top-[14.6%] left-[14.6%] h-2.5 w-2.5 -translate-1/2 rounded-full bg-gold-light shadow-[0_0_18px_4px_rgba(220,202,163,0.7)]" />
            </div>
            <div data-ring className="absolute inset-[16%] rounded-full border border-dashed border-cyan/25 [animation:spin-rev_60s_linear_infinite]">
              <span className="absolute right-0 bottom-1/2 h-2 w-2 translate-x-1/2 rounded-full bg-cyan shadow-[0_0_16px_4px_rgba(42,196,234,0.7)]" />
            </div>
            <div data-ring className="absolute inset-[28%] rounded-full border border-white/10" />
          </div>

          <div data-tilt className="[transform-style:preserve-3d]">
            <div data-books className="relative">
              <span data-badge className="caps absolute top-0 left-1/2 z-10 inline-flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-full border border-gold/50 bg-[#0a1015]/80 px-5 py-2.5 text-[0.6rem] text-gold-light shadow-[0_10px_30px_-10px_rgba(181,159,120,0.6)] backdrop-blur">
                <Sparkles className="h-3.5 w-3.5 text-gold" /> Featured Book
              </span>
              <div data-float className="pt-10">
                <SmartImage
                  src={hero.booksImage}
                  alt={`${hero.title} — the book, front and back`}
                  fetchPriority="high"
                  className="h-auto w-full drop-shadow-[0_40px_45px_rgba(0,0,0,0.6)]"
                  fallback={<SmartImage src={content.book.cover} alt={hero.title} className="mx-auto h-auto w-1/2 shadow-2xl" />}
                />
              </div>

              {avg > 0 && (
                <span data-badge className="absolute top-[18%] -left-2 hidden md:block">
                  <span data-bob className="glass flex items-center gap-3 rounded-full px-4 py-2.5 shadow-xl">
                    <Star className="h-4 w-4 fill-gold text-gold" />
                    <span className="text-sm leading-tight text-star">
                      <strong className="font-semibold">{avg.toFixed(1)}</strong> <span className="text-mist">reader rating</span>
                    </span>
                  </span>
                </span>
              )}
              {explores.themes.length > 0 && (
                <span data-badge className="absolute -right-2 bottom-[16%] hidden md:block">
                  <span data-bob className="glass flex items-center gap-3 rounded-full px-4 py-2.5 shadow-xl">
                    <span className="grid h-6 w-6 place-items-center rounded-full bg-cyan/15 text-cyan">
                      <Sparkles className="h-3.5 w-3.5" />
                    </span>
                    <span className="text-sm leading-tight text-star">
                      <strong className="font-semibold">{explores.themes.length} themes</strong> <span className="text-mist">explored</span>
                    </span>
                  </span>
                </span>
              )}
            </div>
          </div>

          <div data-card className="glass corners relative mx-auto -mt-2 max-w-md rounded-[4px] px-7 py-6 text-center shadow-[0_30px_60px_-30px_rgba(0,0,0,0.9)]">
            <p className="caps text-[0.58rem] text-gold">The book</p>
            <p className="serif-head mt-2 text-[1.45rem]">{hero.title}</p>
            <p className="mt-0.5 text-mist">by {author.name}</p>
            <button onClick={() => scrollToTarget("#about-book")} className="caps mt-4 inline-flex items-center gap-2 text-[0.62rem] text-gold-light transition hover:text-white">
              Discover the book <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      <button data-cue onClick={() => scrollToTarget("#facts")} className="caps absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-3 text-[0.56rem] text-mist transition hover:text-gold-light md:flex" aria-label="Scroll to continue">
        Scroll
        <span className="relative h-12 w-px overflow-hidden bg-white/15">
          <span className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-transparent to-gold animate-[scroll-cue_2.2s_ease-in-out_infinite]" />
        </span>
      </button>
    </section>
  );
}
