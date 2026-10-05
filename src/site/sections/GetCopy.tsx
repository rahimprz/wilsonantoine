import { useRef } from "react";
import { ArrowUpRight, BookOpen, Headphones, Tablet } from "lucide-react";
import { gsap, MOTION_OK, useGSAP } from "../../lib/gsap";
import type { SiteContent } from "../../data/types";
import BgVideo from "../components/BgVideo";
import Book3D from "../components/Book3D";
import ShareBook from "../components/ShareBook";
import { onBuyClick } from "../buy";
import { useReveal } from "../useReveal";

const formatIcon = (f: string) => (/audio/i.test(f) ? Headphones : /kindle|ebook|e-book/i.test(f) ? Tablet : BookOpen);

/** Where to buy: the book, and one clear card per edition/store. */
export default function GetCopy({ buy, title, author, cover }: { buy: SiteContent["buy"]; title: string; author: string; cover: string }) {
  const root = useRef<HTMLElement>(null);
  const retailers = [...buy.retailers.filter((r) => r.url)].sort((a, b) => Number(b.primary) - Number(a.primary));
  useReveal(root, [retailers.length]);
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        gsap.from("[data-buybook]", { rotateY: -80, y: 60, opacity: 0, duration: 1.8, ease: "expo.out", scrollTrigger: { trigger: root.current, start: "top 70%", once: true } });
      });
    },
    { scope: root },
  );

  return (
    <section id="buy" ref={root} className="on-dark relative overflow-hidden bg-navy py-24 text-white md:py-32">
      <div className="absolute inset-0 opacity-60">
        <BgVideo src={buy.video} className="h-full w-full" />
      </div>
      <div className="absolute inset-0 bg-[radial-gradient(70%_70%_at_30%_50%,rgba(11,22,56,0.3),rgba(11,22,56,0.92))]" />
      <div className="wrap relative grid items-center gap-14 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
        <div data-buybook className="mx-auto w-[min(60vw,320px)]">
          <Book3D cover={cover} />
        </div>
        <div>
          <p data-reveal className="kicker">{buy.eyebrow}</p>
          <h2 data-reveal className="title mt-4 text-[clamp(2.8rem,5.6vw,4.8rem)]">
            {buy.heading}
          </h2>
          <p data-reveal className="mt-4 max-w-xl text-lg text-white/80">
            {buy.body}
          </p>
          <p data-reveal className="mt-2 text-sm text-white/55">
            {title} · {author}
          </p>

          <div className={`mt-10 grid gap-4 ${retailers.length > 1 ? "sm:grid-cols-2" : "max-w-md"}`}>
            {retailers.map((r, i) => {
              const Icon = formatIcon(r.format);
              return (
                <a
                  key={r.id}
                  data-reveal={i * 0.08}
                  href={r.url}
                  target="_blank"
                  rel="noopener"
                  onClick={() => onBuyClick(r)}
                  className={`group flex flex-col rounded-2xl border p-6 transition-all duration-500 hover:-translate-y-1 ${
                    r.primary ? "border-gold/60 bg-gold/10 hover:bg-gold/15" : "border-white/15 bg-white/[0.04] hover:border-white/35"
                  }`}
                >
                  <span className="flex items-center justify-between">
                    <Icon className="h-6 w-6 text-gold-light" />
                    {r.primary && retailers.length > 1 && <span className="rounded-full bg-gold px-2.5 py-0.5 text-xs font-semibold text-navy">Most popular</span>}
                  </span>
                  <span className="title mt-5 text-3xl">{r.format}</span>
                  <span className="mt-1 text-white/65">
                    on {r.label}
                    {r.price && <strong className="ml-2 font-semibold text-white">{r.price}</strong>}
                  </span>
                  <span className={`mt-6 ${r.primary ? "btn-buy" : "btn-ghost-light"} w-full`}>
                    Buy now <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </span>
                </a>
              );
            })}
          </div>
          <div data-reveal className="mt-10 border-t border-white/10 pt-6">
            <ShareBook title={title} author={author} />
          </div>
        </div>
      </div>
    </section>
  );
}
