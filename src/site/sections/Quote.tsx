import { useRef } from "react";
import type { SiteContent } from "../../data/types";
import BgVideo from "../components/BgVideo";
import { useReveal } from "../useReveal";

/** One line from the book's promise, on his original navy with the slow light loop behind it. */
export default function Quote({ manifesto }: { manifesto: SiteContent["manifesto"] }) {
  const root = useRef<HTMLElement>(null);
  useReveal(root);
  return (
    <section ref={root} className="px-[clamp(1.25rem,4vw,3rem)]" aria-label={manifesto.eyebrow}>
      <div className="relative mx-auto max-w-[1280px] overflow-hidden rounded-[12px] bg-brand-navy px-6 py-20 text-center text-white md:py-28">
        <BgVideo src={manifesto.video} className="absolute inset-0 h-full w-full opacity-60" />
        <div className="absolute inset-0 bg-[radial-gradient(70%_80%_at_50%_50%,rgba(42,54,99,0.35),rgba(30,39,73,0.9))]" />
        <div className="relative">
          <p data-reveal className="caps text-[0.7rem] text-gold">{manifesto.eyebrow}</p>
          <blockquote data-reveal className="mx-auto mt-6 max-w-3xl font-[family-name:var(--font-heading)] text-[clamp(1.9rem,3.6vw,3rem)] leading-[1.25] italic">
            “{manifesto.quote}”
          </blockquote>
          <div data-reveal className="rule-gold mx-auto mt-8 w-24" />
        </div>
      </div>
    </section>
  );
}
