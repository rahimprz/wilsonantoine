/** A small gold divider — hairline, star, hairline — set above section headings. */
export default function Ornament({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-3 text-gold ${className}`} aria-hidden>
      <span className="h-px w-10 bg-gradient-to-r from-transparent to-current" />
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5">
        <path fill="currentColor" d="M12 0c.6 6.2 5.8 11.4 12 12-6.2.6-11.4 5.8-12 12-.6-6.2-5.8-11.4-12-12C6.2 11.4 11.4 6.2 12 0z" />
      </svg>
      <span className="h-px w-10 bg-gradient-to-l from-transparent to-current" />
    </span>
  );
}
