/** A slow ribbon of the book's themes, gold on navy. Pauses on hover. */
export default function ThemeTicker({ items }: { items: string[] }) {
  if (!items.length) return null;
  const row = [...items, ...items, ...items];
  return (
    <div className="marquee-pause relative overflow-hidden border-y border-gold/25 bg-navy py-4 text-gold-light" aria-label="Themes of the book">
      <div className="marquee-track flex w-max items-center" style={{ ["--marquee-duration" as string]: `${row.length * 4}s` }}>
        {[...row, ...row].map((t, i) => (
          <span key={i} className="flex items-center gap-6 pr-6">
            <span className="title text-[1.5rem] whitespace-nowrap italic md:text-[1.8rem]">{t}</span>
            <svg viewBox="0 0 24 24" className="h-3 w-3 shrink-0 text-gold" aria-hidden>
              <path fill="currentColor" d="M12 0c.6 6.2 5.8 11.4 12 12-6.2.6-11.4 5.8-12 12-.6-6.2-5.8-11.4-12-12C6.2 11.4 11.4 6.2 12 0z" />
            </svg>
          </span>
        ))}
      </div>
      <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-navy to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-navy to-transparent" />
    </div>
  );
}
