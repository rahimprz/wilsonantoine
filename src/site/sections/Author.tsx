import { useRef } from "react";
import { Stethoscope } from "lucide-react";
import { gsap, MOTION_OK, useGSAP } from "../../lib/gsap";
import type { SiteContent } from "../../data/types";
import RevealText from "../components/RevealText";
import ScrubText from "../components/ScrubText";
import SmartImage from "../components/SmartImage";

export default function Author({ author }: { author: SiteContent["author"] }) {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const q = gsap.utils.selector(root);
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        const enter = { trigger: q("[data-portrait]")[0], start: "top 80%", once: true };
        gsap.fromTo(q("[data-portrait-mask]"), { clipPath: "inset(100% 0% 0% 0% round 16px)" }, { clipPath: "inset(0% 0% 0% 0% round 16px)", duration: 1.7, ease: "expo.inOut", scrollTrigger: enter });
        gsap.fromTo(q("[data-portrait-img]"), { scale: 1.3 }, { scale: 1, duration: 2.2, ease: "expo.out", scrollTrigger: enter });
        gsap.from(q("[data-badge]"), { y: 30, opacity: 0, duration: 1, delay: 1.1, scrollTrigger: enter });
        // the gold frame slides against the portrait as the section scrolls by
        gsap.fromTo(q("[data-frame]"), { x: -26, y: 40 }, { x: 22, y: -22, ease: "none", scrollTrigger: { trigger: root.current, scrub: true } });
        gsap.fromTo(q("[data-portrait-par]"), { yPercent: 6 }, { yPercent: -6, ease: "none", scrollTrigger: { trigger: root.current, scrub: true } });

        gsap.from(q("[data-in]"), { y: 30, opacity: 0, duration: 1.1, stagger: 0.12, scrollTrigger: { trigger: root.current, start: "top 70%", once: true } });

        // count up any purely numeric highlight ("30+")
        q("[data-count]").forEach((el) => {
          const target = Number(el.getAttribute("data-count"));
          const suffix = el.getAttribute("data-suffix") ?? "";
          const state = { v: 0 };
          gsap.to(state, {
            v: target,
            duration: 2.2,
            ease: "power3.out",
            scrollTrigger: { trigger: el, start: "top 90%", once: true },
            onUpdate: () => {
              el.textContent = `${Math.round(state.v)}${suffix}`;
            },
          });
        });
      });
    },
    { scope: root },
  );

  return (
    <section id="author" ref={root} className="relative z-10 overflow-hidden py-28 md:py-40">
      {/* slow drifting light, after the original's animated gold gradient */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 right-[-10%] h-[620px] w-[620px] rounded-full bg-gold/15 blur-[130px] [animation:drift-a_18s_ease-in-out_infinite]" />
        <div className="absolute bottom-[-20%] left-[-10%] h-[680px] w-[680px] rounded-full bg-royal/30 blur-[140px] [animation:drift-b_22s_ease-in-out_infinite]" />
      </div>

      <div className="container-site relative grid items-center gap-16 lg:grid-cols-[1.05fr_0.95fr] lg:gap-24">
        <div className="order-2 lg:order-1">
          <p data-in className="eyebrow">
            {author.eyebrow}
          </p>
          <RevealText by="chars" className="heading-lg mt-5 text-white">
            {author.name}
          </RevealText>
          {author.credentials && (
            <p data-in className="mt-4 font-serif text-2xl italic text-gold-light">
              {author.credentials}
            </p>
          )}
          <ScrubText className="mt-8 text-[1.2rem] leading-[1.85] text-star md:text-[1.3rem]">{author.bio}</ScrubText>

          {author.highlights.length > 0 && (
            <dl data-in className="mt-12 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-3">
              {author.highlights.map((h) => {
                const m = /^(\d+)(\+?)$/.exec(h.value.trim());
                return (
                  <div key={h.id} className="bg-void/80 px-5 py-6 backdrop-blur">
                    <dt className="sr-only">{h.label}</dt>
                    <dd>
                      <span
                        className="block font-display text-4xl font-semibold text-gold-gradient md:text-5xl"
                        data-count={m ? m[1] : undefined}
                        data-suffix={m ? m[2] : undefined}
                      >
                        {h.value}
                      </span>
                      <span className="mt-2 block text-sm leading-snug text-mist">{h.label}</span>
                    </dd>
                  </div>
                );
              })}
            </dl>
          )}
        </div>

        <div data-portrait className="relative order-1 mx-auto w-full max-w-md lg:order-2">
          <div data-frame className="absolute inset-0 rounded-2xl border-2 border-gold/60" aria-hidden />
          <div data-portrait-par className="relative">
            <div data-portrait-mask className="relative overflow-hidden rounded-2xl shadow-[0_50px_100px_-40px_rgba(0,0,0,0.95)]">
              <div data-portrait-img>
                <SmartImage
                  src={author.image}
                  alt={`Portrait of ${author.name}`}
                  loading="lazy"
                  className="aspect-[1832/2352] h-auto w-full object-cover"
                  fallback={
                    <div className="grid aspect-[4/5] w-full place-items-center bg-gradient-to-br from-indigo to-void">
                      <span className="font-serif text-8xl text-gold/70">WA</span>
                    </div>
                  }
                />
              </div>
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-void/50 via-transparent to-transparent" />
            </div>
          </div>
          <div data-badge className="glass absolute -bottom-6 -left-4 flex items-center gap-3 rounded-2xl px-5 py-4 shadow-2xl md:-left-10">
            <span className="grid h-11 w-11 place-items-center rounded-full bg-gold text-void">
              <Stethoscope className="h-5 w-5" />
            </span>
            <span>
              <span className="block font-display text-sm font-semibold text-white">{author.name}</span>
              <span className="block text-xs text-mist">{author.credentials}</span>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
