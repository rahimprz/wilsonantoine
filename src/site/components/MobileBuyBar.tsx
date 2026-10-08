import { useEffect, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import type { Retailer } from "../../data/types";
import { onBuyClick } from "../buy";

/** Phones: a buy bar that appears after the hero and steps aside at the buy section and footer. */
export default function MobileBuyBar({ retailer, title }: { retailer?: Retailer; title: string }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const onScroll = () => {
      const near = ["buy"].map((id) => document.getElementById(id)).concat(document.querySelector("footer") as HTMLElement | null);
      const covered = near.some((el) => el && el.getBoundingClientRect().top < window.innerHeight && el.getBoundingClientRect().bottom > 0);
      setVisible(window.scrollY > window.innerHeight * 0.8 && !covered);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  if (!retailer) return null;
  return (
    <div className={`fixed inset-x-3 bottom-3 z-40 flex items-center justify-between gap-3 rounded-lg bg-ink-navy p-2 pl-4 text-white shadow-2xl backdrop-blur transition-all duration-500 md:hidden ${visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-[130%] opacity-0"}`}>
      <div className="min-w-0">
        <p className="truncate font-[family-name:var(--font-heading)] text-base leading-tight">{title}</p>
        <p className="text-xs text-white/60">
          {retailer.format}
          {retailer.price && ` · ${retailer.price}`}
        </p>
      </div>
      <a href={retailer.url} target="_blank" rel="noopener" onClick={() => onBuyClick(retailer)} className="btn-solid btn-gold !px-4 !py-2.5">
        Buy <ArrowUpRight className="h-4 w-4" />
      </a>
    </div>
  );
}
