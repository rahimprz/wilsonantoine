import { useRef, useState } from "react";
import { ArrowRight, Check, Link2, Mail } from "lucide-react";
import type { SiteContent } from "../../data/types";
import BgVideo from "../components/BgVideo";
import { SocialIcon } from "../components/Icons";
import SmartImage from "../components/SmartImage";
import { onBuyClick } from "../buy";
import { useReveal } from "../useReveal";

/** The closing call: the book on navy, where to buy it, and a way to pass it on. */
export default function Begin({ buy, title, author, image }: { buy: SiteContent["buy"]; title: string; author: string; image: string }) {
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

  return (
    <section id="buy" ref={root} className="px-[clamp(1.25rem,4vw,3rem)] py-20 md:py-28">
      <div className="relative mx-auto grid max-w-[1280px] items-center gap-12 overflow-hidden rounded-[12px] bg-ink-navy px-6 py-14 text-white md:px-14 lg:grid-cols-[0.9fr_1.1fr] lg:py-16">
        <BgVideo src={buy.video} className="absolute inset-0 h-full w-full opacity-35" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(30,39,73,0.4),rgba(30,39,73,0.95)_60%)]" />
        <div data-reveal className="relative mx-auto w-full max-w-md">
          <SmartImage src={image} alt={title} loading="lazy" className="h-auto w-full drop-shadow-[0_30px_30px_rgba(0,0,0,0.5)]" />
        </div>
        <div className="relative">
          <p data-reveal className="caps text-[0.7rem] text-gold">{buy.eyebrow}</p>
          <h2 data-reveal className="mt-3 font-[family-name:var(--font-heading)] text-[clamp(2.4rem,4.4vw,3.8rem)] leading-[1.05]">
            {buy.heading}
          </h2>
          <p data-reveal className="mt-4 max-w-lg text-[1.25rem] text-white/80 italic">
            {buy.body}
          </p>
          <div data-reveal className="mt-8 space-y-3">
            {retailers.map((r) => (
              <a
                key={r.id}
                href={r.url}
                target="_blank"
                rel="noopener"
                onClick={() => onBuyClick(r)}
                className="group flex items-center justify-between gap-4 rounded-[6px] border border-white/15 bg-white/[0.05] px-5 py-4 transition hover:border-gold hover:bg-white/[0.09]"
              >
                <span>
                  <span className="block font-[family-name:var(--font-heading)] text-[1.35rem]">{r.format}</span>
                  <span className="text-white/60">
                    on {r.label}
                    {r.price && <strong className="ml-2 font-semibold text-gold">{r.price}</strong>}
                  </span>
                </span>
                <span className="btn-solid btn-gold !px-5 !py-3">
                  Buy now <ArrowRight className="h-4 w-4" />
                </span>
              </a>
            ))}
          </div>
          <div data-reveal className="mt-8 flex flex-wrap items-center gap-2 border-t border-white/10 pt-6">
            <span className="caps mr-2 text-[0.62rem] text-white/55">Share the book</span>
            {shares.map((s) => (
              <a key={s.label} href={s.href} target="_blank" rel="noopener" aria-label={`Share on ${s.label}`} className="grid h-9 w-9 place-items-center rounded-full border border-white/20 text-white/80 transition hover:border-gold hover:text-gold">
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
              className="inline-flex h-9 items-center gap-2 rounded-full border border-white/20 px-4 text-sm text-white/80 transition hover:border-gold hover:text-gold"
            >
              {copied ? <Check className="h-4 w-4" /> : <Link2 className="h-4 w-4" />} {copied ? "Copied" : "Copy link"}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
