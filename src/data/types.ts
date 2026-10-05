// ---------------------------------------------------------------- website content

export interface Retailer {
  id: string;
  label: string; // "Amazon"
  format: string; // "Kindle eBook"
  url: string;
  price: string; // free text so "$9.99" or "From $14" both work; empty hides it
  primary: boolean;
}

export interface Theme {
  id: string;
  title: string;
  text: string;
  icon: ThemeIcon;
}

export type ThemeIcon = "infinity" | "moon" | "compass" | "stethoscope" | "feather" | "sunrise" | "heart" | "eye" | "sparkles";

export interface Chapter {
  id: string;
  title: string;
  summary: string;
}

export interface Review {
  id: string;
  name: string;
  quote: string;
  rating: number; // 1..5
}

export interface Highlight {
  id: string;
  value: string;
  label: string;
}

export interface FaqItem {
  id: string;
  q: string;
  a: string;
}

export interface Pillar {
  id: string;
  title: string;
  text: string;
}

export type SectionKey =
  | "announcement"
  | "book"
  | "marquee"
  | "explores"
  | "author"
  | "chapters"
  | "manifesto"
  | "impact"
  | "reviews"
  | "buy"
  | "faq";

export interface SiteContent {
  seo: { title: string; description: string };
  brand: { name: string; logo: string };
  announcement: { text: string; linkLabel: string; link: string };
  hero: {
    eyebrow: string;
    title: string;
    subtitle: string;
    primaryCta: string;
    secondaryCta: string;
    booksImage: string;
    backgroundImage: string;
    backgroundVideo: string;
  };
  book: { eyebrow: string; heading: string; body: string; bullets: string[]; image: string; ctaLabel: string; cover: string };
  marquee: { items: string[] };
  explores: { eyebrow: string; heading: string; intro: string; image: string; backgroundImage: string; themes: Theme[] };
  author: { eyebrow: string; name: string; credentials: string; bio: string; image: string; highlights: Highlight[] };
  chapters: { eyebrow: string; heading: string; image: string; items: Chapter[] };
  manifesto: { eyebrow: string; quote: string; video: string };
  impact: { eyebrow: string; heading: string; body: string; image: string; pillars: Pillar[] };
  reviews: { eyebrow: string; heading: string; items: Review[] };
  buy: { eyebrow: string; heading: string; body: string; video: string; retailers: Retailer[] };
  excerpt: { title: string; body: string };
  faq: { eyebrow: string; heading: string; items: FaqItem[] };
  footer: {
    tagline: string;
    newsletterHeading: string;
    newsletterText: string;
    email: string;
    socials: { facebook: string; instagram: string; linkedin: string; youtube: string; x: string };
    copyright: string;
  };
  sections: Record<SectionKey, boolean>;
}

// ---------------------------------------------------------------- sales & CRM

export interface Sale {
  id: string;
  date: string; // YYYY-MM-DD
  channel: string;
  format: string;
  quantity: number;
  unitPrice: number;
  /** Earnings after the retailer's cut. Filled from the format's royalty rate, editable per sale. */
  net: number;
  repId: string; // "" when unassigned
  customer: string;
  notes: string;
  demo?: boolean;
  createdAt: number;
}

export type LeadStage = "prospect" | "contacted" | "negotiating" | "won" | "lost";

export interface Lead {
  id: string;
  org: string;
  contact: string;
  email: string;
  phone: string;
  type: string;
  stage: LeadStage;
  units: number;
  value: number;
  repId: string;
  followUp: string; // YYYY-MM-DD or ""
  notes: string;
  demo?: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface Rep {
  id: string;
  name: string;
  email: string;
  phone: string;
  region: string;
  commission: number; // percent of gross
  monthlyTarget: number; // units
  active: boolean;
  demo?: boolean;
  createdAt: number;
}

export interface Subscriber {
  id: string;
  email: string;
  name: string;
  source: "website" | "excerpt" | "manual" | "import";
  date: string; // ISO timestamp
  demo?: boolean;
}

export type EventType = "visit" | "pageview" | "buy_click" | "excerpt_open" | "chapter_open" | "subscribe";

export interface SiteEvent {
  t: number;
  type: EventType;
  meta?: string;
  demo?: boolean;
}

export interface Settings {
  ownerName: string;
  currency: string;
  monthlyUnitTarget: number;
  monthlyRevenueTarget: number;
  royaltyRates: Record<string, number>; // format -> percent of gross kept as net
  passHash: string;
  passSalt: string;
}
