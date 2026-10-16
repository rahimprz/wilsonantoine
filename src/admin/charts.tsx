import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Chart kit for the dashboard. Built to one spec so every chart reads as part of the same system:
 * hairline grid, 2px lines, ~10% area wash, bars ≤ 24px with 4px rounded data-ends, text in text
 * tokens (never the series colour), a legend whenever there are two series, and a hover layer.
 * Series colours were validated for the #0e1430 card surface (lightness band, chroma, CVD, contrast).
 */
export const VIZ = {
  surface: "#0e1430",
  grid: "#1c2448",
  axis: "#2a3460",
  ink: "#eef1ff",
  ink2: "#aab3d8",
  muted: "#6f7aa8",
  gold: "#b8862b",
  blue: "#3f86ee",
  // third slot for part-to-whole splits (distributor · printing · profit). Validated with blue and
  // gold on #0e1430; the aqua↔gold pair sits in the CVD warn band, so SplitBar always direct-labels
  // its segments and keeps 2px gaps between them.
  aqua: "#199e70",
};

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setWidth(Math.floor(e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, width] as const;
}

/** Rounds an axis maximum up to a clean step so ticks read 0 / 500 / 1,000. */
function niceScale(max: number, ticks = 4) {
  if (max <= 0) return { max: ticks, step: 1 };
  const raw = max / ticks;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const norm = raw / mag;
  const step = (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 2.5 ? 2.5 : norm <= 5 ? 5 : 10) * mag;
  return { max: step * ticks, step };
}

// ---------------------------------------------------------------- trend (line / area)

export interface TrendSeries {
  key: string;
  label: string;
  color: string;
  values: number[];
  area?: boolean;
}

interface TrendChartProps {
  labels: string[];
  series: TrendSeries[];
  format: (v: number) => string;
  formatAxis?: (v: number) => string;
  height?: number;
  extra?: (index: number) => ReactNode; // more rows in the tooltip
}

export function TrendChart({ labels, series, format, formatAxis = format, height = 260, extra }: TrendChartProps) {
  const [wrap, width] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const pad = { top: 12, right: 16, bottom: 28, left: 56 };
  const innerW = Math.max(0, width - pad.left - pad.right);
  const innerH = height - pad.top - pad.bottom;
  const n = labels.length;
  const peak = Math.max(0, ...series.flatMap((s) => s.values));
  const { max, step } = niceScale(peak);
  const x = (i: number) => pad.left + (n <= 1 ? innerW / 2 : (i / (n - 1)) * innerW);
  const y = (v: number) => pad.top + innerH - (v / max) * innerH;

  const paths = series.map((s) => {
    const line = s.values.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join("");
    return { ...s, line, areaPath: `${line}L${x(n - 1).toFixed(1)},${y(0)}L${x(0).toFixed(1)},${y(0)}Z` };
  });

  const ticks = Array.from({ length: Math.round(max / step) + 1 }, (_, i) => i * step);
  const labelEvery = Math.max(1, Math.ceil(n / Math.max(2, Math.floor(innerW / 90))));

  const onMove = (clientX: number) => {
    const rect = wrap.current!.getBoundingClientRect();
    const px = clientX - rect.left - pad.left;
    const i = Math.round((px / Math.max(1, innerW)) * (n - 1));
    setHover(Math.max(0, Math.min(n - 1, i)));
  };

  return (
    <div>
      {series.length > 1 && (
        <ul className="mb-3 flex flex-wrap gap-4 text-xs text-mist" aria-label="Legend">
          {series.map((s) => (
            <li key={s.key} className="flex items-center gap-2">
              <span className="h-[3px] w-4 rounded-full" style={{ background: s.color }} />
              {s.label}
            </li>
          ))}
        </ul>
      )}
      <div
        ref={wrap}
        className="relative select-none"
        style={{ height }}
        onPointerMove={(e) => onMove(e.clientX)}
        onPointerLeave={() => setHover(null)}
        role="img"
        aria-label={`${series.map((s) => s.label).join(" and ")} over time`}
      >
        {width > 0 && n > 0 && (
          <svg width={width} height={height} className="block overflow-visible">
            {ticks.map((t) => (
              <g key={t}>
                <line x1={pad.left} x2={width - pad.right} y1={y(t)} y2={y(t)} stroke={t === 0 ? VIZ.axis : VIZ.grid} strokeWidth={1} />
                <text x={pad.left - 10} y={y(t)} dy="0.35em" textAnchor="end" fontSize={11} fill={VIZ.muted} className="tabular-nums">
                  {formatAxis(t)}
                </text>
              </g>
            ))}
            {labels.map((l, i) =>
              i % labelEvery === 0 || i === n - 1 ? (
                i === n - 1 && i % labelEvery !== 0 && (n - 1) % labelEvery < labelEvery / 2 ? null : (
                  <text key={i} x={x(i)} y={height - 8} textAnchor={i === 0 ? "start" : i === n - 1 ? "end" : "middle"} fontSize={11} fill={VIZ.muted}>
                    {l}
                  </text>
                )
              ) : null,
            )}
            {paths.map((p) => p.area && <path key={`${p.key}-a`} d={p.areaPath} fill={p.color} opacity={0.1} />)}
            {paths.map((p) => (
              <path key={p.key} d={p.line} fill="none" stroke={p.color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
            ))}
            {hover != null && (
              <g>
                <line x1={x(hover)} x2={x(hover)} y1={pad.top} y2={pad.top + innerH} stroke={VIZ.ink2} strokeOpacity={0.35} strokeWidth={1} />
                {series.map((s) => (
                  <circle key={s.key} cx={x(hover)} cy={y(s.values[hover])} r={4.5} fill={s.color} stroke={VIZ.surface} strokeWidth={2} />
                ))}
              </g>
            )}
          </svg>
        )}
        {hover != null && width > 0 && (
          <div
            className="pointer-events-none absolute top-2 z-10 min-w-[170px] rounded-xl border border-white/10 bg-[#141b3d]/95 px-3.5 py-3 text-xs shadow-2xl backdrop-blur"
            style={{ left: x(hover) > width / 2 ? x(hover) - 186 : x(hover) + 14 }}
          >
            <p className="mb-2 font-semibold text-star">{labels[hover]}</p>
            {series.map((s) => (
              <p key={s.key} className="flex items-center justify-between gap-4 py-0.5 text-mist">
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
                  {s.label}
                </span>
                <span className="font-medium text-star tabular-nums">{format(s.values[hover])}</span>
              </p>
            ))}
            {extra?.(hover)}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- horizontal bars

export interface BarItem {
  key: string;
  label: ReactNode;
  value: number;
  display: string;
  detail?: ReactNode;
}

/** Ranked horizontal bars, one hue (magnitude is the message, not identity). */
export function BarList({ items, color = VIZ.gold, empty = "No data in this period." }: { items: BarItem[]; color?: string; empty?: string }) {
  const [hover, setHover] = useState<string | null>(null);
  const max = Math.max(0, ...items.map((i) => i.value));
  if (!items.length || max === 0) return <p className="py-8 text-center text-sm text-haze">{empty}</p>;
  return (
    <ul className="space-y-3.5">
      {items.map((it) => (
        <li
          key={it.key}
          className="relative"
          onPointerEnter={() => setHover(it.key)}
          onPointerLeave={() => setHover(null)}
          tabIndex={0}
          onFocus={() => setHover(it.key)}
          onBlur={() => setHover(null)}
        >
          <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
            <span className="truncate text-mist">{it.label}</span>
            <span className="font-medium text-star tabular-nums">{it.display}</span>
          </div>
          <div className="h-2.5 w-full rounded-[4px] bg-white/[0.04]">
            <div
              className="h-full rounded-r-[4px] transition-[width,opacity] duration-700"
              style={{ width: `${Math.max(1.5, (it.value / max) * 100)}%`, background: color, opacity: hover && hover !== it.key ? 0.45 : 1 }}
            />
          </div>
          {hover === it.key && it.detail && (
            <div className="pointer-events-none absolute right-0 bottom-full z-10 mb-2 rounded-lg border border-white/10 bg-[#141b3d] px-3 py-2 text-xs text-mist shadow-xl">{it.detail}</div>
          )}
        </li>
      ))}
    </ul>
  );
}

// ---------------------------------------------------------------- sparkline & progress

export function Sparkline({ values, color = VIZ.gold, height = 34 }: { values: number[]; color?: string; height?: number }) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const max = Math.max(1e-9, ...values);
  const n = values.length;
  const pts = values.map((v, i) => [n <= 1 ? width / 2 : (i / (n - 1)) * (width - 6) + 3, height - 4 - (v / max) * (height - 8)] as const);
  const d = pts.map(([px, py], i) => `${i ? "L" : "M"}${px.toFixed(1)},${py.toFixed(1)}`).join("");
  const last = pts[pts.length - 1];
  return (
    <div ref={ref} style={{ height }} aria-hidden>
      {width > 0 && n > 1 && (
        <svg width={width} height={height} className="block overflow-visible">
          <path d={`${d}L${last[0]},${height}L${pts[0][0]},${height}Z`} fill={color} opacity={0.1} />
          <path d={d} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
          <circle cx={last[0]} cy={last[1]} r={4} fill={color} stroke={VIZ.surface} strokeWidth={2} />
        </svg>
      )}
    </div>
  );
}

export function Progress({ value, color = VIZ.gold, label }: { value: number; color?: string; label?: string }) {
  const pct = Math.max(0, Math.min(1, value));
  return (
    <div role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(value * 100)} aria-label={label}>
      <div className="h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
        <div className="h-full rounded-full transition-[width] duration-1000" style={{ width: `${pct * 100}%`, background: color }} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- part-to-whole split

export interface SplitSegment {
  key: string;
  label: string;
  value: number;
  color: string;
}

/**
 * One bar cut into its parts (where a sale's money goes). Segments sit 2px apart with rounded outer
 * ends; each wide-enough segment carries its value, and the legend below names every part with
 * its value and share, so identity never rests on colour alone.
 */
export function SplitBar({ segments, format, height = 26, label }: { segments: SplitSegment[]; format: (v: number) => string; height?: number; label: string }) {
  const [hover, setHover] = useState<string | null>(null);
  const parts = segments.filter((s) => s.value > 0);
  const total = parts.reduce((a, s) => a + s.value, 0);
  if (total <= 0) return <p className="py-6 text-center text-sm text-haze">Nothing to split yet.</p>;
  const share = (v: number) => `${Math.round((v / total) * 100)}%`;
  return (
    <div>
      <div className="relative flex w-full gap-[2px]" style={{ height }} role="img" aria-label={`${label}: ${parts.map((s) => `${s.label} ${format(s.value)}`).join(", ")}`}>
        {parts.map((s, i) => {
          const w = s.value / total;
          return (
            <div
              key={s.key}
              className="relative flex min-w-[3px] items-center justify-center transition-opacity duration-300"
              style={{
                flexGrow: w,
                flexBasis: 0,
                background: s.color,
                borderRadius: parts.length === 1 ? 4 : i === 0 ? "4px 0 0 4px" : i === parts.length - 1 ? "0 4px 4px 0" : 0,
                opacity: hover && hover !== s.key ? 0.45 : 1,
              }}
              onPointerEnter={() => setHover(s.key)}
              onPointerLeave={() => setHover(null)}
            >
              {w >= 0.12 && <span className="px-1 text-[0.72rem] font-semibold text-white tabular-nums [text-shadow:0_1px_2px_rgba(0,0,0,0.35)]">{format(s.value)}</span>}
              {hover === s.key && (
                <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 rounded-lg border border-white/10 bg-[#141b3d] px-3 py-2 text-xs whitespace-nowrap text-mist shadow-xl">
                  <span className="font-medium text-star">{s.label}</span> · {format(s.value)} · {share(s.value)}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <ul className="mt-3.5 flex flex-wrap gap-x-5 gap-y-2 text-sm">
        {parts.map((s) => (
          <li key={s.key} className="flex items-center gap-2" onPointerEnter={() => setHover(s.key)} onPointerLeave={() => setHover(null)}>
            <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: s.color }} aria-hidden />
            <span className="text-mist">{s.label}</span>
            <span className="font-medium text-star tabular-nums">{format(s.value)}</span>
            <span className="text-haze tabular-nums">{share(s.value)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
