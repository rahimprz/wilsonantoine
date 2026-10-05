import { useRef } from "react";
import { gsap, MOTION_OK, ScrollTrigger, useGSAP } from "../../lib/gsap";

/**
 * Two crossing bands of the book's themes. They drift on their own and surge with scroll
 * velocity — scrolling faster pushes them along, then they ease back to cruising speed.
 */
export default function ThemeMarquee({ items }: { items: string[] }) {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        const tracks = gsap.utils.toArray<HTMLElement>("[data-track]", root.current);
        const loops = tracks.map((track, i) =>
          gsap.fromTo(track, { xPercent: i % 2 ? -50 : 0 }, { xPercent: i % 2 ? 0 : -50, duration: 38 + i * 6, ease: "none", repeat: -1 }),
        );
        let boost = 1;
        const st = ScrollTrigger.create({
          trigger: root.current,
          start: "top bottom",
          end: "bottom top",
          onUpdate: (self) => {
            boost = 1 + Math.min(Math.abs(self.getVelocity()) / 260, 7);
          },
        });
        const tick = () => {
          boost += (1 - boost) * 0.05;
          loops.forEach((l) => l.timeScale(boost));
        };
        gsap.ticker.add(tick);
        return () => {
          gsap.ticker.remove(tick);
          st.kill();
          loops.forEach((l) => l.kill());
        };
      });
    },
    { scope: root, dependencies: [items.join("|")] },
  );

  const row = (outlined: boolean) =>
    [...items, ...items].map((item, i) => (
      <span key={i} className="flex shrink-0 items-center gap-8 pr-8">
        <span
          className={`font-display text-[clamp(1.6rem,4vw,3.4rem)] font-semibold whitespace-nowrap uppercase ${
            outlined ? "text-transparent [-webkit-text-stroke:1.2px_rgba(220,202,163,0.75)]" : "text-white"
          }`}
        >
          {item}
        </span>
        <svg viewBox="0 0 24 24" className="h-6 w-6 shrink-0 text-gold" aria-hidden>
          <path fill="currentColor" d="M12 0c.6 6.2 5.8 11.4 12 12-6.2.6-11.4 5.8-12 12-.6-6.2-5.8-11.4-12-12C6.2 11.4 11.4 6.2 12 0z" />
        </svg>
      </span>
    ));

  return (
    <div ref={root} className="relative z-10 overflow-hidden py-16 md:py-24" aria-label="Themes of the book">
      <div className="-mx-10 -rotate-[2.5deg] border-y border-gold/25 bg-gradient-to-r from-royal/40 via-night/80 to-royal/40 py-5 backdrop-blur-sm">
        <div data-track className="flex w-max will-change-transform">{row(false)}</div>
      </div>
      <div className="-mx-10 -mt-3 rotate-[1.5deg] border-y border-white/10 bg-void/70 py-4">
        <div data-track className="flex w-max will-change-transform">{row(true)}</div>
      </div>
    </div>
  );
}
