import {
  Compass,
  Eye,
  Feather,
  Heart,
  Infinity as InfinityIcon,
  Moon,
  Sparkles,
  Stethoscope,
  Sunrise,
  type LucideIcon,
} from "lucide-react";
import type { ThemeIcon } from "../../data/types";

export const THEME_ICONS: Record<ThemeIcon, LucideIcon> = {
  infinity: InfinityIcon,
  moon: Moon,
  compass: Compass,
  stethoscope: Stethoscope,
  feather: Feather,
  sunrise: Sunrise,
  heart: Heart,
  eye: Eye,
  sparkles: Sparkles,
};

type SocialKey = "facebook" | "instagram" | "linkedin" | "youtube" | "x";

const PATHS: Record<SocialKey, string> = {
  facebook: "M14 8.5V6.6c0-.8.2-1.3 1.4-1.3H17V2.2C16.7 2.1 15.7 2 14.6 2 12.2 2 10.6 3.4 10.6 6.1v2.4H8v3.4h2.6V22H14v-10.1h2.7l.4-3.4H14z",
  instagram:
    "M12 7.2a4.8 4.8 0 1 0 0 9.6 4.8 4.8 0 0 0 0-9.6zm0 7.9a3.1 3.1 0 1 1 0-6.2 3.1 3.1 0 0 1 0 6.2zM17 5.8a1.1 1.1 0 1 0 0 2.2 1.1 1.1 0 0 0 0-2.2zM21.9 7.9c-.1-1.6-.4-3-1.6-4.2S17.7 2.2 16.1 2.1C14.5 2 9.5 2 7.9 2.1c-1.6.1-3 .4-4.2 1.6S2.2 6.3 2.1 7.9C2 9.5 2 14.5 2.1 16.1c.1 1.6.4 3 1.6 4.2s2.6 1.5 4.2 1.6c1.6.1 6.6.1 8.2 0 1.6-.1 3-.4 4.2-1.6s1.5-2.6 1.6-4.2c.1-1.6.1-6.6 0-8.2zM19.8 18a3.3 3.3 0 0 1-1.8 1.8c-1.3.5-4.3.4-5.9.4s-4.6.1-5.9-.4A3.3 3.3 0 0 1 4.4 18c-.5-1.3-.4-4.3-.4-5.9s-.1-4.6.4-5.9A3.3 3.3 0 0 1 6.2 4.4C7.5 3.9 10.5 4 12.1 4s4.6-.1 5.9.4A3.3 3.3 0 0 1 19.8 6.2c.5 1.3.4 4.3.4 5.9s.1 4.6-.4 5.9z",
  linkedin:
    "M6.9 21H3.2V8.9h3.7V21zM5 7.3a2.1 2.1 0 1 1 0-4.3 2.1 2.1 0 0 1 0 4.3zM21 21h-3.7v-5.9c0-1.4 0-3.2-2-3.2s-2.2 1.5-2.2 3.1v6H9.4V8.9h3.5v1.6h.1c.5-.9 1.7-2 3.5-2 3.8 0 4.5 2.5 4.5 5.7V21z",
  youtube:
    "M22.5 7.2a2.8 2.8 0 0 0-2-2C18.8 4.8 12 4.8 12 4.8s-6.8 0-8.5.4a2.8 2.8 0 0 0-2 2C1.1 8.9 1.1 12 1.1 12s0 3.1.4 4.8a2.8 2.8 0 0 0 2 2c1.7.4 8.5.4 8.5.4s6.8 0 8.5-.4a2.8 2.8 0 0 0 2-2c.4-1.7.4-4.8.4-4.8s0-3.1-.4-4.8zM9.8 15.1V8.9l5.7 3.1-5.7 3.1z",
  x: "M17.8 3h3.1l-6.8 7.7L22 21h-6.2l-4.9-6.4L5.3 21H2.2l7.2-8.3L1.8 3h6.4l4.4 5.8L17.8 3zm-1.1 16.2h1.7L7.2 4.7H5.4l11.3 14.5z",
};

export const SOCIAL_LABELS: Record<SocialKey, string> = {
  facebook: "Facebook",
  instagram: "Instagram",
  linkedin: "LinkedIn",
  youtube: "YouTube",
  x: "X (Twitter)",
};

export function SocialIcon({ name, className = "h-4 w-4" }: { name: SocialKey; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d={PATHS[name]} />
    </svg>
  );
}

export type { SocialKey };
