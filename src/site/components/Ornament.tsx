import { Feather } from "lucide-react";

/** Gold divider — hairline, quill, hairline. The lines draw in when the parent section reveals. */
export default function Ornament({ center = false, className = "" }: { center?: boolean; className?: string }) {
  return (
    <span data-ornament className={`flex items-center gap-3 text-gold ${center ? "justify-center" : ""} ${className}`} aria-hidden>
      <span data-orn-line className={`h-px w-14 bg-gradient-to-r from-transparent to-gold ${center ? "origin-right" : "origin-left"}`} />
      <Feather className="h-4 w-4" strokeWidth={1.5} />
      <span data-orn-line className="h-px w-14 origin-left bg-gradient-to-l from-transparent to-gold" />
    </span>
  );
}
