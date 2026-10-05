import { createElement, useRef } from "react";
import { gsap, MOTION_OK, SplitText, useGSAP } from "../../lib/gsap";

interface ScrubTextProps {
  as?: "p" | "blockquote" | "h2";
  className?: string;
  children: string;
  /** Scroll distance over which the words light up. */
  start?: string;
  end?: string;
  dim?: number;
}

/** A paragraph whose words brighten one after another as it scrolls through the viewport. */
export default function ScrubText({ as = "p", className, children, start = "top 85%", end = "bottom 45%", dim = 0.18 }: ScrubTextProps) {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        const split = SplitText.create(ref.current!, { type: "words", autoSplit: true });
        const tween = gsap.fromTo(
          split.words,
          { opacity: dim, filter: "blur(2px)" },
          {
            opacity: 1,
            filter: "blur(0px)",
            ease: "none",
            stagger: 0.1,
            scrollTrigger: { trigger: ref.current, start, end, scrub: 0.6 },
          },
        );
        return () => {
          tween.scrollTrigger?.kill();
          tween.kill();
          split.revert();
        };
      });
    },
    { scope: ref, dependencies: [children] },
  );

  return createElement(as, { ref, className }, children);
}
