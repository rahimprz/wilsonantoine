import { useEffect, useRef } from "react";
import { gsap, prefersReducedMotion } from "../../lib/gsap";
import SmartImage from "./SmartImage";

interface Book3DProps {
  className?: string;
  /** Follows the pointer with a gentle tilt (desktop). */
  interactive?: boolean;
  /** Slowly turns on its own. */
  idle?: boolean;
  /** Flat front-cover image; the CSS-drawn cover is used when empty or unavailable. */
  cover?: string;
}

/**
 * The book drawn in CSS 3D — cover, spine, page block and back — so it renders crisply at any size
 * and still shows something beautiful if the mockup photos can't load.
 */
export default function Book3D({ className = "", interactive = true, idle = true, cover = "" }: Book3DProps) {
  const wrap = useRef<HTMLDivElement>(null);
  const book = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = book.current;
    const host = wrap.current;
    if (!el || !host || prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      if (idle) {
        gsap.to(el, { rotateY: -32, duration: 5, ease: "sine.inOut", yoyo: true, repeat: -1 });
      }
    });
    if (!interactive || !window.matchMedia("(pointer: fine)").matches) return () => ctx.revert();
    const rx = gsap.quickTo(el, "rotateX", { duration: 0.8, ease: "power3.out" });
    const rz = gsap.quickTo(el, "rotateZ", { duration: 0.8, ease: "power3.out" });
    const onMove = (e: PointerEvent) => {
      const r = host.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      rx(-y * 16);
      rz(x * 4);
    };
    const onLeave = () => {
      rx(0);
      rz(0);
    };
    host.addEventListener("pointermove", onMove);
    host.addEventListener("pointerleave", onLeave);
    return () => {
      host.removeEventListener("pointermove", onMove);
      host.removeEventListener("pointerleave", onLeave);
      ctx.revert();
    };
  }, [interactive, idle]);

  return (
    <div ref={wrap} className={`[perspective:1600px] ${className}`}>
      <div
        ref={book}
        className="relative mx-auto aspect-[2/3] w-full [transform-style:preserve-3d] [transform:rotateY(-24deg)]"
        role="img"
        aria-label="Postmortem Life Continuation and Compelling Evidence, by Wilson Antoine, MD"
      >
        {/* front cover */}
        <div className="absolute inset-0 overflow-hidden rounded-r-[6px] rounded-l-[2px] [backface-visibility:hidden] [transform:translateZ(18px)] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.8)]">
          {cover && <SmartImage src={cover} alt="" className="absolute inset-0 z-10 h-full w-full object-cover" />}
          <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_10%,#16245e_0%,#081033_45%,#040719_100%)]" />
          <div className="absolute inset-0 opacity-70 [background-image:radial-gradient(1px_1px_at_12%_18%,#fff,transparent),radial-gradient(1px_1px_at_78%_12%,#fff,transparent),radial-gradient(1.5px_1.5px_at_64%_34%,#cfe3ff,transparent),radial-gradient(1px_1px_at_24%_62%,#fff,transparent),radial-gradient(1px_1px_at_88%_70%,#fff,transparent),radial-gradient(1.5px_1.5px_at_40%_86%,#dfe9ff,transparent),radial-gradient(1px_1px_at_8%_90%,#fff,transparent),radial-gradient(1px_1px_at_52%_8%,#fff,transparent)]" />
          <div className="relative flex h-full flex-col items-center px-[9%] pt-[11%] pb-[8%] text-center">
            <p className="font-display text-[clamp(0.55rem,1.55vw,1.05rem)] font-medium leading-[1.25] tracking-[0.06em] text-white">
              POSTMORTEM LIFE
              <br />
              <span className="text-[1.25em]">CONTINUATION</span>
              <br />
              AND COMPELLING
            </p>
            <p className="mt-[3%] font-display text-[clamp(0.45rem,1.15vw,0.8rem)] tracking-[0.22em] text-[#cfd8ff]">EVIDENCE</p>
            {/* planet */}
            <div className="relative my-auto aspect-square w-[58%]">
              <div className="absolute -inset-[18%] rounded-full bg-[radial-gradient(circle,rgba(70,160,255,0.35)_0%,rgba(42,196,234,0.12)_45%,transparent_70%)] blur-[2px]" />
              <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_34%_30%,#7fd0ff_0%,#2a7fd6_28%,#0f3f8f_55%,#06183f_78%)] shadow-[inset_-14px_-10px_30px_rgba(0,0,0,0.65),0_0_40px_rgba(64,150,255,0.55)]" />
              <div className="absolute inset-0 rounded-full opacity-80 mix-blend-screen [background:radial-gradient(28%_18%_at_40%_38%,rgba(120,190,110,0.9),transparent_70%),radial-gradient(18%_26%_at_62%_58%,rgba(196,170,110,0.85),transparent_70%),radial-gradient(22%_12%_at_30%_66%,rgba(110,170,100,0.7),transparent_70%)]" />
              <div className="absolute inset-0 rounded-full opacity-60 [background:radial-gradient(40%_10%_at_50%_24%,rgba(255,255,255,0.7),transparent_70%),radial-gradient(30%_8%_at_44%_78%,rgba(255,255,255,0.55),transparent_70%)]" />
              <div className="absolute inset-0 rounded-full shadow-[inset_0_0_0_1.5px_rgba(150,220,255,0.55)]" />
            </div>
            <p className="font-display text-[clamp(0.45rem,1.15vw,0.85rem)] tracking-[0.12em] text-white">WILSON ANTOINE, MD</p>
          </div>
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(105deg,rgba(255,255,255,0.18)_0%,rgba(255,255,255,0)_22%,rgba(255,255,255,0)_70%,rgba(255,255,255,0.08)_100%)]" />
          <div className="pointer-events-none absolute inset-y-0 left-[3.5%] w-[1.5%] bg-[linear-gradient(90deg,rgba(0,0,0,0.45),rgba(255,255,255,0.12),rgba(0,0,0,0))]" />
        </div>
        {/* page block */}
        <div className="absolute top-[1.2%] right-0 bottom-[1.2%] w-[34px] origin-right [transform:rotateY(90deg)_translateZ(-1px)_translateX(17px)] bg-[repeating-linear-gradient(90deg,#f4efe4_0px,#f4efe4_1px,#d9d2c3_2px)] shadow-[inset_0_0_8px_rgba(0,0,0,0.25)]" />
        {/* spine */}
        <div className="absolute top-0 bottom-0 left-0 w-[36px] origin-left [transform:rotateY(-90deg)_translateX(-18px)] bg-[linear-gradient(90deg,#040719,#0d1a4d_50%,#040719)]">
          <p className="absolute inset-0 flex items-center justify-center font-display text-[9px] tracking-[0.2em] text-white/80 [writing-mode:vertical-rl]">
            POSTMORTEM LIFE CONTINUATION
          </p>
        </div>
        {/* back cover */}
        <div className="absolute inset-0 rounded-l-[6px] bg-[#050a22] [transform:translateZ(-18px)_rotateY(180deg)]" />
      </div>
      {/* floor shadow */}
      <div className="mx-auto mt-6 h-6 w-[70%] rounded-[50%] bg-black/60 blur-xl" />
    </div>
  );
}
