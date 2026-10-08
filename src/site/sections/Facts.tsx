import { Fragment, useRef } from "react";
import { BookOpen, Compass, Star, Stethoscope, type LucideIcon } from "lucide-react";
import { gsap, MOTION_OK, useGSAP } from "../../lib/gsap";
import type { SiteContent } from "../../data/types";

interface Fact {
  icon: LucideIcon;
  value: string;
  label: string;
}

/** The book at a glance between gold hairlines, numbers counting up as it arrives. */
export default function Facts({ content }: { content: SiteContent }) {
  const root = useRef<HTMLElement>(null);
  const { author, chapters, explores, reviews, buy } = content;
  const rated = reviews.items.filter((r) => r.rating > 0);
  const avg = rated.length ? rated.reduce((s, r) => s + r.rating, 0) / rated.length : 0;
  const years = author.highlights.find((h) => /^\d+\+?$/.test(h.value.trim()));
  const format = buy.retailers.find((r) => r.primary && r.url) ?? buy.retailers.find((r) => r.url);

  const facts: Fact[] = [
    years && { icon: Stethoscope, value: years.value, label: years.label },
    chapters.items.length > 0 && { icon: BookOpen, value: String(chapters.items.length), label: "Featured chapters" },
    explores.themes.length > 0 && { icon: Compass, value: String(explores.themes.length), label: "Themes explored" },
    avg > 0 ? { icon: Star, value: avg.toFixed(1), label: "Average reader rating" } : format && { icon: BookOpen, value: format.format, label: `On ${format.label}` },
  ].filter(Boolean) as Fact[];

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        gsap.from("[data-fact]", { y: 30, opacity: 0, duration: 1.1, stagger: 0.1, ease: "power3.out", scrollTrigger: { trigger: root.current, start: "top 92%", once: true } });
        gsap.utils.toArray<HTMLElement>("[data-num]").forEach((el) => {
          const m = /^(\d+(?:\.\d)?)(\+?)$/.exec(el.dataset.num ?? "");
          if (!m) return;
          const target = Number(m[1]);
          const decimals = m[1].includes(".") ? 1 : 0;
          const s = { v: 0 };
          gsap.to(s, {
            v: target,
            duration: 2,
            ease: "power2.out",
            scrollTrigger: { trigger: el, start: "top 95%", once: true },
            onUpdate: () => void (el.textContent = `${s.v.toFixed(decimals)}${m[2]}`),
          });
        });
      });
    },
    { scope: root },
  );

  if (!facts.length) return null;
  return (
    <section id="facts" ref={root} aria-label="The book at a glance" className="relative z-10 py-10 md:py-14">
      <div className="wrap">
        <div className="hrule" />
        <div className="grid grid-cols-2 gap-y-10 py-10 lg:flex lg:items-stretch lg:justify-between lg:py-12">
          {facts.map((f, i) => (
            <Fragment key={f.label}>
              {i > 0 && <span aria-hidden className="vrule hidden lg:block" />}
              <div data-fact className="group flex flex-col items-center px-4 text-center lg:flex-1">
                <span className="medallion h-14 w-14 group-hover:text-white">
                  <f.icon className="h-5 w-5" strokeWidth={1.5} />
                </span>
                <span data-num={f.value} className="serif-head gold-text mt-5 block text-[2.6rem] leading-none md:text-[3.1rem]">
                  {f.value}
                </span>
                <span className="caps mt-3 block max-w-[14rem] text-[0.56rem] leading-relaxed text-mist">{f.label}</span>
              </div>
            </Fragment>
          ))}
        </div>
        <div className="hrule" />
      </div>
    </section>
  );
}
