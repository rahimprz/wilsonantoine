import { Fragment, useRef } from "react";
import { ArrowRight, Check } from "lucide-react";
import { gsap, MOTION_OK, useGSAP } from "../../lib/gsap";
import type { Retailer, SiteContent } from "../../data/types";
import SectionHead from "../components/SectionHead";
import SmartImage from "../components/SmartImage";
import { onBuyClick } from "../buy";
import { scrollToTarget } from "../smooth";
import { useReveal } from "../useReveal";

function withTitle(text: string, title: string) {
  if (!title || !text.includes(title)) return text;
  return text.split(title).map((part, i, arr) => (
    <Fragment key={i}>
      {part}
      {i < arr.length - 1 && <em className="font-[family-name:var(--font-heading)] text-gold-light">{title}</em>}
    </Fragment>
  ));
}

interface TheBookProps {
  n?: number;
  book: SiteContent["book"];
  title: string;
  author: string;
  formats: string[];
  chapterCount: number;
  retailer?: Retailer;
}

export default function TheBook({ n, book, title, author, formats, chapterCount, retailer }: TheBookProps) {
  const root = useRef<HTMLElement>(null);
  useReveal(root);
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        gsap.fromTo("[data-art]", { y: 60, rotate: -2 }, { y: -40, rotate: 1, ease: "none", scrollTrigger: { trigger: root.current, start: "top bottom", end: "bottom top", scrub: true } });
        gsap.from("[data-halo]", { scale: 0.5, opacity: 0, duration: 2, ease: "expo.out", scrollTrigger: { trigger: "[data-halo]", start: "top 85%", once: true } });
        gsap.to("[data-art-float]", { y: -14, duration: 3.8, ease: "sine.inOut", yoyo: true, repeat: -1 });
      });
    },
    { scope: root },
  );

  return (
    <section id="about-book" ref={root} className="relative overflow-hidden py-20 md:py-28">
      <div className="pointer-events-none absolute top-1/3 -left-40 h-[560px] w-[560px] rounded-full bg-[radial-gradient(closest-side,rgba(24,54,165,0.35),transparent)]" />
      <div className="wrap">
        <div className="glass corners relative grid items-center gap-12 rounded-[4px] px-6 py-12 md:px-12 md:py-16 lg:grid-cols-[0.95fr_1.05fr] lg:gap-16 lg:px-16">
          <div className="relative mx-auto w-full max-w-[500px]">
            <div data-halo aria-hidden className="absolute inset-[6%] rounded-full border border-gold/25 bg-[radial-gradient(closest-side,rgba(51,84,210,0.45),rgba(10,17,48,0)_75%)]">
              <span className="absolute inset-[9%] rounded-full border border-dashed border-gold/20 animate-spin-slow" />
            </div>
            <div data-art className="relative">
              <div data-art-float>
                <SmartImage src={book.image} alt={`${title} — hardcover and paperback`} loading="lazy" className="relative h-auto w-full drop-shadow-[0_40px_40px_rgba(0,0,0,0.65)]" />
              </div>
            </div>
          </div>

          <div>
            <SectionHead n={n} eyebrow={book.eyebrow} title={book.heading} />
            <p data-reveal className="mt-8 text-[1.14rem] leading-relaxed text-mist first-letter:float-left first-letter:mt-1 first-letter:mr-3 first-letter:font-[family-name:var(--font-heading)] first-letter:text-[4.2rem] first-letter:leading-[0.8] first-letter:text-gold">
              {withTitle(book.body, title)}
            </p>
            <ul className="mt-8 space-y-3.5">
              {book.bullets.map((b, i) => (
                <li key={i} data-reveal={i * 0.08} className="flex items-start gap-3.5 text-[1.08rem] text-star">
                  <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-gradient-to-br from-gold-light to-gold-deep text-night">
                    <Check className="h-3.5 w-3.5" strokeWidth={3} />
                  </span>
                  {b}
                </li>
              ))}
            </ul>

            <dl data-reveal className="mt-9 grid grid-cols-2 gap-px overflow-hidden rounded-[3px] border border-white/10 bg-white/10 sm:grid-cols-4">
              {[
                ["Author", author],
                ["Format", formats.join(", ") || "—"],
                ["Inside", `${chapterCount} featured chapters`],
                ["Subject", "Life beyond death"],
              ].map(([k, v]) => (
                <div key={k} className="bg-[#0b1233]/90 px-4 py-3.5">
                  <dt className="caps text-[0.54rem] text-gold">{k}</dt>
                  <dd className="mt-1 text-[0.95rem] leading-snug text-star">{v}</dd>
                </div>
              ))}
            </dl>

            <div data-reveal className="mt-9 flex flex-wrap gap-3.5">
              {retailer && (
                <a href={retailer.url} target="_blank" rel="noopener" onClick={() => onBuyClick(retailer)} className="btn-gold">
                  Get Your Copy <ArrowRight className="h-4 w-4" />
                </a>
              )}
              {book.ctaLabel && (
                <button onClick={() => scrollToTarget("#author")} className="btn-outline">
                  {book.ctaLabel}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
