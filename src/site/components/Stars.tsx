import { useEffect, useRef } from "react";
import { prefersReducedMotion } from "../../lib/gsap";

/**
 * Twinkling stars and slow-rising motes of gold light, drawn on a canvas that fills its parent.
 * Pauses whenever it's off screen; draws a single still frame under reduced motion.
 */
export default function Stars({ className = "", density = 9000, gold = 0.3 }: { className?: string; density?: number; gold?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const still = prefersReducedMotion();
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    type P = { x: number; y: number; r: number; vy: number; vx: number; tw: number; g: boolean };
    let w = 0;
    let h = 0;
    let ps: P[] = [];
    let raf = 0;
    let visible = true;
    const build = () => {
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.min(180, Math.round((w * h) / density));
      ps = Array.from({ length: n }, () => {
        const g = Math.random() < gold;
        return {
          x: Math.random() * w,
          y: Math.random() * h,
          r: g ? 0.8 + Math.random() * 1.5 : 0.35 + Math.random() * 0.95,
          vy: g ? -(0.06 + Math.random() * 0.22) : 0,
          vx: (Math.random() - 0.5) * 0.06,
          tw: Math.random() * Math.PI * 2,
          g,
        };
      });
    };
    const draw = (t: number) => {
      ctx.clearRect(0, 0, w, h);
      for (const p of ps) {
        if (!still) {
          p.y += p.vy;
          p.x += p.vx;
          if (p.y < -10) p.y = h + 10;
          if (p.x < -10) p.x = w + 10;
          else if (p.x > w + 10) p.x = -10;
        }
        const a = 0.4 + 0.6 * Math.abs(Math.sin(t * 0.0011 + p.tw));
        if (p.g) {
          const grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 4);
          grd.addColorStop(0, `rgba(236,214,166,${0.8 * a})`);
          grd.addColorStop(1, "rgba(236,214,166,0)");
          ctx.fillStyle = grd;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r * 4, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillStyle = `rgba(226,234,255,${0.75 * a})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      if (!still && visible) raf = requestAnimationFrame(draw);
    };
    build();
    draw(0);
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      cancelAnimationFrame(raf);
      if (visible && !still) raf = requestAnimationFrame(draw);
    });
    io.observe(canvas);
    const onResize = () => {
      build();
      if (still) draw(0);
    };
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener("resize", onResize);
    };
  }, [density, gold]);
  return <canvas ref={ref} aria-hidden className={`pointer-events-none ${className}`} />;
}
