import { useEffect, useRef, useState } from "react";
import { videoSources } from "../../lib/media";
import { prefersReducedMotion } from "../../lib/gsap";

interface BgVideoProps {
  src: string;
  className?: string;
  /** Plays at this rate; our rendered loops are calm by design, so 1 is usually right. */
  rate?: number;
}

/**
 * Muted, looping, inline background video. It only plays while on screen (saves battery and keeps
 * scrolling smooth), and shows its poster frame alone under reduced motion or Save-Data.
 */
export default function BgVideo({ src, className = "", rate = 1 }: BgVideoProps) {
  const ref = useRef<HTMLVideoElement>(null);
  const { sources, poster } = videoSources(src);
  const [ready, setReady] = useState(false);
  const saveData = typeof navigator !== "undefined" && (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
  const still = prefersReducedMotion() || !!saveData;

  useEffect(() => {
    const video = ref.current;
    if (!video || still) return;
    video.playbackRate = rate;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) video.play().catch(() => {});
        else video.pause();
      },
      { rootMargin: "200px" },
    );
    io.observe(video);
    return () => io.disconnect();
  }, [src, still, rate]);

  if (!sources.length) return null;
  if (still) {
    return poster ? <img src={poster} alt="" aria-hidden className={`${className} object-cover`} /> : null;
  }
  return (
    <video
      ref={ref}
      key={src}
      className={`${className} object-cover transition-opacity duration-[1.5s] ${ready ? "opacity-100" : "opacity-0"}`}
      poster={poster}
      muted
      loop
      playsInline
      autoPlay
      preload="auto"
      aria-hidden
      onCanPlay={() => setReady(true)}
      disablePictureInPicture
    >
      {sources.map((s) => (
        <source key={s.src} src={s.src} type={s.type} />
      ))}
    </video>
  );
}
