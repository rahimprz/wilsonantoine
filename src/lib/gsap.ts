import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, useGSAP);
gsap.defaults({ ease: "expo.out", duration: 1.1 });

/** Media query under which decorative motion runs; everything stays readable without it. */
export const MOTION_OK = "(prefers-reduced-motion: no-preference)";

export const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export { gsap, ScrollTrigger, useGSAP };
