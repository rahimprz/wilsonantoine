import { Fragment, useId, useRef } from "react";
import { ArrowRight, Check, Feather } from "lucide-react";
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

  const facts: [string, string][] = [
    ["Author", author],
    ["Format", formats.join(", ") || "—"],
    ["Inside", `${chapterCount} featured chapters`],
    ["Subject", "Life beyond death"],
  ];

  return (
    <section id="about-book" ref={root} className="relative overflow-hidden py-20 md:py-32">
      <div className="pointer-events-none absolute top-1/3 -left-40 h-[620px] w-[620px] rounded-full bg-[radial-gradient(closest-side,rgba(24,54,165,0.4),transparent)]" />
      <p aria-hidden className="pointer-events-none absolute top-10 right-[-2vw] font-[family-name:var(--font-heading)] text-[clamp(6rem,16vw,15rem)] leading-none whitespace-nowrap text-white/[0.025] italic select-none">
        The Book
      </p>
      <div className="wrap relative grid items-center gap-14 lg:grid-cols-[0.95fr_1.05fr] lg:gap-20">
        <div className="relative mx-auto w-full max-w-[520px]">
          <div data-halo aria-hidden className="absolute inset-[4%] rounded-full bg-[radial-gradient(closest-side,rgba(51,84,210,0.5),rgba(10,17,48,0)_75%)]">
            <span className="absolute inset-0 rounded-full border border-gold/20" />
            <span className="absolute inset-[9%] rounded-full border border-dashed border-gold/20 animate-spin-slow" />
            <span className="absolute top-1/2 -left-1 h-2 w-2 -translate-y-1/2 rounded-full bg-gold-light shadow-[0_0_14px_3px_rgba(220,202,163,0.7)]" />
          </div>
          <div data-art className="relative">
            <div data-art-float>
              <SmartImage src={book.image} alt={`${title} — hardcover and paperback`} loading="lazy" className="relative h-auto w-full drop-shadow-[0_40px_40px_rgba(0,0,0,0.65)]" />
            </div>
          </div>
          <div aria-hidden className="floor-glow mx-auto -mt-4 h-10 w-3/4" />
          <RoundSeal text={`${title} • A doctor's evidence • `} className="absolute -top-4 right-0 h-28 w-28 md:h-32 md:w-32" />
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

          <div data-reveal className="mt-10">
            <div className="hrule" />
            <dl className="grid grid-cols-2 gap-y-5 py-5 sm:flex sm:items-stretch sm:justify-between sm:gap-y-0">
              {facts.map(([k, v], i) => (
                <Fragment key={k}>
                  {i > 0 && <span aria-hidden className="vrule hidden sm:block" />}
                  <div className="px-1 sm:flex-1 sm:px-4 sm:first:pl-0">
                    <dt className="caps text-[0.54rem] text-gold">{k}</dt>
                    <dd className="mt-1.5 font-[family-name:var(--font-heading)] text-[1.05rem] leading-snug text-star">{v}</dd>
                  </div>
                </Fragment>
              ))}
            </dl>
            <div className="hrule" />
          </div>

          <div data-reveal className="mt-10 flex flex-wrap gap-3.5">
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
    </section>
  );
}

/** A slowly turning round seal of gold lettering with a quill at its centre. */
function RoundSeal({ text, className = "" }: { text: string; className?: string }) {
  const id = `seal${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  return (
    <span aria-hidden className={`pointer-events-none block ${className}`}>
      <span className="absolute inset-0 rounded-full bg-[radial-gradient(closest-side,rgba(10,17,48,0.85),rgba(10,17,48,0.4)_70%,transparent)]" />
      <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full animate-spin-slow">
        <defs>
          <path id={id} d="M50,50 m-38,0 a38,38 0 1,1 76,0 a38,38 0 1,1 -76,0" />
        </defs>
        <text className="fill-gold-light text-[7.4px] tracking-[0.32em] uppercase" style={{ fontFamily: "var(--font-body)", fontWeight: 600 }}>
          <textPath href={`#${id}`} textLength={238}>
            {text.toUpperCase()}
          </textPath>
        </text>
      </svg>
      <span className="absolute inset-[30%] grid place-items-center rounded-full border border-gold/50 text-gold">
        <Feather className="h-1/2 w-1/2" strokeWidth={1.4} />
      </span>
    </span>
  );
}
