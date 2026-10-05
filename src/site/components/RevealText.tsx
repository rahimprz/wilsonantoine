import { createElement, useRef, type ReactNode } from "react";
import { gsap, MOTION_OK, SplitText, useGSAP } from "../../lib/gsap";

interface RevealTextProps {
  as?: "h1" | "h2" | "h3" | "p" | "span" | "div";
  className?: string;
  children: ReactNode;
  delay?: number;
  /** "words" rise out of a line mask; "chars" flip up one letter at a time. */
  by?: "words" | "chars";
  start?: string;
}

/** Text that rises out of a line mask the first time it scrolls into view. */
export default function RevealText({ as = "h2", className, children, delay = 0, by = "words", start = "top 88%" }: RevealTextProps) {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        let played = false;
        const split = SplitText.create(ref.current!, {
          type: by === "chars" ? "lines,words,chars" : "lines,words",
          mask: "lines",
          autoSplit: true,
          onSplit: (self) => {
            if (played) return;
            const targets = by === "chars" ? self.chars : self.words;
            return gsap.from(targets, {
              yPercent: 115,
              rotate: by === "chars" ? 8 : 3,
              opacity: 0,
              duration: 1.2,
              stagger: by === "chars" ? 0.022 : 0.05,
              delay,
              scrollTrigger: { trigger: ref.current, start, once: true },
              onStart: () => {
                played = true;
              },
            });
          },
        });
        return () => split.revert();
      });
    },
    { scope: ref, dependencies: [children] },
  );

  return createElement(as, { ref, className }, children);
}
