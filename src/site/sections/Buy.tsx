import { useRef } from "react";
import { ArrowUpRight } from "lucide-react";
import { gsap, MOTION_OK, useGSAP } from "../../lib/gsap";
import type { SiteContent } from "../../data/types";
import BgVideo from "../components/BgVideo";
import Book3D from "../components/Book3D";
import RevealText from "../components/RevealText";
import { onBuyClick } from "../buy";

export default function Buy({ buy }: { buy: SiteContent["buy"] }) {
  const root = useRef<HTMLElement>(null);
  const retailers = buy.retailers.filter((r) => r.url);
  const primary = retailers.find((r) => r.primary) ?? retailers[0];
  const others = retailers.filter((r) => r !== primary);

  useGSAP(
    () => {
      const q = gsap.utils.selector(root);
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        // flying into the light as the section scrolls past
        gsap.fromTo(q("[data-tunnel]"), { scale: 1 }, { scale: 1.35, ease: "none", scrollTrigger: { trigger: root.current, start: "top bottom", end: "bottom top", scrub: true } });
        gsap.from(q("[data-book]"), {
          y: 120,
          scale: 0.7,
          rotateY: -120,
          opacity: 0,
          duration: 2,
          ease: "expo.out",
          scrollTrigger: { trigger: root.current, start: "top 65%", once: true },
        });
        gsap.from(q("[data-in]"), { y: 30, opacity: 0, stagger: 0.12, duration: 1.1, delay: 0.4, scrollTrigger: { trigger: root.current, start: "top 65%", once: true } });
      });
    },
    { scope: root },
  );

  return (
    <section id="buy" ref={root} className="relative z-10 overflow-hidden py-28 md:py-40">
      <div data-tunnel className="absolute inset-0">
        <BgVideo src={buy.video} className="h-full w-full" />
      </div>
      <div className="absolute inset-0 bg-[radial-gradient(60%_60%_at_50%_50%,rgba(3,5,13,0.15),rgba(3,5,13,0.85))]" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#03050d_0%,transparent_20%,transparent_80%,#03050d_100%)]" />

      <div className="container-site relative grid items-center gap-14 lg:grid-cols-[0.9fr_1.1fr]">
        <div data-book className="mx-auto w-[min(62vw,330px)]">
          <Book3D />
        </div>
        <div className="text-center lg:text-left">
          <p data-in className="eyebrow justify-center lg:justify-start">
            {buy.eyebrow}
          </p>
          <RevealText by="chars" className="heading-xl mt-5 text-white">
            {buy.heading}
          </RevealText>
          <p data-in className="mx-auto mt-6 max-w-xl font-serif text-[1.6rem] leading-snug text-white/90 italic lg:mx-0">
            {buy.body}
          </p>

          {primary && (
            <div data-in className="mt-10 flex flex-col items-center gap-5 lg:items-start">
              <a href={primary.url} target="_blank" rel="noopener" onClick={() => onBuyClick(primary)} className="btn btn-gold !px-9 !py-5 !text-base">
                Buy on {primary.label}
                <span className="rounded-full bg-void/15 px-3 py-1 text-xs tracking-wider normal-case">
                  {primary.format}
                  {primary.price && ` · ${primary.price}`}
                </span>
                <ArrowUpRight className="h-5 w-5" />
              </a>
              {others.length > 0 && (
                <div className="flex flex-wrap justify-center gap-3 lg:justify-start">
                  {others.map((r) => (
                    <a
                      key={r.id}
                      href={r.url}
                      target="_blank"
                      rel="noopener"
                      onClick={() => onBuyClick(r)}
                      className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-void/40 px-5 py-2.5 text-sm text-white backdrop-blur transition hover:border-gold hover:text-gold"
                    >
                      {r.label} · {r.format}
                      {r.price && <span className="text-mist">{r.price}</span>}
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
