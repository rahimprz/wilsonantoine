import { useRef, useState } from "react";
import { ArrowUpRight, BookOpen, ChevronDown } from "lucide-react";
import { gsap, MOTION_OK, useGSAP } from "../../lib/gsap";
import { track } from "../../lib/analytics";
import type { Retailer, SiteContent } from "../../data/types";
import Book3D from "../components/Book3D";
import SmartImage from "../components/SmartImage";
import { onBuyClick } from "../buy";
import { useReveal } from "../useReveal";

interface InsideProps {
  chapters: SiteContent["chapters"];
  cover: string;
  retailer?: Retailer;
  hasExcerpt: boolean;
  onExcerpt: () => void;
}

/** A look inside: featured chapters as an accordion beside the open book. */
export default function Inside({ chapters, cover, retailer, hasExcerpt, onExcerpt }: InsideProps) {
  const root = useRef<HTMLElement>(null);
  const [open, setOpen] = useState(0);
  useReveal(root, [chapters.items.length]);
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        gsap.fromTo("[data-mock]", { rotate: -4, y: 40 }, { rotate: 3, y: -40, ease: "none", scrollTrigger: { trigger: root.current, scrub: true } });
      });
    },
    { scope: root },
  );

  const toggle = (i: number) => {
    setOpen((c) => (c === i ? -1 : i));
    if (open !== i) track("chapter_open", chapters.items[i]?.title);
  };

  return (
    <section id="chapters" ref={root} className="on-dark relative overflow-hidden bg-navy py-24 text-white md:py-32">
      <div className="pointer-events-none absolute -top-40 -right-40 h-[520px] w-[520px] rounded-full bg-gold/15 blur-[120px]" />
      <div className="wrap grid items-center gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
        <div className="relative mx-auto w-full max-w-md lg:sticky lg:top-28 lg:self-start">
          <div data-mock>
            <SmartImage
              src={chapters.image}
              alt="Inside Postmortem Life Continuation"
              loading="lazy"
              className="h-auto w-full rounded-2xl drop-shadow-[0_40px_50px_rgba(0,0,0,0.55)]"
              fallback={<Book3D className="mx-auto w-[70%]" cover={cover} />}
            />
          </div>
        </div>

        <div>
          <p data-reveal className="kicker">{chapters.eyebrow}</p>
          <h2 data-reveal className="title mt-4 text-[clamp(2.4rem,4.8vw,4rem)]">
            {chapters.heading}
          </h2>
          <div className="mt-10 space-y-3">
            {chapters.items.map((ch, i) => {
              const isOpen = open === i;
              return (
                <div key={ch.id} data-reveal={i * 0.06} className={`rounded-2xl border transition-colors duration-500 ${isOpen ? "border-gold/50 bg-white/[0.06]" : "border-white/10 hover:border-white/25"}`}>
                  <h3>
                    <button onClick={() => toggle(i)} aria-expanded={isOpen} aria-controls={`ch-${ch.id}`} className="flex w-full items-center gap-5 px-5 py-5 text-left md:px-6">
                      <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full text-sm font-semibold tabular-nums transition-colors ${isOpen ? "bg-gold text-navy" : "bg-white/10 text-white/70"}`}>
                        {i + 1}
                      </span>
                      <span className="title flex-1 text-[clamp(1.35rem,2vw,1.7rem)]">{ch.title}</span>
                      <ChevronDown className={`h-5 w-5 shrink-0 text-gold-light transition-transform duration-500 ${isOpen ? "rotate-180" : ""}`} />
                    </button>
                  </h3>
                  <div id={`ch-${ch.id}`} role="region" className={`grid transition-[grid-template-rows] duration-500 ease-[var(--ease-out-expo)] ${isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
                    <div className="overflow-hidden">
                      <p className="px-5 pb-6 text-white/75 md:pr-10 md:pl-[5.25rem]">{ch.summary}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div data-reveal className="mt-10 flex flex-wrap gap-3">
            {hasExcerpt && (
              <button onClick={onExcerpt} className="btn-ghost-light">
                <BookOpen className="h-4 w-4" /> Read an excerpt
              </button>
            )}
            {retailer && (
              <a href={retailer.url} target="_blank" rel="noopener" onClick={() => onBuyClick(retailer)} className="btn-buy">
                Read the full book <ArrowUpRight className="h-4 w-4" />
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
