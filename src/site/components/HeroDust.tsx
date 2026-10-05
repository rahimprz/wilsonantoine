import { useEffect, useRef } from "react";
import { prefersReducedMotion } from "../../lib/gsap";

/** Fine stars and slow-rising motes of gold light around the hero — quiet, and paused off-screen. */
export default function HeroDust({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const still = prefersReducedMotion();
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    type P = { x: number; y: number; r: number; vy: number; vx: number; a: number; tw: number; gold: boolean };
    let w = 0;
    let h = 0;
    let ps: P[] = [];
    let raf = 0;
    let visible = true;
    const build = () => {
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.min(140, Math.round((w * h) / 9000));
      ps = Array.from({ length: n }, () => {
        const gold = Math.random() < 0.35;
        return { x: Math.random() * w, y: Math.random() * h, r: gold ? 0.8 + Math.random() * 1.6 : 0.4 + Math.random() * 0.9, vy: gold ? -(0.08 + Math.random() * 0.25) : 0, vx: (Math.random() - 0.5) * 0.08, a: Math.random(), tw: Math.random() * Math.PI * 2, gold };
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
          if (p.x > w + 10) p.x = -10;
        }
        const tw = 0.45 + 0.55 * Math.sin(t * 0.0015 + p.tw);
        if (p.gold) {
          const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 4);
          g.addColorStop(0, `rgba(240,214,160,${0.75 * tw})`);
          g.addColorStop(1, "rgba(240,214,160,0)");
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r * 4, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillStyle = `rgba(225,232,255,${0.7 * tw})`;
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
  }, []);
  return <canvas ref={ref} aria-hidden className={`pointer-events-none ${className}`} />;
}
