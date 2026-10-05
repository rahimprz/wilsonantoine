import { useEffect, useRef, useState } from "react";
import { ArrowUp } from "lucide-react";
import { scrollToTarget } from "../smooth";

/** The gold progress thread along the top edge, plus a back-to-top button whose ring fills as you read. */
export default function ScrollChrome() {
  const bar = useRef<HTMLDivElement>(null);
  const circle = useRef<SVGCircleElement>(null);
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    const C = 2 * Math.PI * 22;
    let raf = 0;
    const update = () => {
      raf = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(1, window.scrollY / max) : 0;
      if (bar.current) bar.current.style.transform = `scaleX(${p})`;
      if (circle.current) circle.current.style.strokeDashoffset = String(C * (1 - p));
      setShowTop(window.scrollY > window.innerHeight * 1.2);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <>
      <div className="pointer-events-none fixed inset-x-0 top-0 z-[70] h-[2px]">
        <div ref={bar} className="h-full origin-left scale-x-0 bg-gradient-to-r from-gold-deep via-gold-light to-cyan" />
      </div>
      <button
        onClick={() => scrollToTarget(0)}
        aria-label="Back to top"
        className={`fixed right-5 bottom-24 z-40 grid h-14 w-14 place-items-center rounded-full bg-void/70 text-white backdrop-blur-md transition-all duration-500 hover:text-gold md:right-8 md:bottom-8 ${
          showTop ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-6 opacity-0"
        }`}
      >
        <svg className="absolute inset-0 -rotate-90" viewBox="0 0 48 48" aria-hidden>
          <circle cx="24" cy="24" r="22" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" />
          <circle
            ref={circle}
            cx="24"
            cy="24"
            r="22"
            fill="none"
            stroke="#b59f78"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 22}
            strokeDashoffset={2 * Math.PI * 22}
          />
        </svg>
        <ArrowUp className="h-5 w-5" />
      </button>
    </>
  );
}
