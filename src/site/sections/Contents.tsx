import { useRef, useState } from "react";
import { ArrowUpRight, Plus } from "lucide-react";
import { gsap, MOTION_OK, useGSAP } from "../../lib/gsap";
import { track } from "../../lib/analytics";
import type { Retailer, SiteContent } from "../../data/types";
import BookCover from "../components/BookCover";
import Label from "../components/Label";
import RevealText from "../components/RevealText";
import SmartImage from "../components/SmartImage";
import { onBuyClick } from "../buy";

interface ContentsProps {
  chapters: SiteContent["chapters"];
  retailer?: Retailer;
  hasExcerpt: boolean;
  onExcerpt: () => void;
}

/**
 * A table of contents set like a printed one. Rows fill with ink from below on hover while the book
 * floats beside the pointer, tilting with its speed; opening a row reveals the chapter's summary.
 */
export default function Contents({ chapters, retailer, hasExcerpt, onExcerpt }: ContentsProps) {
  const root = useRef<HTMLElement>(null);
  const float = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(-1);

  useGSAP(
    () => {
      const q = gsap.utils.selector(root);
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        gsap.from(q("[data-row]"), { y: 60, opacity: 0, stagger: 0.08, duration: 1.2, scrollTrigger: { trigger: q("[data-list]")[0], start: "top 80%", once: true } });
      });
      mm.add(`${MOTION_OK} and (pointer: fine)`, () => {
        const el = float.current!;
        gsap.set(el, { xPercent: -50, yPercent: -50, scale: 0, rotate: -6 });
        const x = gsap.quickTo(el, "x", { duration: 0.7, ease: "power3.out" });
        const y = gsap.quickTo(el, "y", { duration: 0.7, ease: "power3.out" });
        const r = gsap.quickTo(el, "rotate", { duration: 0.9, ease: "power3.out" });
        let lastX = 0;
        const list = q("[data-list]")[0] as HTMLElement;
        const onMove = (e: PointerEvent) => {
          const box = list.getBoundingClientRect();
          x(e.clientX - box.left);
          y(e.clientY - box.top);
          r(gsap.utils.clamp(-14, 14, (e.clientX - lastX) * 0.6));
          lastX = e.clientX;
        };
        const show = () => gsap.to(el, { scale: 1, duration: 0.6, ease: "expo.out" });
        const hide = () => gsap.to(el, { scale: 0, duration: 0.4, ease: "power3.in" });
        list.addEventListener("pointermove", onMove);
        list.addEventListener("pointerenter", show);
        list.addEventListener("pointerleave", hide);
        return () => {
          list.removeEventListener("pointermove", onMove);
          list.removeEventListener("pointerenter", show);
          list.removeEventListener("pointerleave", hide);
        };
      });
    },
    { scope: root, dependencies: [chapters.items.length] },
  );

  const toggle = (i: number) => {
    setOpen((cur) => (cur === i ? -1 : i));
    if (open !== i) track("chapter_open", chapters.items[i]?.title);
  };

  return (
    <section id="chapters" ref={root} className="paper-grain relative bg-ivory py-24 md:py-36">
      <div className="wrap">
        <div className="flex flex-wrap items-end justify-between gap-8">
          <div>
            <Label n={4} className="text-ember">
              {chapters.eyebrow}
            </Label>
            <RevealText className="display mt-8 text-[clamp(3.2rem,8vw,8.5rem)]">{chapters.heading}</RevealText>
          </div>
          <p className="label max-w-[15rem] text-[0.65rem] leading-relaxed text-stone">Contents — {String(chapters.items.length).padStart(2, "0")} featured chapters. Open one to read its summary.</p>
        </div>

        <div data-list className="relative mt-14 border-b border-ink/15">
          <div ref={float} className="pointer-events-none absolute top-0 left-0 z-20 hidden w-56 [@media(pointer:fine)]:block" aria-hidden>
            <SmartImage src={chapters.image} alt="" className="h-auto w-full rounded-lg shadow-2xl" fallback={<BookCover className="w-40" />} />
          </div>

          {chapters.items.map((ch, i) => {
            const isOpen = open === i;
            return (
              <div key={ch.id} data-row className="border-t border-ink/15">
                <h3>
                  <button
                    onClick={() => toggle(i)}
                    aria-expanded={isOpen}
                    aria-controls={`ch-${ch.id}`}
                    data-cursor={isOpen ? "Close" : "Open"}
                    className="group relative isolate grid w-full grid-cols-[3.5rem_1fr_auto] items-center gap-4 overflow-hidden py-6 text-left transition-colors duration-500 hover:text-ivory md:grid-cols-[7rem_1fr_auto] md:py-8"
                  >
                    <span className="absolute inset-0 -z-10 translate-y-full bg-ink transition-transform duration-700 ease-[var(--ease-out-expo)] group-hover:translate-y-0" />
                    <span className="label pl-2 text-[0.65rem] opacity-60 md:pl-4">No. {String(i + 1).padStart(2, "0")}</span>
                    <span className="display text-[clamp(1.8rem,4.2vw,4.4rem)] leading-[1] transition-transform duration-700 ease-[var(--ease-out-expo)] group-hover:translate-x-3">{ch.title}</span>
                    <span className={`mr-2 grid h-11 w-11 place-items-center rounded-full border border-current transition-transform duration-500 md:mr-4 ${isOpen ? "rotate-45" : ""}`}>
                      <Plus className="h-4 w-4" />
                    </span>
                  </button>
                </h3>
                <div id={`ch-${ch.id}`} role="region" className={`grid transition-[grid-template-rows] duration-700 ease-[var(--ease-out-expo)] ${isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
                  <div className="overflow-hidden">
                    <p className="max-w-3xl pt-2 pb-10 pl-[3.5rem] text-[1.12rem] leading-relaxed text-stone md:pl-[7rem] md:text-[1.25rem]">{ch.summary}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-12 flex flex-wrap gap-3">
          {hasExcerpt && (
            <button onClick={onExcerpt} className="pill pill-ink" data-cursor="Read">
              Read an excerpt
            </button>
          )}
          {retailer && (
            <a href={retailer.url} target="_blank" rel="noopener" onClick={() => onBuyClick(retailer)} className={`pill ${hasExcerpt ? "pill-line" : "pill-ink"}`}>
              Read the full book <ArrowUpRight className="h-4 w-4" />
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
