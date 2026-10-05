import { useRef } from "react";
import { ArrowUpRight } from "lucide-react";
import { gsap, MOTION_OK, useGSAP } from "../../lib/gsap";
import type { Retailer, SiteContent } from "../../data/types";
import BookCover from "../components/BookCover";
import Label from "../components/Label";
import RevealText from "../components/RevealText";
import ScrubText from "../components/ScrubText";
import SmartImage from "../components/SmartImage";
import { onBuyClick } from "../buy";
import { scrollToTarget } from "../smooth";

interface BookProps {
  book: SiteContent["book"];
  booksImage: string;
  retailer?: Retailer;
  showAuthorLink: boolean;
}

const ROMAN = ["i.", "ii.", "iii.", "iv.", "v.", "vi.", "vii.", "viii."];

export default function Book({ book, booksImage, retailer, showAuthorLink }: BookProps) {
  const root = useRef<HTMLElement>(null);
  // the opening sentence becomes the large statement; the rest reads as body copy
  const sentences = book.body.split(/(?<=[.!?])\s+/);
  const lead = sentences[0] ?? "";
  const rest = sentences.slice(1).join(" ");

  useGSAP(
    () => {
      const q = gsap.utils.selector(root);
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        // the books open out from a slit to full width as they scroll up
        gsap.fromTo(
          q("[data-spread]"),
          { clipPath: "inset(12% 32% 12% 32% round 999px)" },
          { clipPath: "inset(0% 0% 0% 0% round 24px)", ease: "none", scrollTrigger: { trigger: q("[data-spread]")[0], start: "top 95%", end: "center 55%", scrub: true } },
        );
        gsap.fromTo(q("[data-spread] img, [data-spread] [role=img]"), { scale: 1.25 }, { scale: 1, ease: "none", scrollTrigger: { trigger: q("[data-spread]")[0], start: "top bottom", end: "bottom top", scrub: true } });
        // image inside the arch drifts against its frame
        gsap.fromTo(q("[data-arch-img]"), { yPercent: -10 }, { yPercent: 10, ease: "none", scrollTrigger: { trigger: q("[data-arch-frame]")[0], scrub: true } });
        gsap.from(q("[data-arch-frame]"), { clipPath: "inset(100% 0% 0% 0% round 999px 999px 0 0)", duration: 1.6, ease: "expo.inOut", scrollTrigger: { trigger: q("[data-arch-frame]")[0], start: "top 80%", once: true } });
        gsap.from(q("[data-row]"), { y: 40, opacity: 0, stagger: 0.1, duration: 1.1, scrollTrigger: { trigger: q("[data-rows]")[0], start: "top 85%", once: true } });
        gsap.from(q("[data-row-line]"), { scaleX: 0, transformOrigin: "left", stagger: 0.1, duration: 1.4, ease: "expo.inOut", scrollTrigger: { trigger: q("[data-rows]")[0], start: "top 85%", once: true } });
      });
    },
    { scope: root },
  );

  return (
    <section id="about-book" ref={root} className="paper-grain relative bg-ivory pt-28 pb-24 md:pt-40 md:pb-36">
      <div className="wrap">
        <Label n={1} className="text-ember">
          {book.eyebrow}
        </Label>
        <ScrubText className="display mt-10 max-w-[18ch] text-[clamp(2.4rem,6.2vw,6.4rem)] leading-[0.98]" dim={0.14} start="top 85%" end="bottom 55%">
          {lead}
        </ScrubText>
      </div>

      <div className="wrap mt-16 md:mt-24">
        <div data-spread className="overflow-hidden rounded-3xl bg-paper">
          <SmartImage
            src={booksImage}
            alt="Postmortem Life Continuation — the book in its editions"
            loading="lazy"
            className="block h-auto w-full"
            fallback={
              <div className="grid grid-cols-3 gap-[4%] bg-paper px-[10%] py-[6%]">
                {[0, 1, 2].map((i) => (
                  <BookCover key={i} className={i === 1 ? "-translate-y-[6%]" : ""} />
                ))}
              </div>
            }
          />
        </div>
      </div>

      <div className="wrap mt-20 grid gap-14 md:mt-32 lg:grid-cols-[5fr_7fr] lg:gap-24">
        <div data-arch-frame className="arch relative mx-auto aspect-[4/5] w-full max-w-md overflow-hidden bg-paper">
          <div data-arch-img className="absolute -inset-y-[12%] inset-x-0 grid place-items-center">
            <SmartImage src={book.image} alt="The book" loading="lazy" className="h-full w-full object-contain p-[8%]" fallback={<BookCover className="w-[52%]" />} />
          </div>
        </div>

        <div className="flex flex-col justify-center">
          <RevealText className="display text-[clamp(2.6rem,5vw,4.8rem)]">{book.heading}</RevealText>
          {rest && <p className="mt-6 max-w-xl text-[1.08rem] leading-relaxed text-stone">{rest}</p>}
          <ul data-rows className="mt-10">
            {book.bullets.map((b, i) => (
              <li key={i} data-row className="relative py-5">
                <span data-row-line className="rule absolute inset-x-0 top-0" />
                <span className="grid grid-cols-[3rem_1fr] items-baseline">
                  <span className="display text-xl text-ember italic">{ROMAN[i] ?? `${i + 1}.`}</span>
                  <span className="text-[1.15rem]">{b}</span>
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-8 flex flex-wrap gap-3">
            {showAuthorLink && (
              <button onClick={() => scrollToTarget("#author")} className="pill pill-ink">
                {book.ctaLabel}
              </button>
            )}
            {retailer && (
              <a href={retailer.url} target="_blank" rel="noopener" onClick={() => onBuyClick(retailer)} className="pill pill-line">
                Buy on {retailer.label} <ArrowUpRight className="h-4 w-4" />
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
