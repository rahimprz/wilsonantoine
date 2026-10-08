import { useRef, useState } from "react";
import { ArrowRight, Check, Link2, Mail } from "lucide-react";
import type { SiteContent } from "../../data/types";
import BgVideo from "../components/BgVideo";
import Book3D from "../components/Book3D";
import { SocialIcon } from "../components/Icons";
import Ornament from "../components/Ornament";
import Stars from "../components/Stars";
import { onBuyClick } from "../buy";
import { useReveal } from "../useReveal";

interface BeginProps {
  buy: SiteContent["buy"];
  title: string;
  author: string;
  cover: string;
}

/** The closing call: the book in hand, light pouring through behind it, where to buy, how to share. */
export default function Begin({ buy, title, author, cover }: BeginProps) {
  const root = useRef<HTMLElement>(null);
  const retailers = [...buy.retailers.filter((r) => r.url)].sort((a, b) => Number(b.primary) - Number(a.primary));
  const [copied, setCopied] = useState(false);
  useReveal(root, [retailers.length]);

  const url = typeof window !== "undefined" ? window.location.origin : "";
  const text = `${title} by ${author}`;
  const enc = encodeURIComponent;
  const shares = [
    { label: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`, icon: <SocialIcon name="facebook" /> },
    { label: "X", href: `https://twitter.com/intent/tweet?text=${enc(text)}&url=${enc(url)}`, icon: <SocialIcon name="x" /> },
    { label: "Email", href: `mailto:?subject=${enc(text)}&body=${enc(`${text} — ${url}`)}`, icon: <Mail className="h-4 w-4" /> },
  ];
  const [first, ...rest] = buy.heading.trim().split(/\s+/);

  return (
    <section id="buy" ref={root} className="relative isolate overflow-hidden bg-[#0a1015] py-24 md:py-32">
      <BgVideo src={buy.video} className="absolute inset-0 -z-10 h-full w-full opacity-60" />
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(55%_75%_at_28%_50%,rgba(24,54,165,0.15),rgba(10,16,21,0.85)_70%)]" />
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(10,16,21,0.2),rgba(10,16,21,0.9)_62%)]" />
      <Stars className="absolute inset-0 -z-10 h-full w-full" density={10000} gold={0.45} />
      <div className="absolute inset-x-0 top-0 -z-10 h-40 bg-gradient-to-b from-[#0a1130] to-transparent" />

      <div className="wrap grid items-center gap-16 lg:grid-cols-[0.9fr_1.1fr]">
        <div data-zoom>
          <Book3D cover={cover} title={title} author={author} width="clamp(210px, 24vw, 310px)" turn={28} />
        </div>

        <div>
          <p data-reveal className="caps text-gold">{buy.eyebrow}</p>
          <h2 data-reveal className="serif-head mt-4 text-[clamp(2.6rem,5vw,4.4rem)]">
            {first} {rest.length > 0 && <span className="gold-text italic">{rest.join(" ")}</span>}
          </h2>
          <div data-reveal className="mt-6">
            <Ornament />
          </div>
          <p data-reveal className="mt-6 max-w-lg font-[family-name:var(--font-heading)] text-[1.3rem] leading-snug text-star/85 italic">
            {buy.body}
          </p>

          <div data-reveal className="glass corners mt-9 rounded-[4px] p-2">
            {retailers.map((r, i) => (
              <a
                key={r.id}
                href={r.url}
                target="_blank"
                rel="noopener"
                onClick={() => onBuyClick(r)}
                className={`group flex items-center justify-between gap-4 rounded-[3px] px-4 py-4 transition-colors hover:bg-white/[0.06] md:px-5 ${i > 0 ? "border-t border-white/10" : ""}`}
              >
                <span className="min-w-0">
                  <span className="block font-[family-name:var(--font-heading)] text-[1.35rem] text-star">{r.format}</span>
                  <span className="text-mist">
                    on {r.label}
                    {r.price && <strong className="ml-2 font-semibold text-gold-light">{r.price}</strong>}
                  </span>
                </span>
                <span className="btn-gold shrink-0 !px-5 !py-3">
                  Buy now <ArrowRight className="h-4 w-4" />
                </span>
              </a>
            ))}
          </div>

          <div data-reveal className="mt-8 flex flex-wrap items-center gap-2">
            <span className="caps mr-2 text-[0.58rem] text-mist">Share the book</span>
            {shares.map((s) => (
              <a key={s.label} href={s.href} target="_blank" rel="noopener" aria-label={`Share on ${s.label}`} className="grid h-10 w-10 place-items-center rounded-full border border-white/20 text-white/80 transition hover:border-gold hover:bg-gold hover:text-night">
                {s.icon}
              </a>
            ))}
            <button
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(url);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                } catch {
                  /* clipboard unavailable */
                }
              }}
              className="inline-flex h-10 items-center gap-2 rounded-full border border-white/20 px-4 text-sm text-white/80 transition hover:border-gold hover:text-gold-light"
            >
              {copied ? <Check className="h-4 w-4" /> : <Link2 className="h-4 w-4" />} {copied ? "Copied" : "Copy link"}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
