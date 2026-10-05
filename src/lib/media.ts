/**
 * Where "media:<file>" image references point.
 *
 * Defaults to the uploads folder of the current WordPress site. Before WordPress is switched off,
 * run `npm run fetch-media` (copies the files into public/media) and set VITE_MEDIA_BASE=/media.
 */
export const MEDIA_BASE: string =
  (import.meta.env.VITE_MEDIA_BASE as string | undefined) || "https://wilsonantoine.com/wp-content/uploads/2026/01";

export function resolveMedia(src: string | undefined | null): string {
  if (!src) return "";
  if (src.startsWith("media:")) return `${MEDIA_BASE.replace(/\/$/, "")}/${src.slice(6)}`;
  return src;
}

export interface VideoSource {
  src: string;
  type: string;
}

/** Sources for a background video. Our own rendered loops ship a WebM twin and a poster next to the MP4. */
export function videoSources(url: string): { sources: VideoSource[]; poster?: string } {
  if (!url) return { sources: [] };
  const local = url.startsWith("/videos/") && url.endsWith(".mp4");
  if (local) {
    const base = url.slice(0, -4);
    return {
      sources: [
        { src: `${base}.webm`, type: "video/webm" },
        { src: url, type: "video/mp4" },
      ],
      poster: `${base}.webp`,
    };
  }
  const ext = url.split("?")[0].split(".").pop()?.toLowerCase();
  const type = ext === "webm" ? "video/webm" : ext === "mov" ? "video/quicktime" : "video/mp4";
  return { sources: [{ src: url, type }] };
}
