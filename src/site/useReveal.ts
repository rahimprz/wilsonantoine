import type { RefObject } from "react";
import { gsap, MOTION_OK, useGSAP } from "../lib/gsap";

/**
 * The site's one entrance: anything marked data-reveal inside `scope` rises and fades in as it
 * enters the viewport, siblings in a gentle stagger. Calm by design — the book is the show.
 */
export function useReveal(scope: RefObject<HTMLElement | null>, deps: unknown[] = []) {
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        gsap.utils.toArray<HTMLElement>("[data-reveal]", scope.current).forEach((el) => {
          const delay = Number(el.dataset.reveal) || 0;
          gsap.from(el, { y: 36, opacity: 0, duration: 1.1, delay, ease: "expo.out", scrollTrigger: { trigger: el, start: "top 88%", once: true } });
        });
      });
    },
    { scope, dependencies: deps },
  );
}
