import { useEffect, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import type { Retailer } from "../../data/types";
import { onBuyClick } from "../buy";

/** Small-screen purchase bar that slides up after the hero and steps aside near the buy section. */
export default function MobileBuyBar({ retailer, title }: { retailer?: Retailer; title: string }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const buy = document.getElementById("buy");
      const nearBuy = buy ? buy.getBoundingClientRect().top < window.innerHeight && buy.getBoundingClientRect().bottom > 0 : false;
      const footer = document.querySelector("footer");
      const nearFooter = footer ? footer.getBoundingClientRect().top < window.innerHeight : false;
      setVisible(window.scrollY > window.innerHeight * 0.85 && !nearBuy && !nearFooter);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!retailer) return null;
  return (
    <div
      className={`fixed inset-x-3 bottom-3 z-40 flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-void/85 p-2 pl-4 shadow-2xl backdrop-blur-xl transition-all duration-500 md:hidden ${
        visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-[130%] opacity-0"
      }`}
    >
      <div className="min-w-0">
        <p className="truncate font-display text-[0.72rem] font-semibold tracking-wide text-white">{title}</p>
        <p className="text-xs text-mist">
          {retailer.format}
          {retailer.price && ` · ${retailer.price}`}
        </p>
      </div>
      <a href={retailer.url} target="_blank" rel="noopener" onClick={() => onBuyClick(retailer)} className="btn btn-gold shrink-0 !px-4 !py-2.5 !text-[0.72rem]">
        Buy <ArrowUpRight className="h-4 w-4" />
      </a>
    </div>
  );
}
