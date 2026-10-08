/** A slow ribbon of the book's themes in gold italic, between hairlines. Pauses on hover. */
export default function Ticker({ items }: { items: string[] }) {
  if (!items.length) return null;
  const row = [...items, ...items];
  return (
    <div className="marquee-pause relative overflow-hidden border-y border-gold/25 bg-[#0a1015] py-5" aria-label="Themes of the book">
      <div className="marquee-track flex w-max items-center" style={{ ["--marquee-duration" as string]: `${row.length * 5}s` }}>
        {[...row, ...row].map((t, i) => (
          <span key={i} className="flex items-center gap-7 pr-7">
            <span className="font-[family-name:var(--font-heading)] text-[1.6rem] whitespace-nowrap text-gold-light italic md:text-[2rem]">{t}</span>
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0 text-gold" aria-hidden>
              <path fill="currentColor" d="M12 0c.6 6.2 5.8 11.4 12 12-6.2.6-11.4 5.8-12 12-.6-6.2-5.8-11.4-12-12C6.2 11.4 11.4 6.2 12 0z" />
            </svg>
          </span>
        ))}
      </div>
      <div className="pointer-events-none absolute inset-y-0 left-0 w-28 bg-gradient-to-r from-[#0a1015] to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-28 bg-gradient-to-l from-[#0a1015] to-transparent" />
    </div>
  );
}
