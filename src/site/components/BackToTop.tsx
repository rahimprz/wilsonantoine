import { useEffect, useRef, useState } from "react";
import { ArrowUp } from "lucide-react";
import { scrollToTarget } from "../smooth";

const C = 2 * Math.PI * 22;

/** Back-to-top button whose gold ring fills with reading progress. */
export default function BackToTop() {
  const ring = useRef<SVGCircleElement>(null);
  const [show, setShow] = useState(false);
  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? window.scrollY / max : 0;
      if (ring.current) ring.current.style.strokeDashoffset = String(C * (1 - p));
      setShow(window.scrollY > window.innerHeight);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);
  return (
    <button
      onClick={() => scrollToTarget(0)}
      aria-label="Back to top"
      className={`fixed right-5 bottom-24 z-40 grid h-12 w-12 place-items-center rounded-full border border-white/10 bg-[#0a1015]/85 text-gold-light shadow-[0_10px_30px_-8px_rgba(0,0,0,0.8)] backdrop-blur transition-all duration-500 hover:-translate-y-1 md:right-7 md:bottom-7 ${show ? "opacity-100" : "pointer-events-none translate-y-4 opacity-0"}`}
    >
      <svg className="absolute inset-0 -rotate-90" viewBox="0 0 48 48" aria-hidden>
        <circle cx="24" cy="24" r="22" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="2" />
        <circle ref={ring} cx="24" cy="24" r="22" fill="none" stroke="#b59f78" strokeWidth="2" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C} />
      </svg>
      <ArrowUp className="h-5 w-5" />
    </button>
  );
}
