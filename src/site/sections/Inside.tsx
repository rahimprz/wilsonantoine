import { useRef } from "react";
import { ArrowRight, BookOpen } from "lucide-react";
import { track } from "../../lib/analytics";
import type { Retailer, SiteContent } from "../../data/types";
import SmartImage from "../components/SmartImage";
import { onBuyClick } from "../buy";
import { useReveal } from "../useReveal";

const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];

interface InsideProps {
  chapters: SiteContent["chapters"];
  retailer?: Retailer;
  hasExcerpt: boolean;
  onExcerpt: () => void;
}

/** The featured chapters set like a table of contents — every summary visible, nothing to click open. */
export default function Inside({ chapters, retailer, hasExcerpt, onExcerpt }: InsideProps) {
  const root = useRef<HTMLElement>(null);
  useReveal(root, [chapters.items.length]);
  return (
    <section id="chapters" ref={root} className="border-y border-line bg-parchment-2/60 py-20 md:py-28">
      <div className="wrap grid gap-14 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
        <div className="lg:sticky lg:top-32 lg:self-start">
          <p data-reveal className="caps text-[0.7rem] text-gold-deep">{chapters.eyebrow}</p>
          <h2 data-reveal className="serif-head mt-3 text-[clamp(2.2rem,4vw,3.4rem)]">
            {chapters.heading}
          </h2>
          <div data-reveal className="rule-gold mt-6 w-24" />
          <div data-reveal className="mt-10">
            <SmartImage src={chapters.image} alt="Postmortem Life Continuation" loading="lazy" className="mx-auto h-auto w-full max-w-sm drop-shadow-[0_30px_30px_rgba(30,39,73,0.3)]" />
          </div>
        </div>

        <div>
          <ol className="divide-y divide-line border-y border-line">
            {chapters.items.map((ch, i) => (
              <li
                key={ch.id}
                data-reveal={i * 0.05}
                className="group grid grid-cols-[3.5rem_1fr] gap-4 py-8 md:grid-cols-[4.5rem_1fr]"
                onMouseEnter={() => track("chapter_open", ch.title)}
              >
                <span className="font-[family-name:var(--font-heading)] text-[2rem] leading-none text-gold italic transition-transform duration-500 group-hover:-translate-y-0.5">
                  {ROMAN[i] ?? i + 1}
                </span>
                <div>
                  <h3 className="serif-head text-[1.55rem] md:text-[1.75rem]">{ch.title}</h3>
                  <p className="mt-2 text-[1.08rem] leading-relaxed">{ch.summary}</p>
                </div>
              </li>
            ))}
          </ol>
          <div data-reveal className="mt-10 flex flex-wrap gap-4">
            {hasExcerpt && (
              <button onClick={onExcerpt} className="btn-line">
                <BookOpen className="h-4 w-4" /> Read an Excerpt
              </button>
            )}
            {retailer && (
              <a href={retailer.url} target="_blank" rel="noopener" onClick={() => onBuyClick(retailer)} className="btn-solid">
                Read the Full Book <ArrowRight className="h-4 w-4" />
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
