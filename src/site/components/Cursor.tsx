import { useEffect, useRef, useState } from "react";
import { gsap, prefersReducedMotion } from "../../lib/gsap";

/**
 * A small difference-blended dot that follows the pointer and opens into a labelled disc over
 * anything marked data-cursor="Read" (chapters, buy rows…). Mouse only.
 */
export default function Cursor() {
  const dot = useRef<HTMLDivElement>(null);
  const [label, setLabel] = useState("");
  const [enabled] = useState(() => typeof window !== "undefined" && !prefersReducedMotion() && window.matchMedia("(pointer: fine)").matches);

  useEffect(() => {
    if (!enabled) return;
    const el = dot.current!;
    gsap.set(el, { xPercent: -50, yPercent: -50, scale: 0 });
    const x = gsap.quickTo(el, "x", { duration: 0.45, ease: "power3.out" });
    const y = gsap.quickTo(el, "y", { duration: 0.45, ease: "power3.out" });
    let current = "";
    let shown = false;
    const onMove = (e: PointerEvent) => {
      x(e.clientX);
      y(e.clientY);
      if (!shown) {
        shown = true;
        gsap.to(el, { scale: 1, duration: 0.4 });
      }
      const target = (e.target as HTMLElement).closest<HTMLElement>("[data-cursor]");
      const next = target?.dataset.cursor ?? "";
      const hoverable = !next && (e.target as HTMLElement).closest("a, button, input, textarea, select");
      if (next !== current) {
        current = next;
        setLabel(next);
        gsap.to(el, { scale: next ? 1 : 1, width: next ? 96 : 12, height: next ? 96 : 12, duration: 0.5, ease: "expo.out" });
      }
      if (!next) gsap.to(el, { scale: hoverable ? 2.6 : 1, duration: 0.4, ease: "expo.out" });
    };
    const onLeave = () => {
      shown = false;
      gsap.to(el, { scale: 0, duration: 0.3 });
    };
    window.addEventListener("pointermove", onMove);
    document.documentElement.addEventListener("pointerleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
    };
  }, [enabled]);

  if (!enabled) return null;
  return (
    <div
      ref={dot}
      aria-hidden
      className="pointer-events-none fixed top-0 left-0 z-[90] grid h-3 w-3 place-items-center rounded-full bg-white mix-blend-difference"
    >
      {label && <span className="label text-[0.62rem] text-black">{label}</span>}
    </div>
  );
}
