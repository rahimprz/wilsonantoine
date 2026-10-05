import { useRef } from "react";
import { ArrowUpRight, ChevronRight } from "lucide-react";
import { gsap, MOTION_OK, ScrollTrigger, SplitText, useGSAP } from "../../lib/gsap";
import type { Retailer, SiteContent } from "../../data/types";
import BgVideo from "../components/BgVideo";
import Book3D from "../components/Book3D";
import SmartImage from "../components/SmartImage";
import { onBuyClick } from "../buy";
import { onIntroDone } from "../intro";
import { scrollToTarget } from "../smooth";

interface HeroProps {
  hero: SiteContent["hero"];
  announcement?: SiteContent["announcement"];
  retailer?: Retailer;
  onExcerpt: () => void;
}

export default function Hero({ hero, announcement, retailer, onExcerpt }: HeroProps) {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const q = gsap.utils.selector(root);
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        const split = SplitText.create(q("[data-title]")[0], { type: "chars,words", charsClass: "inline-block" });
        gsap.set(q("[data-bg]"), { scale: 1.2, opacity: 0 });
        gsap.set(q("[data-books]"), { y: 140, opacity: 0, scale: 0.88, filter: "blur(18px)" });
        gsap.set(split.chars, { yPercent: 120, rotateX: -90, opacity: 0, transformOrigin: "50% 100%" });
        gsap.set(q("[data-fade]"), { y: 26, opacity: 0 });

        let intro: gsap.core.Timeline | undefined;
        const stop = onIntroDone(() => {
          intro = gsap
            .timeline()
            .to(q("[data-bg]"), { scale: 1, opacity: 1, duration: 2.6, ease: "power2.out" })
            .to(q("[data-books]"), { y: 0, opacity: 1, scale: 1, filter: "blur(0px)", duration: 2, ease: "expo.out" }, 0.15)
            .to(split.chars, { yPercent: 0, rotateX: 0, opacity: 1, duration: 1.3, stagger: 0.028, ease: "expo.out" }, 0.75)
            .to(q("[data-fade]"), { y: 0, opacity: 1, duration: 1.1, stagger: 0.12 }, 1.15);
        });

        // leaving the hero: the books lift away, the copy dissolves, the sky deepens
        const out = gsap.timeline({
          scrollTrigger: { trigger: root.current, start: "top top", end: "bottom top", scrub: 0.8 },
        });
        out
          .to(q("[data-books-scroll]"), { yPercent: -22, scale: 0.86, ease: "none" }, 0)
          .to(q("[data-copy]"), { y: -90, opacity: 0, ease: "none" }, 0)
          .to(q("[data-copy-top]"), { y: -40, opacity: 0, ease: "none" }, 0)
          .to(q("[data-bg-scroll]"), { yPercent: 16, scale: 1.08, ease: "none" }, 0)
          .to(q("[data-veil]"), { opacity: 1, ease: "none" }, 0);

        // pointer parallax (mouse only)
        let cleanupPointer = () => {};
        if (window.matchMedia("(pointer: fine)").matches) {
          const bx = gsap.quickTo(q("[data-books-mouse]"), "x", { duration: 1.4, ease: "power3.out" });
          const by = gsap.quickTo(q("[data-books-mouse]"), "y", { duration: 1.4, ease: "power3.out" });
          const br = gsap.quickTo(q("[data-books-mouse]"), "rotateY", { duration: 1.4, ease: "power3.out" });
          const gx = gsap.quickTo(q("[data-bg-mouse]"), "x", { duration: 2, ease: "power3.out" });
          const gy = gsap.quickTo(q("[data-bg-mouse]"), "y", { duration: 2, ease: "power3.out" });
          const onMove = (e: PointerEvent) => {
            const x = e.clientX / window.innerWidth - 0.5;
            const y = e.clientY / window.innerHeight - 0.5;
            bx(x * 26);
            by(y * 16);
            br(x * 6);
            gx(-x * 18);
            gy(-y * 12);
          };
          window.addEventListener("pointermove", onMove);
          cleanupPointer = () => window.removeEventListener("pointermove", onMove);
        }

        return () => {
          stop();
          intro?.kill();
          cleanupPointer();
          split.revert();
        };
      });
      ScrollTrigger.refresh();
    },
    { scope: root, dependencies: [hero.title] },
  );

  const announceExternal = announcement?.link && !announcement.link.startsWith("#");

  return (
    <section id="home" ref={root} className="relative isolate z-10 min-h-[100svh] overflow-hidden" aria-label="Introduction">
      {/* sky */}
      <div data-bg-scroll className="absolute inset-0 -z-10">
        <div data-bg-mouse className="absolute -inset-6">
          <div data-bg className="absolute inset-0">
            <SmartImage src={hero.backgroundImage} alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover" fetchPriority="high" />
            <BgVideo src={hero.backgroundVideo} className="absolute inset-0 h-full w-full mix-blend-screen" />
          </div>
        </div>
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(17,17,17,0.55)_0%,rgba(17,17,17,0)_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(70%_55%_at_50%_42%,transparent_0%,rgba(3,5,13,0.35)_70%,rgba(3,5,13,0.8)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-b from-transparent to-void" />
        <div data-veil className="absolute inset-0 bg-void opacity-0" />
      </div>

      <div className="container-site relative flex min-h-[100svh] flex-col items-center justify-center pt-24 pb-24 text-center md:pt-28 md:pb-20">
        <div data-copy-top className="relative">
          {announcement?.text && (
            <a
              data-fade
              href={announcement.link || "#buy"}
              target={announceExternal ? "_blank" : undefined}
              rel={announceExternal ? "noopener" : undefined}
              onClick={(e) => {
                if (!announceExternal) {
                  e.preventDefault();
                  scrollToTarget(announcement.link || "#buy");
                }
              }}
              className="glass group mb-5 inline-flex md:mb-7 items-center gap-3 rounded-full py-1.5 pr-2 pl-4 text-[0.8rem] text-white/90 transition hover:border-gold/60"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-cyan shadow-[0_0_10px_#2ac4ea]" />
              {announcement.text}
              {announcement.linkLabel && (
                <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-gold-light transition group-hover:bg-gold group-hover:text-void">
                  {announcement.linkLabel} <ChevronRight className="h-3.5 w-3.5" />
                </span>
              )}
            </a>
          )}
        </div>
        {/* the books */}
        <div data-books-scroll className="relative w-full">
          <div data-books className="relative mx-auto" style={{ width: "min(100%, 900px, calc(38svh * 2.49))" }}>
            <div className="pointer-events-none absolute top-1/2 left-1/2 -z-10 h-[90%] w-[70%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(70,110,255,0.45),rgba(181,159,120,0.15)_60%,transparent)] blur-2xl animate-pulse-glow" />
            <div data-books-mouse className="[transform-style:preserve-3d]">
              <div className="animate-float">
                <SmartImage
                  src={hero.booksImage}
                  alt="Postmortem Life Continuation — hardcover, paperback and back cover"
                  className="h-auto w-full drop-shadow-[0_40px_60px_rgba(0,0,0,0.65)]"
                  fetchPriority="high"
                  fallback={<div className="mx-auto" style={{ width: "min(24svh, 240px)" }}><Book3D /></div>}
                />
              </div>
            </div>
          </div>
        </div>

        <div data-copy className="relative mt-6 flex flex-col items-center md:mt-8">
          <h1 data-title className="heading-xl max-w-5xl text-white [perspective:600px] [text-shadow:0_4px_40px_rgba(24,54,165,0.55)]">
            {hero.title}
          </h1>
          <p data-fade className="mt-4 max-w-2xl text-lg text-white/90 md:text-xl">
            {hero.subtitle}
          </p>
          {hero.eyebrow && (
            <p data-fade className="mt-2 font-serif text-lg italic text-gold-light/90">
              {hero.eyebrow}
            </p>
          )}
          <div data-fade className="mt-7 flex flex-wrap items-center justify-center gap-4">
            <button onClick={onExcerpt} className="btn btn-ghost">
              {hero.primaryCta}
              <span className="btn-orb">
                <ChevronRight className="h-5 w-5" />
              </span>
            </button>
            {retailer && (
              <a href={retailer.url} target="_blank" rel="noopener" onClick={() => onBuyClick(retailer)} className="btn btn-gold">
                {hero.secondaryCta} <ArrowUpRight className="h-4 w-4" />
              </a>
            )}
          </div>
        </div>
      </div>

      <button
        data-fade
        onClick={() => scrollToTarget("#about-book")}
        className="absolute bottom-7 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-3 text-[0.65rem] tracking-[0.4em] text-white/60 uppercase md:flex"
        aria-label="Scroll to the next section"
      >
        Scroll
        <span className="relative h-12 w-px overflow-hidden bg-white/15">
          <span className="absolute inset-x-0 top-0 h-1/2 animate-[scroll-cue_2.2s_cubic-bezier(0.65,0,0.35,1)_infinite] bg-gold" />
        </span>
      </button>
    </section>
  );
}
