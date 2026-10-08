import { useRef, useState, type CSSProperties } from "react";
import { gsap, MOTION_OK, useGSAP } from "../../lib/gsap";
import { resolveMedia } from "../../lib/media";

interface Book3DProps {
  cover: string;
  title: string;
  author: string;
  /** CSS length for the cover width, e.g. "clamp(220px, 26vw, 320px)". */
  width?: string;
  /** Resting turn of the book, in degrees. */
  turn?: number;
  className?: string;
}

/**
 * The book as an object: the flat front cover wrapped onto a CSS 3D block with a spine, page edges
 * and a soft floor shadow. It follows the pointer a little and bobs gently. When no cover image is
 * set (or it can't load) the cover is drawn to match his navy-and-earth design.
 */
export default function Book3D({ cover, title, author, width = "clamp(220px, 26vw, 320px)", turn = 24, className = "" }: Book3DProps) {
  const root = useRef<HTMLDivElement>(null);
  const url = resolveMedia(cover);
  const [failed, setFailed] = useState(false);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        const el = root.current!;
        const book = el.querySelector<HTMLElement>("[data-book]")!;
        gsap.to(el.querySelector("[data-bob]"), { y: -12, duration: 3.4, ease: "sine.inOut", yoyo: true, repeat: -1 });
        const ry = gsap.quickTo(book, "rotationY", { duration: 1.2, ease: "power3.out" });
        const rx = gsap.quickTo(book, "rotationX", { duration: 1.2, ease: "power3.out" });
        gsap.set(book, { rotationY: turn, rotationX: 6 });
        const onMove = (e: PointerEvent) => {
          const r = el.getBoundingClientRect();
          const px = (e.clientX - (r.left + r.width / 2)) / window.innerWidth;
          const py = (e.clientY - (r.top + r.height / 2)) / window.innerHeight;
          ry(turn + px * 34);
          rx(6 - py * 14);
        };
        const onLeave = () => {
          ry(turn);
          rx(6);
        };
        window.addEventListener("pointermove", onMove, { passive: true });
        document.addEventListener("pointerleave", onLeave);
        return () => {
          window.removeEventListener("pointermove", onMove);
          document.removeEventListener("pointerleave", onLeave);
        };
      });
    },
    { scope: root, dependencies: [turn] },
  );

  const vars = { "--w": width, "--h": "calc(var(--w) * 1.33)", "--d": "calc(var(--w) * 0.12)" } as CSSProperties;
  const half = (v: string) => `calc(var(${v}) / 2)`;

  return (
    <div ref={root} className={`relative mx-auto w-fit ${className}`} style={vars}>
      <div className="pointer-events-none absolute top-1/2 left-1/2 h-[120%] w-[150%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(51,84,210,0.55),rgba(42,196,234,0.12)_55%,transparent)] blur-2xl" />
      <div data-bob className="relative [perspective:1800px]">
        <div data-book className="relative h-[var(--h)] w-[var(--w)] [transform-style:preserve-3d]" style={{ transform: `rotateY(${turn}deg) rotateX(6deg)` }}>
          {/* front */}
          <div className="absolute inset-0 overflow-hidden rounded-r-[4px] bg-[#0b1430] [backface-visibility:hidden]" style={{ transform: `translateZ(${half("--d")})` }}>
            {url && !failed ? (
              <img src={url} alt={`${title} — front cover`} loading="lazy" onError={() => setFailed(true)} className="h-full w-full object-cover" />
            ) : (
              <DrawnCover title={title} author={author} />
            )}
            {/* hinge crease and a soft sheen */}
            <span className="absolute inset-y-0 left-0 w-[7%] bg-gradient-to-r from-black/45 via-white/10 to-transparent" />
            <span className="absolute inset-0 bg-[linear-gradient(115deg,rgba(255,255,255,0.18),transparent_35%,transparent_70%,rgba(255,255,255,0.06))]" />
          </div>
          {/* back */}
          <div className="absolute inset-0 rounded-l-[4px] bg-gradient-to-br from-[#16224d] to-[#070d22]" style={{ transform: `rotateY(180deg) translateZ(${half("--d")})` }} />
          {/* spine */}
          <div
            className="absolute top-0 flex h-full items-center justify-center bg-gradient-to-r from-[#060b1d] via-[#18265a] to-[#0b1430]"
            style={{ width: "var(--d)", left: `calc(${half("--w")} - ${half("--d")})`, transform: `rotateY(-90deg) translateZ(${half("--w")})` }}
          >
            <span className="caps text-[0.42rem] whitespace-nowrap text-gold-light/90 [writing-mode:vertical-rl]">{title}</span>
          </div>
          {/* page block */}
          <div
            className="absolute top-[1.2%] h-[97.6%] bg-[repeating-linear-gradient(90deg,#f3eee3_0px,#f3eee3_1px,#d9d1bf_2px)]"
            style={{ width: "calc(var(--d) - 2px)", left: `calc(${half("--w")} - ${half("--d")} + 1px)`, transform: `rotateY(90deg) translateZ(calc(${half("--w")} - 3px))` }}
          />
          <div
            className="absolute left-0 w-[98%] bg-[repeating-linear-gradient(0deg,#f3eee3_0px,#f3eee3_1px,#d9d1bf_2px)]"
            style={{ height: "calc(var(--d) - 2px)", top: `calc(${half("--h")} - ${half("--d")} + 1px)`, transform: `rotateX(90deg) translateZ(calc(${half("--h")} - 3px))` }}
          />
          <div
            className="absolute left-0 w-[98%] bg-[#d9d1bf]"
            style={{ height: "calc(var(--d) - 2px)", top: `calc(${half("--h")} - ${half("--d")} + 1px)`, transform: `rotateX(-90deg) translateZ(calc(${half("--h")} - 3px))` }}
          />
        </div>
      </div>
      <div className="mx-auto mt-8 h-6 w-[85%] rounded-[50%] bg-black/60 blur-xl" />
    </div>
  );
}

function DrawnCover({ title, author }: { title: string; author: string }) {
  return (
    <div className="relative flex h-full flex-col items-center justify-between bg-[radial-gradient(120%_80%_at_50%_70%,#1836a5,#0b1430_60%,#050a1c)] px-[8%] py-[10%] text-center">
      <span className="stars-bg pointer-events-none absolute inset-0" />
      <p className="relative text-[clamp(0.8rem,1.6vw,1.1rem)] leading-tight font-medium tracking-[0.08em] text-white uppercase">{title}</p>
      <span className="relative aspect-square w-[55%] rounded-full bg-[radial-gradient(circle_at_35%_35%,#7fd3ff,#1f6fd1_45%,#0b2a6e_75%)] shadow-[0_0_60px_rgba(42,196,234,0.55)]" />
      <p className="relative text-[clamp(0.6rem,1.1vw,0.8rem)] tracking-[0.12em] text-white/90 uppercase">{author}</p>
    </div>
  );
}
