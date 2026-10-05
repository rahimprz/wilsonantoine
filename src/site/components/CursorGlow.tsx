import { useEffect, useRef } from "react";
import { gsap, prefersReducedMotion } from "../../lib/gsap";

/** A soft starlight halo that trails the pointer and swells over anything clickable (mouse only). */
export default function CursorGlow() {
  const glow = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (prefersReducedMotion() || !window.matchMedia("(pointer: fine)").matches) return;
    const g = glow.current!;
    const r = ring.current!;
    gsap.set([g, r], { xPercent: -50, yPercent: -50, opacity: 0 });
    const gx = gsap.quickTo(g, "x", { duration: 1.1, ease: "power3.out" });
    const gy = gsap.quickTo(g, "y", { duration: 1.1, ease: "power3.out" });
    const rx = gsap.quickTo(r, "x", { duration: 0.35, ease: "power3.out" });
    const ry = gsap.quickTo(r, "y", { duration: 0.35, ease: "power3.out" });
    let shown = false;
    const onMove = (e: PointerEvent) => {
      if (!shown) {
        gsap.to([g, r], { opacity: 1, duration: 0.6 });
        shown = true;
      }
      gx(e.clientX);
      gy(e.clientY);
      rx(e.clientX);
      ry(e.clientY);
      const interactive = (e.target as HTMLElement).closest("a, button, [role=button], input, textarea, summary");
      gsap.to(r, { scale: interactive ? 1.9 : 1, borderColor: interactive ? "rgba(181,159,120,0.9)" : "rgba(255,255,255,0.35)", duration: 0.4 });
    };
    const onLeave = () => {
      gsap.to([g, r], { opacity: 0, duration: 0.4 });
      shown = false;
    };
    window.addEventListener("pointermove", onMove);
    document.documentElement.addEventListener("pointerleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <>
      <div
        ref={glow}
        aria-hidden
        className="pointer-events-none fixed top-0 left-0 z-[60] hidden h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle,rgba(120,150,255,0.10)_0%,rgba(181,159,120,0.06)_35%,transparent_68%)] mix-blend-screen md:block"
      />
      <div
        ref={ring}
        aria-hidden
        className="pointer-events-none fixed top-0 left-0 z-[61] hidden h-7 w-7 rounded-full border border-white/35 md:block"
      />
    </>
  );
}
