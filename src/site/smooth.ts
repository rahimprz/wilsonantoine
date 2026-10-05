import type Lenis from "lenis";

/** The page's Lenis instance (null under reduced motion), shared so links and modals can drive it. */
let lenis: Lenis | null = null;
export const setLenis = (l: Lenis | null) => {
  lenis = l;
};
export const getLenis = () => lenis;

export const HEADER_OFFSET = 84;

export function scrollToTarget(target: string | number) {
  if (typeof target === "string") {
    const el = document.querySelector<HTMLElement>(target);
    if (!el) return;
    if (lenis) lenis.scrollTo(el, { offset: -HEADER_OFFSET + 1, duration: 1.6 });
    else window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET, behavior: "smooth" });
  } else if (lenis) lenis.scrollTo(target, { duration: 1.6 });
  else window.scrollTo({ top: target, behavior: "smooth" });
}

export function lockScroll(locked: boolean) {
  if (lenis) {
    if (locked) lenis.stop();
    else lenis.start();
  }
  document.documentElement.style.overflow = locked ? "hidden" : "";
}
