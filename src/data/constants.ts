import type { LeadStage } from "./types";

export const FORMATS = ["Kindle eBook", "Paperback", "Hardcover", "Audiobook"] as const;

export const CHANNELS = [
  "Amazon",
  "Barnes & Noble",
  "Apple Books",
  "Kobo",
  "Website (direct)",
  "Event / signing",
  "Bulk / institutional",
  "Other",
] as const;

export const LEAD_TYPES = [
  "Bookstore",
  "Library",
  "Church / faith group",
  "Hospice / hospital",
  "Speaking event",
  "Podcast / media",
  "Book club",
  "Corporate / bulk",
  "Other",
] as const;

export const STAGES: { id: LeadStage; label: string; probability: number }[] = [
  { id: "prospect", label: "Prospect", probability: 0.1 },
  { id: "contacted", label: "Contacted", probability: 0.25 },
  { id: "negotiating", label: "Negotiating", probability: 0.6 },
  { id: "won", label: "Won", probability: 1 },
  { id: "lost", label: "Lost", probability: 0 },
];

export const STAGE_LABEL: Record<LeadStage, string> = Object.fromEntries(STAGES.map((s) => [s.id, s.label])) as Record<
  LeadStage,
  string
>;

/** Starting royalty assumptions (percent of list price kept). Editable in Settings. */
export const DEFAULT_ROYALTY: Record<string, number> = {
  "Kindle eBook": 70,
  Paperback: 40,
  Hardcover: 35,
  Audiobook: 40,
};

export const CURRENCIES = ["USD", "CAD", "GBP", "EUR", "AUD", "HTG", "XOF", "NGN", "INR", "PKR"];
