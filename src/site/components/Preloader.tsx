import { useEffect, useRef, useState } from "react";
import { gsap, prefersReducedMotion } from "../../lib/gsap";
import { resolveMedia } from "../../lib/media";
import { finishIntro } from "../intro";
import { lockScroll } from "../smooth";

const SEEN_KEY = "wa.intro.seen";

function shouldPlay() {
  if (prefersReducedMotion()) return false;
  try {
    return !sessionStorage.getItem(SEEN_KEY);
  } catch {
    return true;
  }
}

/**
 * First-visit curtain: the logo surfaces out of the dark, a gold thread draws across, then the
 * curtain lifts into the hero. Plays once per browsing session; never under reduced motion.
 */
export default function Preloader({ logo }: { logo: string }) {
  const [active, setActive] = useState(shouldPlay);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!active) {
      finishIntro();
      return;
    }
    lockScroll(true);
    const el = root.current!;
    const minTime = new Promise((r) => setTimeout(r, 1500));
    const fonts = document.fonts?.ready ?? Promise.resolve();
    const cap = new Promise((r) => setTimeout(r, 3200)); // never hold the page hostage

    const tl = gsap.timeline({ paused: true });
    tl.from(el.querySelector("[data-logo]"), { opacity: 0, scale: 0.92, filter: "blur(12px)", duration: 1.4 })
      .from(el.querySelector("[data-tag]"), { opacity: 0, y: 12, duration: 1 }, "-=0.9")
      .to(el.querySelector("[data-line]"), { scaleX: 1, duration: 1.2, ease: "power2.inOut" }, "-=1.1");
    tl.play();

    Promise.race([Promise.all([minTime, fonts]), cap]).then(() => {
      gsap
        .timeline({
          onComplete: () => {
            try {
              sessionStorage.setItem(SEEN_KEY, "1");
            } catch {
              /* ignore */
            }
            lockScroll(false);
            setActive(false);
          },
        })
        .to(el.querySelector("[data-content]"), { opacity: 0, y: -30, duration: 0.6, ease: "power2.in" })
        .to(el, { clipPath: "inset(0% 0% 100% 0%)", duration: 1.15, ease: "expo.inOut" }, "-=0.15")
        .add(() => finishIntro(), "-=0.75");
    });
    return () => {
      tl.kill();
    };
  }, [active]);

  if (!active) return null;
  return (
    <div
      ref={root}
      className="fixed inset-0 z-[100] grid place-items-center bg-void [clip-path:inset(0%_0%_0%_0%)]"
      aria-hidden
    >
      <div className="absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_45%,rgba(24,54,165,0.35),transparent_70%)]" />
      <div data-content className="relative flex flex-col items-center gap-6 px-6 text-center">
        <img data-logo src={resolveMedia(logo)} alt="" className="h-20 w-auto md:h-24" onError={(e) => (e.currentTarget.style.display = "none")} />
        <div data-line className="hairline w-56 origin-left scale-x-0" />
        <p data-tag className="font-serif text-xl italic text-mist md:text-2xl">Life does not end at death.</p>
      </div>
    </div>
  );
}
