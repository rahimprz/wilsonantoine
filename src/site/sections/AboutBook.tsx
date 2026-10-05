import { Fragment, useRef } from "react";
import { ArrowUpRight, Check } from "lucide-react";
import { gsap, MOTION_OK, useGSAP } from "../../lib/gsap";
import type { Retailer, SiteContent } from "../../data/types";
import Book3D from "../components/Book3D";
import Ornament from "../components/Ornament";
import SmartImage from "../components/SmartImage";
import { onBuyClick } from "../buy";
import { useReveal } from "../useReveal";

function withTitle(text: string, title: string) {
  if (!title || !text.includes(title)) return text;
  return text.split(title).map((part, i, arr) => (
    <Fragment key={i}>
      {part}
      {i < arr.length - 1 && <em className="title text-[1.12em] text-navy">{title}</em>}
    </Fragment>
  ));
}

/** What the book is: the editions photo, the description, and what makes it different. */
interface AboutBookProps {
  book: SiteContent["book"];
  booksImage: string;
  title: string;
  subtitle: string;
  author: string;
  formats: string[];
  chapterCount: number;
  retailer?: Retailer;
}

export default function AboutBook({ book, booksImage, title, subtitle, author, formats, chapterCount, retailer }: AboutBookProps) {
  const root = useRef<HTMLElement>(null);
  useReveal(root);
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        gsap.from("[data-photo]", { scale: 0.92, opacity: 0, duration: 1.6, ease: "expo.out", scrollTrigger: { trigger: "[data-photo]", start: "top 85%", once: true } });
        gsap.fromTo("[data-photo-img]", { yPercent: 4 }, { yPercent: -4, ease: "none", scrollTrigger: { trigger: "[data-photo]", scrub: true } });
      });
    },
    { scope: root },
  );

  return (
    <section id="about-book" ref={root} className="relative py-24 md:py-32">
      <div className="wrap">
        <div className="mx-auto max-w-3xl text-center">
          <Ornament className="mb-5" />
          <p data-reveal className="kicker">{book.eyebrow}</p>
          <h2 data-reveal className="title mt-4 text-[clamp(2.4rem,4.8vw,4rem)] text-navy">
            {book.heading}
          </h2>
        </div>

        <div data-photo className="relative mx-auto mt-12 max-w-5xl overflow-hidden rounded-[28px] bg-gradient-to-b from-navy-2 to-navy p-6 md:p-10">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_60%_at_50%_40%,rgba(201,163,90,0.25),transparent_70%)]" />
          <div data-photo-img className="relative">
            <SmartImage
              src={booksImage}
              alt={`${title} — the book in its editions`}
              loading="lazy"
              className="mx-auto h-auto w-full max-w-4xl drop-shadow-[0_30px_40px_rgba(0,0,0,0.5)]"
              fallback={
                <div className="flex items-end justify-center gap-[3%] py-6">
                  <Book3D className="w-[22%]" idle={false} interactive={false} cover={book.cover} />
                  <Book3D className="w-[28%]" idle={false} interactive={false} cover={book.cover} />
                  <Book3D className="w-[22%]" idle={false} interactive={false} cover={book.cover} />
                </div>
              }
            />
          </div>
        </div>

        <div className="mt-16 grid gap-12 md:grid-cols-[1.15fr_0.85fr] md:gap-16">
          <p data-reveal className="text-[1.2rem] leading-[1.8] text-inkblue/85 first-letter:float-left first-letter:mr-3 first-letter:font-[family-name:var(--font-editorial)] first-letter:text-[4.2rem] first-letter:leading-[0.85] first-letter:text-gold-deep">
            {withTitle(book.body, title)}
          </p>
          <div>
            <ul className="space-y-4">
              {book.bullets.map((b, i) => (
                <li key={i} data-reveal={i * 0.08} className="card flex items-center gap-4 px-5 py-4">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-navy text-gold-light">
                    <Check className="h-4 w-4" />
                  </span>
                  <span className="font-medium text-navy">{b}</span>
                </li>
              ))}
            </ul>
            <dl data-reveal className="mt-6 overflow-hidden rounded-2xl border border-navy/10 bg-white/60 text-sm">
              {[
                ["Title", title],
                ["Subtitle", subtitle],
                ["Author", author],
                ["Format", formats.join(" · ") || "—"],
                ["Inside", `${chapterCount} featured chapters`],
              ].map(([k, v]) => (
                <div key={k} className="grid grid-cols-[6.5rem_1fr] gap-3 border-b border-navy/10 px-5 py-3 last:border-b-0">
                  <dt className="font-semibold tracking-wide text-gold-deep uppercase">{k}</dt>
                  <dd className="text-navy">{v}</dd>
                </div>
              ))}
            </dl>
            {retailer && (
              <a data-reveal href={retailer.url} target="_blank" rel="noopener" onClick={() => onBuyClick(retailer)} className="btn-buy mt-8">
                Get the book <ArrowUpRight className="h-4 w-4" />
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
