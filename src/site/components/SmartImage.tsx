import { useState, type ImgHTMLAttributes, type ReactNode } from "react";
import { resolveMedia } from "../../lib/media";

interface SmartImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> {
  src: string;
  /** Rendered instead when the image is missing or fails to load. */
  fallback?: ReactNode;
}

/** Image that fades in once decoded and swaps to a fallback if the file can't be reached. */
export default function SmartImage({ src, fallback = null, className = "", onLoad, ...rest }: SmartImageProps) {
  const url = resolveMedia(src);
  const [state, setState] = useState<{ url: string; status: "loading" | "ready" | "error" }>({ url, status: "loading" });
  const status = state.url === url ? state.status : "loading";

  if (!url || status === "error") return <>{fallback}</>;
  return (
    <img
      {...rest}
      src={url}
      className={`${className} transition-opacity duration-700 ${status === "ready" ? "opacity-100" : "opacity-0"}`}
      onLoad={(e) => {
        setState({ url, status: "ready" });
        onLoad?.(e);
      }}
      onError={() => setState({ url, status: "error" })}
    />
  );
}
