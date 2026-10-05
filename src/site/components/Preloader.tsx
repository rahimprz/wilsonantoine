import { useEffect, useRef, useState } from "react";
import { gsap, prefersReducedMotion } from "../../lib/gsap";
import { finishIntro } from "../intro";
import { lockScroll } from "../smooth";

const SEEN_KEY = "wa.intro.seen";
const shouldPlay = () => {
  if (prefersReducedMotion()) return false;
  try {
    return !sessionStorage.getItem(SEEN_KEY);
  } catch {
    return true;
  }
};

/**
 * First-visit opening: a count from 00 to 100 in the editorial serif while a thread of light draws
 * across, then the two halves of the ink curtain part to reveal the threshold. Once per session.
 */
export default function Preloader() {
  const [active, setActive] = useState(shouldPlay);
  const root = useRef<HTMLDivElement>(null);
  const count = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!active) {
      finishIntro();
      return;
    }
    lockScroll(true);
    const el = root.current!;
    const q = gsap.utils.selector(el);
    const state = { v: 0 };
    const fonts = document.fonts?.ready ?? Promise.resolve();
    const tl = gsap.timeline({ paused: true });
    tl.to(state, {
      v: 100,
      duration: 2,
      ease: "power2.inOut",
      onUpdate: () => {
        if (count.current) count.current.textContent = String(Math.round(state.v)).padStart(2, "0");
      },
    })
      .to(q("[data-line]"), { scaleX: 1, duration: 2, ease: "power2.inOut" }, 0)
      .from(q("[data-word]"), { yPercent: 110, duration: 1.1, stagger: 0.08, ease: "expo.out" }, 0.1)
      .to(q("[data-content]"), { opacity: 0, y: -20, duration: 0.5, ease: "power2.in" }, "+=0.15")
      .to(q("[data-top]"), { yPercent: -100, duration: 1.2, ease: "expo.inOut" }, "-=0.1")
      .to(q("[data-bottom]"), { yPercent: 100, duration: 1.2, ease: "expo.inOut" }, "<")
      .add(() => finishIntro(), "-=0.8");
    tl.eventCallback("onComplete", () => {
      try {
        sessionStorage.setItem(SEEN_KEY, "1");
      } catch {
        /* ignore */
      }
      lockScroll(false);
      setActive(false);
    });
    // never hold the page longer than a few seconds, even if fonts are slow
    Promise.race([fonts, new Promise((r) => setTimeout(r, 1500))]).then(() => tl.play());
    return () => {
      tl.kill();
    };
  }, [active]);

  if (!active) return null;
  return (
    <div ref={root} className="fixed inset-0 z-[100] text-ivory" aria-hidden>
      <div data-top className="absolute inset-x-0 top-0 h-1/2 bg-ink" />
      <div data-bottom className="absolute inset-x-0 bottom-0 h-1/2 bg-ink" />
      <div data-content className="relative flex h-full flex-col justify-between p-6 md:p-10">
        <div className="label flex justify-between text-[0.65rem] text-sand">
          <span className="overflow-hidden"><span data-word className="inline-block">Wilson Antoine, MD</span></span>
          <span className="overflow-hidden"><span data-word className="inline-block">Postmortem Life Continuation</span></span>
        </div>
        <div>
          <p className="display flex items-end justify-between text-[clamp(5rem,22vw,18rem)] leading-[0.8]">
            <span className="overflow-hidden"><span data-word className="inline-block italic">Life</span></span>
            <span ref={count} className="tabular-nums">00</span>
          </p>
          <div data-line className="mt-6 h-px origin-left scale-x-0 bg-gradient-to-r from-ember via-dawn to-ivory" />
        </div>
      </div>
    </div>
  );
}
