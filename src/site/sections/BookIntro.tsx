import { Fragment, useRef } from "react";
import { ArrowUpRight } from "lucide-react";
import { gsap, MOTION_OK, useGSAP } from "../../lib/gsap";
import type { Retailer, SiteContent } from "../../data/types";
import Book3D from "../components/Book3D";
import RevealText from "../components/RevealText";
import SmartImage from "../components/SmartImage";
import { onBuyClick } from "../buy";
import { scrollToTarget } from "../smooth";

interface BookIntroProps {
  book: SiteContent["book"];
  bookTitle: string;
  retailer?: Retailer;
  showAuthorLink: boolean;
}

/** Italicises the book's title wherever it appears in running copy, as a typesetter would. */
function withTitle(text: string, title: string) {
  if (!title || !text.includes(title)) return text;
  return text.split(title).map((part, i, arr) => (
    <Fragment key={i}>
      {part}
      {i < arr.length - 1 && <em className="font-serif text-[1.15em] text-gold-light">{title}</em>}
    </Fragment>
  ));
}

export default function BookIntro({ book, bookTitle, retailer, showAuthorLink }: BookIntroProps) {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const q = gsap.utils.selector(root);
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        const enter = { trigger: q("[data-media]")[0], start: "top 78%", once: true };
        gsap.fromTo(q("[data-shape]"), { scale: 0, rotate: -6 }, { scale: 1, rotate: 0, duration: 1.6, delay: 0.5, ease: "expo.inOut", scrollTrigger: enter });
        gsap.fromTo(q("[data-reveal]"), { clipPath: "inset(0% 100% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.6, ease: "expo.inOut", scrollTrigger: enter });
        gsap.fromTo(q("[data-reveal] img, [data-reveal] [role=img]"), { scale: 1.25 }, { scale: 1, duration: 2, ease: "expo.out", scrollTrigger: enter });
        // the two layers drift at different speeds while the section passes
        gsap.fromTo(q("[data-shape-par]"), { xPercent: -6 }, { xPercent: 6, ease: "none", scrollTrigger: { trigger: root.current, scrub: true } });
        gsap.fromTo(q("[data-media-par]"), { yPercent: 8 }, { yPercent: -8, ease: "none", scrollTrigger: { trigger: root.current, scrub: true } });

        gsap.from(q("[data-copy] > [data-in]"), {
          y: 34,
          opacity: 0,
          duration: 1.1,
          stagger: 0.12,
          scrollTrigger: { trigger: q("[data-copy]")[0], start: "top 80%", once: true },
        });
        gsap.from(q("[data-bullet]"), {
          x: -30,
          opacity: 0,
          stagger: 0.14,
          duration: 1,
          delay: 0.3,
          scrollTrigger: { trigger: q("[data-bullets]")[0], start: "top 85%", once: true },
        });
        gsap.fromTo(
          q("[data-check]"),
          { strokeDashoffset: 24 },
          { strokeDashoffset: 0, stagger: 0.14, duration: 0.8, delay: 0.7, ease: "power2.out", scrollTrigger: { trigger: q("[data-bullets]")[0], start: "top 85%", once: true } },
        );
      });
    },
    { scope: root },
  );

  return (
    <section id="about-book" ref={root} className="relative z-10 overflow-hidden py-24 md:py-36">
      <div className="pointer-events-none absolute top-1/2 -left-40 h-[640px] w-[640px] -translate-y-1/2 rounded-full bg-royal/25 blur-[140px]" />
      <div className="container-site grid items-center gap-14 lg:grid-cols-2 lg:gap-20">
        <div data-media className="relative mx-auto w-full max-w-xl">
          <div data-shape-par className="absolute inset-0">
            <svg data-shape viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute top-[5%] left-[5%] h-[90%] w-[90%] origin-bottom-left" aria-hidden>
              <defs>
                <linearGradient id="shapeGold" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#dccaa3" />
                  <stop offset="1" stopColor="#8a744d" />
                </linearGradient>
              </defs>
              <polygon points="25 0, 100 0, 75 100, 0 100" fill="url(#shapeGold)" opacity="0.9" />
            </svg>
          </div>
          <div data-media-par className="relative">
            <div data-reveal className="relative">
              <SmartImage
                src={book.image}
                alt="Postmortem Life Continuation book"
                className="relative h-auto w-full drop-shadow-[0_30px_50px_rgba(0,0,0,0.6)]"
                loading="lazy"
                fallback={<Book3D className="mx-auto w-[55%] py-10" />}
              />
            </div>
          </div>
        </div>

        <div data-copy>
          <p data-in className="eyebrow">
            {book.eyebrow}
          </p>
          <RevealText className="heading-lg mt-5 text-white">{book.heading}</RevealText>
          <p data-in className="mt-7 text-lg leading-relaxed text-mist md:text-[1.15rem]">
            {withTitle(book.body, bookTitle)}
          </p>
          <ul data-bullets className="mt-8 space-y-4">
            {book.bullets.map((b, i) => (
              <li key={i} data-bullet className="flex items-start gap-4 text-white">
                <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full border border-gold/60 bg-gold/10">
                  <svg viewBox="0 0 24 24" className="h-4 w-4 text-gold" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path data-check d="M5 12.5l4.5 4.5L19 7.5" strokeDasharray="24" />
                  </svg>
                </span>
                <span className="text-[1.05rem]">{b}</span>
              </li>
            ))}
          </ul>
          <div data-in className="mt-10 flex flex-wrap gap-4">
            {showAuthorLink && (
              <button onClick={() => scrollToTarget("#author")} className="btn btn-gold">
                {book.ctaLabel}
              </button>
            )}
            {retailer && (
              <a href={retailer.url} target="_blank" rel="noopener" onClick={() => onBuyClick(retailer)} className="btn rounded-full border border-white/25 px-7 py-4 text-white hover:border-gold hover:text-gold">
                Buy on {retailer.label} <ArrowUpRight className="h-4 w-4" />
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
