import { track } from "../lib/analytics";
import type { Retailer } from "../data/types";

export function primaryRetailer(retailers: Retailer[]): Retailer | undefined {
  return retailers.find((r) => r.primary && r.url) ?? retailers.find((r) => r.url);
}

/** Every "buy" link goes through here so the dashboard can count click-throughs per retailer. */
export function onBuyClick(retailer: Retailer | undefined) {
  if (retailer) track("buy_click", `${retailer.label} · ${retailer.format}`);
}
