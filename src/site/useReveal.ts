import type { RefObject } from "react";
import { gsap, MOTION_OK, useGSAP } from "../lib/gsap";

/**
 * Shared entrance: [data-reveal] elements fade up as they enter view, ornament lines draw in,
 * and [data-zoom] images settle from a slight scale.
 */
export function useReveal(scope: RefObject<HTMLElement | null>, deps: unknown[] = []) {
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        gsap.utils.toArray<HTMLElement>("[data-reveal]", scope.current).forEach((el) => {
          gsap.from(el, { y: 32, opacity: 0, duration: 1.05, delay: Number(el.dataset.reveal) || 0, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 90%", once: true } });
        });
        gsap.utils.toArray<HTMLElement>("[data-orn-line]", scope.current).forEach((el) => {
          gsap.from(el, { scaleX: 0, duration: 1.3, ease: "expo.out", scrollTrigger: { trigger: el, start: "top 92%", once: true } });
        });
        gsap.utils.toArray<HTMLElement>("[data-zoom]", scope.current).forEach((el) => {
          gsap.from(el, { scale: 0.9, opacity: 0, duration: 1.6, ease: "expo.out", scrollTrigger: { trigger: el, start: "top 85%", once: true } });
        });
      });
    },
    { scope, dependencies: deps },
  );
}
