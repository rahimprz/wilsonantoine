import type { ReactNode } from "react";
import { useStore } from "../lib/store";
import { resolveMedia } from "../lib/media";
import { contentStore } from "../data/stores";

/** The book under starlight on the left, a sign-in card on the right — shared by both ways in. */
export default function LockLayout({ children }: { children: ReactNode }) {
  const content = useStore(contentStore);
  const logo = resolveMedia(content.brand.logo);
  const cover = resolveMedia(content.book.cover);
  return (
    <div className="relative grid min-h-screen overflow-hidden bg-[#070b1c] lg:grid-cols-[1.05fr_0.95fr]">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-[radial-gradient(70%_60%_at_50%_45%,#1a2c7a,#0b1233_60%,#070b1c)] p-12 lg:flex">
        <div className="stars-bg pointer-events-none absolute inset-0" />
        <img src={logo} alt={content.brand.name} className="relative h-12 w-auto self-start" onError={(e) => (e.currentTarget.style.display = "none")} />
        <div className="relative mx-auto">
          <div className="absolute top-1/2 left-1/2 aspect-square w-[190%] -translate-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(51,84,210,0.55),transparent)]" />
          <span className="absolute top-1/2 left-1/2 aspect-square w-[175%] -translate-1/2 rounded-full border border-gold/20" />
          <span className="absolute top-1/2 left-1/2 aspect-square w-[145%] -translate-1/2 rounded-full border border-dashed border-cyan/25 animate-spin-slow" />
          {cover && <img src={cover} alt={content.hero.title} className="relative w-[min(260px,22vw)] -rotate-3 rounded-r-[4px] shadow-[0_40px_60px_-20px_rgba(0,0,0,0.9)] animate-float" />}
        </div>
        <div className="relative">
          <p className="font-heading text-[2rem] leading-tight text-white italic">{content.hero.title}</p>
          <p className="mt-2 text-sm tracking-[0.25em] text-gold uppercase">Sales &amp; website dashboard</p>
        </div>
      </div>

      <div className="relative grid place-items-center px-4 py-12">
        <div className="absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_30%,rgba(24,54,165,0.3),transparent_70%)]" />
        {children}
      </div>
    </div>
  );
}
