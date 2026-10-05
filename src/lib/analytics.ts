import { eventsStore } from "../data/stores";
import type { EventType } from "../data/types";

const MAX_EVENTS = 4000;

/**
 * Records a visitor interaction for the dashboard's engagement panel.
 * Until a backend is connected these stay in this browser — enough to see the funnel working.
 */
export function track(type: EventType, meta?: string) {
  if (typeof window === "undefined" || window.location.pathname.startsWith("/admin")) return;
  try {
    if (type === "visit") {
      if (sessionStorage.getItem("wa.visit")) return; // one visit per browsing session
      sessionStorage.setItem("wa.visit", "1");
    }
  } catch {
    /* private mode: count it anyway */
  }
  eventsStore.set((prev) => {
    const next = [...prev, { t: Date.now(), type, meta }];
    return next.length > MAX_EVENTS ? next.slice(next.length - MAX_EVENTS) : next;
  });
}
