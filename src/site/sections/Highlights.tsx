import { useRef } from "react";
import { BookMarked, Stethoscope, Tablet, Timer } from "lucide-react";
import type { Retailer, SiteContent } from "../../data/types";
import { useReveal } from "../useReveal";

/** Four quick facts right under the hero, every one drawn from the site's own content. */
export default function Highlights({ content, retailer }: { content: SiteContent; retailer?: Retailer }) {
  const root = useRef<HTMLElement>(null);
  useReveal(root);
  const years = content.author.highlights.find((h) => /year/i.test(h.label));
  const facts = [
    retailer && { icon: Tablet, title: `Available on ${retailer.label}`, text: retailer.format },
    { icon: Stethoscope, title: "Written by a doctor", text: content.author.credentials || "Medical doctor" },
    years && { icon: Timer, title: `${years.value} years`, text: "of clinical experience" },
    content.chapters.items.length > 0 && { icon: BookMarked, title: `${content.chapters.items.length} featured chapters`, text: "Previewed below" },
  ].filter(Boolean) as { icon: typeof Tablet; title: string; text: string }[];

  return (
    <section ref={root} aria-label="At a glance" className="relative z-10 -mt-12 md:-mt-14">
      <div className="wrap">
        <ul className="card grid grid-cols-2 divide-navy/10 overflow-hidden md:grid-cols-4 md:divide-x">
          {facts.map((f, i) => (
            <li key={f.title} data-reveal={i * 0.06} className="flex items-center gap-4 border-navy/10 p-5 max-md:border-b max-md:odd:border-r md:p-6">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-navy text-gold-light">
                <f.icon className="h-5 w-5" />
              </span>
              <span className="min-w-0">
                <span className="block font-semibold leading-tight text-navy">{f.title}</span>
                <span className="block truncate text-sm text-slate">{f.text}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
