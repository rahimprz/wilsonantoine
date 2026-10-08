import type { RefObject } from "react";
import { gsap, MOTION_OK, useGSAP } from "../lib/gsap";

/** Elements marked data-reveal fade up gently as they enter the viewport. Nothing more. */
export function useReveal(scope: RefObject<HTMLElement | null>, deps: unknown[] = []) {
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        gsap.utils.toArray<HTMLElement>("[data-reveal]", scope.current).forEach((el) => {
          gsap.from(el, { y: 28, opacity: 0, duration: 1, delay: Number(el.dataset.reveal) || 0, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 90%", once: true } });
        });
      });
    },
    { scope, dependencies: deps },
  );
}
