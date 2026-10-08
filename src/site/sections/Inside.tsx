import { useRef } from "react";
import { ArrowRight, BookOpen } from "lucide-react";
import { track } from "../../lib/analytics";
import { gsap, MOTION_OK, useGSAP } from "../../lib/gsap";
import type { Retailer, SiteContent } from "../../data/types";
import Book3D from "../components/Book3D";
import SectionHead from "../components/SectionHead";
import Stars from "../components/Stars";
import { onBuyClick } from "../buy";
import { useReveal } from "../useReveal";

const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];

interface InsideProps {
  n?: number;
  chapters: SiteContent["chapters"];
  cover: string;
  title: string;
  author: string;
  retailer?: Retailer;
  hasExcerpt: boolean;
  onExcerpt: () => void;
}

/** The featured chapters as a lit table of contents, beside the book itself. */
export default function Inside({ n, chapters, cover, title, author, retailer, hasExcerpt, onExcerpt }: InsideProps) {
  const root = useRef<HTMLElement>(null);
  useReveal(root, [chapters.items.length]);
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        // a gold thread runs down the contents as you read
        gsap.fromTo("[data-thread]", { scaleY: 0 }, { scaleY: 1, ease: "none", scrollTrigger: { trigger: "[data-list]", start: "top 70%", end: "bottom 60%", scrub: true } });
        gsap.utils.toArray<HTMLElement>("[data-ch]").forEach((el) => {
          gsap.from(el.querySelector("[data-numeral]"), { x: -30, opacity: 0, duration: 1.2, ease: "expo.out", scrollTrigger: { trigger: el, start: "top 85%", once: true } });
          glowWhileCentred(el);
        });
      });
    },
    { scope: root, dependencies: [chapters.items.length] },
  );

  return (
    <section id="chapters" ref={root} className="relative overflow-clip bg-[linear-gradient(180deg,#0a1130_0%,#16204d_22%,#1a2c7a_65%,#0a1130_100%)] py-20 md:py-28">
      <Stars className="absolute inset-0 h-full w-full" density={11000} gold={0.25} />
      <div className="pointer-events-none absolute -right-40 bottom-0 h-[600px] w-[600px] rounded-full bg-[radial-gradient(closest-side,rgba(51,84,210,0.4),transparent)]" />
      <div className="wrap relative grid gap-14 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <SectionHead n={n} eyebrow={chapters.eyebrow} title={chapters.heading} intro={`${chapters.items.length} chapters, each a door into the evidence. Read the summaries, then open the book.`} />
          <div data-zoom className="mt-14 hidden lg:block">
            <Book3D cover={cover} title={title} author={author} width="clamp(220px, 21vw, 290px)" />
          </div>
        </div>

        <div>
          <ol data-list className="relative">
            <span aria-hidden className="absolute top-0 bottom-0 left-[1.6rem] w-px bg-white/10 md:left-[2.1rem]" />
            <span data-thread aria-hidden className="absolute top-0 bottom-0 left-[1.6rem] w-px origin-top bg-gradient-to-b from-gold via-gold-light to-cyan md:left-[2.1rem]" />
            {chapters.items.map((ch, i) => (
              <li key={ch.id} data-ch data-reveal={0.04} className="group relative grid grid-cols-[3.2rem_1fr] gap-5 py-5 md:grid-cols-[4.2rem_1fr] md:gap-7" onMouseEnter={() => track("chapter_open", ch.title)}>
                <span data-numeral className="relative z-10 grid h-[3.2rem] w-[3.2rem] place-items-center rounded-full border border-gold/50 bg-[#0d1640] font-[family-name:var(--font-heading)] text-[1.15rem] text-gold-light italic shadow-[0_0_0_6px_rgba(13,22,64,0.9)] transition-[background-color,color] duration-500 group-hover:bg-gold group-hover:text-night md:h-[4.2rem] md:w-[4.2rem] md:text-[1.45rem]">
                  {ROMAN[i] ?? i + 1}
                </span>
                <div className="glass relative overflow-hidden rounded-[4px] px-6 py-6 transition-[translate,border-color] duration-500 group-hover:-translate-y-0.5 group-hover:border-gold/50 md:px-8">
                  <span className="absolute inset-y-0 left-0 w-[3px] origin-top scale-y-0 bg-gradient-to-b from-gold-light to-gold-deep transition-transform duration-700 ease-[var(--ease-out-expo)] group-hover:scale-y-100" />
                  <p className="caps text-[0.56rem] text-gold">Chapter {ROMAN[i] ?? i + 1}</p>
                  <h3 className="serif-head mt-2 text-[1.45rem] md:text-[1.65rem]">{ch.title}</h3>
                  <p className="mt-3 text-[1.02rem] leading-relaxed text-mist">{ch.summary}</p>
                </div>
              </li>
            ))}
          </ol>
          <div data-reveal className="mt-10 flex flex-wrap gap-3.5 pl-[4.2rem] md:pl-[5.95rem]">
            {retailer && (
              <a href={retailer.url} target="_blank" rel="noopener" onClick={() => onBuyClick(retailer)} className="btn-gold">
                Read the Full Book <ArrowRight className="h-4 w-4" />
              </a>
            )}
            {hasExcerpt && (
              <button onClick={onExcerpt} className="btn-outline">
                <BookOpen className="h-4 w-4" /> Read an Excerpt
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

/** Lights a chapter's numeral while it sits in the middle of the screen. */
function glowWhileCentred(el: HTMLElement) {
  const numeral = el.querySelector("[data-numeral]");
  if (!numeral) return;
  gsap.timeline({ scrollTrigger: { trigger: el, start: "top 60%", end: "bottom 40%", toggleActions: "play reverse play reverse" } }).to(numeral, {
    boxShadow: "0 0 0 6px rgba(13,22,64,0.9), 0 0 30px 4px rgba(181,159,120,0.55)",
    borderColor: "#b59f78",
    duration: 0.5,
    ease: "power2.out",
  });
}
