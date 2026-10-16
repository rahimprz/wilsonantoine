import type { LeadStage } from "./types";

export const FORMATS = ["Kindle eBook", "Paperback", "Hardcover", "Audiobook"] as const;

export const CHANNELS = [
  "Distributor",
  "Amazon",
  "Barnes & Noble",
  "Apple Books",
  "Kobo",
  "Website (direct)",
  "Event / signing",
  "Bulk / institutional",
  "Complimentary copy",
  "Other",
] as const;

/** Channels where Dr. Antoine sells himself, so no distributor takes a share. */
export const DIRECT_CHANNELS = ["Website (direct)", "Event / signing", "Bulk / institutional", "Complimentary copy"];

/** Copies given away (review copies, gifts): they leave stock and cost printing, but bring no revenue. */
export const GIVEAWAY_CHANNEL = "Complimentary copy";

export const PAYOUT_METHODS = ["Bank transfer", "Check", "Zelle", "PayPal", "Cash", "Other"];

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

/**
 * Percent of the sale price received after the retailer's share, for formats sold outside the
 * printing deal (eBooks, audio). Printed copies use the distributor share set on the Profit page.
 */
export const DEFAULT_ROYALTY: Record<string, number> = {
  "Kindle eBook": 70,
  Paperback: 60,
  Hardcover: 60,
  Audiobook: 40,
};

export const CURRENCIES = ["USD", "CAD", "GBP", "EUR", "AUD", "HTG", "XOF", "NGN", "INR", "PKR"];
