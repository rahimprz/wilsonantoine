import { useRef, useState } from "react";
import { ArrowUpRight, BookOpen, Plus } from "lucide-react";
import { gsap, MOTION_OK, useGSAP } from "../../lib/gsap";
import { track } from "../../lib/analytics";
import type { Retailer, SiteContent } from "../../data/types";
import Book3D from "../components/Book3D";
import RevealText from "../components/RevealText";
import SmartImage from "../components/SmartImage";
import { onBuyClick } from "../buy";

interface ChaptersProps {
  chapters: SiteContent["chapters"];
  retailer?: Retailer;
  hasExcerpt: boolean;
  onExcerpt: () => void;
}

export default function Chapters({ chapters, retailer, hasExcerpt, onExcerpt }: ChaptersProps) {
  const root = useRef<HTMLElement>(null);
  const [open, setOpen] = useState(0);

  useGSAP(
    () => {
      const q = gsap.utils.selector(root);
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        gsap.fromTo(
          q("[data-cover]"),
          { clipPath: "inset(0% 0% 0% 100%)" },
          { clipPath: "inset(0% 0% 0% 0%)", duration: 1.6, ease: "expo.inOut", scrollTrigger: { trigger: root.current, start: "top 65%", once: true } },
        );
        // the book turns slightly as you read down the list
        gsap.fromTo(q("[data-cover-tilt]"), { rotateY: 14, rotateX: 4 }, { rotateY: -10, rotateX: -2, ease: "none", scrollTrigger: { trigger: root.current, scrub: true } });
        gsap.from(q("[data-row]"), {
          y: 40,
          opacity: 0,
          stagger: 0.1,
          duration: 1.1,
          scrollTrigger: { trigger: q("[data-list]")[0], start: "top 80%", once: true },
        });
      });
    },
    { scope: root, dependencies: [chapters.items.length] },
  );

  const toggle = (i: number) => {
    setOpen((cur) => (cur === i ? -1 : i));
    if (open !== i) track("chapter_open", chapters.items[i]?.title);
  };

  const shown = open >= 0 ? open : 0;

  return (
    <section id="chapters" ref={root} className="grain relative z-10 overflow-hidden py-28 md:py-40">
      <div className="absolute inset-0 bg-[linear-gradient(45deg,#2a3663_0%,#1836a5_100%)] opacity-90" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#03050d_0%,transparent_18%,transparent_82%,#03050d_100%)]" />
      <div className="pointer-events-none absolute inset-0 [background-image:radial-gradient(rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:28px_28px] [mask-image:radial-gradient(70%_60%_at_30%_50%,black,transparent)]" />

      <div className="container-site relative grid items-start gap-14 lg:grid-cols-[5fr_7fr] lg:gap-20">
        <div className="relative lg:sticky lg:top-28">
          <div className="relative mx-auto max-w-md [perspective:1400px]">
            <span
              key={shown}
              className="pointer-events-none absolute -top-16 -left-6 z-0 font-serif text-[10rem] leading-none font-semibold text-transparent italic [-webkit-text-stroke:1.5px_rgba(220,202,163,0.4)] animate-[fade-in_0.8s_ease_both] md:-left-14 md:text-[14rem]"
              aria-hidden
            >
              {String(shown + 1).padStart(2, "0")}
            </span>
            <div data-cover className="relative z-10">
              <div data-cover-tilt className="[transform-style:preserve-3d]">
                <SmartImage
                  src={chapters.image}
                  alt="Postmortem Life Continuation, opened"
                  loading="lazy"
                  className="h-auto w-full drop-shadow-[0_40px_60px_rgba(0,0,0,0.6)]"
                  fallback={<Book3D className="mx-auto w-[60%] py-6" />}
                />
              </div>
            </div>
          </div>
        </div>

        <div>
          <p className="eyebrow">{chapters.eyebrow}</p>
          <RevealText className="heading-lg mt-5 text-white">{chapters.heading}</RevealText>

          <div data-list className="mt-12 space-y-3">
            {chapters.items.map((ch, i) => {
              const isOpen = open === i;
              return (
                <div
                  key={ch.id}
                  data-row
                  className={`rounded-[10px] border transition-[background-color,border-color,box-shadow] duration-500 ${
                    isOpen ? "border-gold/40 bg-void/55 shadow-[0_40px_70px_-30px_rgba(0,0,0,0.6)]" : "border-white/10 bg-white/[0.03] hover:border-white/25"
                  }`}
                >
                  <h3>
                    <button
                      onClick={() => toggle(i)}
                      aria-expanded={isOpen}
                      aria-controls={`chapter-${ch.id}`}
                      className="flex w-full items-center gap-5 px-5 py-5 text-left md:px-8 md:py-6"
                    >
                      <span className={`font-body text-sm font-medium tabular-nums transition-colors ${isOpen ? "text-gold" : "text-white/40"}`}>{String(i + 1).padStart(2, "0")}</span>
                      <span className="flex-1 font-body text-[1.05rem] font-semibold tracking-[0.06em] text-white uppercase md:text-[1.15rem]">{ch.title}</span>
                      <span
                        className={`grid h-9 w-9 shrink-0 place-items-center rounded-full border transition-all duration-500 ${
                          isOpen ? "rotate-[135deg] border-gold bg-gold text-void" : "border-white/30 text-white"
                        }`}
                      >
                        <Plus className="h-4 w-4" />
                      </span>
                    </button>
                  </h3>
                  <div
                    id={`chapter-${ch.id}`}
                    role="region"
                    className={`grid transition-[grid-template-rows,opacity] duration-700 ease-[var(--ease-out-expo)] ${isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
                  >
                    <div className="overflow-hidden">
                      <p className="px-5 pb-7 text-[1.05rem] leading-relaxed text-mist md:px-8 md:pl-[4.6rem]">{ch.summary}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-10 flex flex-wrap gap-4">
            {hasExcerpt && (
              <button onClick={onExcerpt} className="btn btn-gold">
                <BookOpen className="h-4 w-4" /> Read an Excerpt
              </button>
            )}
            {retailer && (
              <a
                href={retailer.url}
                target="_blank"
                rel="noopener"
                onClick={() => onBuyClick(retailer)}
                className={hasExcerpt ? "btn rounded-full border border-white/30 px-7 py-4 text-white hover:border-gold hover:text-gold" : "btn btn-gold"}
              >
                Read the full book <ArrowUpRight className="h-4 w-4" />
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
