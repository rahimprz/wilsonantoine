import { eventsStore } from "../data/stores";
import type { EventType } from "../data/types";
import { uid } from "./id";
import { hasDatabase, insertPublic } from "./supabase";

const MAX_EVENTS = 4000;

/**
 * Records a visitor interaction for the dashboard's engagement panel: in the database when one is
 * connected, otherwise in this browser — enough to see the funnel working.
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
  const event = { id: uid("ev_"), t: Date.now(), type, meta };
  // with a database every visitor's events reach the dashboard; without one they stay in this browser
  if (hasDatabase) return insertPublic("site_events", { ...event, meta: meta ?? null });
  eventsStore.set((prev) => {
    const next = [...prev, event];
    return next.length > MAX_EVENTS ? next.slice(next.length - MAX_EVENTS) : next;
  });
}
