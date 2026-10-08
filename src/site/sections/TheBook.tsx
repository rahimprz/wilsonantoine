import { Fragment, useRef } from "react";
import { ArrowRight, Check } from "lucide-react";
import type { Retailer, SiteContent } from "../../data/types";
import SideLabel from "../components/SideLabel";
import SmartImage from "../components/SmartImage";
import { onBuyClick } from "../buy";
import { useReveal } from "../useReveal";

function withTitle(text: string, title: string) {
  if (!title || !text.includes(title)) return text;
  return text.split(title).map((part, i, arr) => (
    <Fragment key={i}>
      {part}
      {i < arr.length - 1 && <em className="text-ink-navy">{title}</em>}
    </Fragment>
  ));
}

interface TheBookProps {
  book: SiteContent["book"];
  title: string;
  author: string;
  formats: string[];
  chapterCount: number;
  heroImage: string;
  retailer?: Retailer;
}

export default function TheBook({ book, title, author, formats, chapterCount, heroImage, retailer }: TheBookProps) {
  const root = useRef<HTMLElement>(null);
  useReveal(root);
  return (
    <section id="about-book" ref={root} className="py-20 md:py-28">
      <div className="wrap">
        <div className="panel relative grid items-center gap-12 px-6 py-12 md:px-14 md:py-16 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16 lg:pl-24">
          <SideLabel>The Book</SideLabel>
          <div data-reveal className="paper mx-auto w-full max-w-md rounded-[6px] p-4">
            <div className="rounded-[3px] bg-gradient-to-b from-brand-navy to-ink-navy p-6">
              <SmartImage src={heroImage} alt={`${title} — hardcover`} loading="lazy" className="mx-auto h-auto w-full drop-shadow-[0_25px_25px_rgba(0,0,0,0.45)]" />
            </div>
            <p className="caps mt-4 text-center text-[0.62rem] text-muted">{title}</p>
          </div>

          <div>
            <p data-reveal className="caps text-[0.7rem] text-gold-deep">{book.eyebrow}</p>
            <h2 data-reveal className="serif-head mt-3 text-[clamp(2.2rem,4vw,3.4rem)]">
              {book.heading}
            </h2>
            <div data-reveal className="rule-gold mt-6 w-24" />
            <p data-reveal className="mt-6 text-[1.18rem] leading-relaxed">
              {withTitle(book.body, title)}
            </p>
            <ul className="mt-7 space-y-3">
              {book.bullets.map((b, i) => (
                <li key={i} data-reveal={i * 0.06} className="flex items-start gap-3 text-[1.12rem] text-ink-navy">
                  <span className="mt-1 grid h-6 w-6 shrink-0 place-items-center rounded-full border border-gold/60 text-gold">
                    <Check className="h-3.5 w-3.5" />
                  </span>
                  {b}
                </li>
              ))}
            </ul>

            <dl data-reveal className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-[6px] border border-line bg-line text-[0.98rem] sm:grid-cols-4">
              {[
                ["Author", author],
                ["Format", formats.join(", ") || "—"],
                ["Inside", `${chapterCount} featured chapters`],
                ["Subject", "Life beyond death"],
              ].map(([k, v]) => (
                <div key={k} className="bg-parchment px-4 py-3">
                  <dt className="caps text-[0.6rem] text-gold-deep">{k}</dt>
                  <dd className="mt-1 leading-snug text-ink-navy">{v}</dd>
                </div>
              ))}
            </dl>

            {retailer && (
              <a data-reveal href={retailer.url} target="_blank" rel="noopener" onClick={() => onBuyClick(retailer)} className="btn-solid mt-9">
                Get Your Copy <ArrowRight className="h-4 w-4" />
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
