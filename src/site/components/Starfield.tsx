import { useEffect, useRef } from "react";
import { prefersReducedMotion } from "../../lib/gsap";

interface Star {
  x: number;
  y: number;
  z: number; // depth 0.15 (far) .. 1 (near)
  r: number;
  phase: number;
  gold: boolean;
}

/**
 * A fixed star layer behind the whole page. Stars drift with scroll at depth-dependent speeds
 * (parallax) and stretch into short streaks while you scroll fast — a quiet sense of travel.
 */
export default function Starfield() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const still = prefersReducedMotion();
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    let w = 0;
    let h = 0;
    let stars: Star[] = [];
    let raf = 0;
    let lastScroll = window.scrollY;
    let velocity = 0;
    let running = true;

    const build = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.min(260, Math.round((w * h) / 8500));
      stars = Array.from({ length: count }, () => {
        const z = 0.15 + Math.random() ** 2 * 0.85;
        return { x: Math.random() * w, y: Math.random() * h, z, r: 0.35 + z * 1.15, phase: Math.random() * Math.PI * 2, gold: Math.random() < 0.12 };
      });
    };

    const draw = (time: number) => {
      const scroll = window.scrollY;
      const dy = scroll - lastScroll;
      lastScroll = scroll;
      velocity += (dy - velocity) * 0.12;
      ctx.clearRect(0, 0, w, h);
      for (const s of stars) {
        // parallax: near stars move further per pixel scrolled
        s.y -= dy * s.z * 0.35;
        s.y += 0.04 * s.z; // and a very slow ambient drift
        if (s.y < -10) s.y += h + 20;
        else if (s.y > h + 10) s.y -= h + 20;
        const tw = still ? 0.8 : 0.55 + 0.45 * Math.sin(time * 0.0012 * (0.6 + s.z) + s.phase);
        const alpha = (0.25 + 0.75 * s.z) * tw;
        const color = s.gold ? `rgba(220,200,160,${alpha})` : `rgba(220,230,255,${alpha})`;
        const streak = Math.min(Math.abs(velocity) * s.z * 1.4, 70);
        if (streak > 2) {
          ctx.strokeStyle = color;
          ctx.lineWidth = s.r;
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(s.x, s.y);
          ctx.lineTo(s.x, s.y + Math.sign(velocity) * streak);
          ctx.stroke();
        } else {
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      if (running && !still) raf = requestAnimationFrame(draw);
    };

    build();
    draw(0);
    if (!still) raf = requestAnimationFrame(draw);

    const onResize = () => {
      build();
      if (still) draw(0);
    };
    const onVisibility = () => {
      running = !document.hidden;
      cancelAnimationFrame(raf);
      if (running && !still) {
        lastScroll = window.scrollY;
        raf = requestAnimationFrame(draw);
      }
    };
    const onScrollStill = () => draw(0);
    window.addEventListener("resize", onResize);
    document.addEventListener("visibilitychange", onVisibility);
    if (still) window.addEventListener("scroll", onScrollStill, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("scroll", onScrollStill);
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden className="pointer-events-none fixed inset-0 z-0 opacity-80" />;
}
