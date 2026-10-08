export interface LineSeries { id: string; label: string; color: string; values: number[]; dashed?: boolean }

const W = 640;
const PAD = { l: 64, r: 12, t: 12, b: 28 };

export function LineChart({ series, xLabels, ariaLabel, format, height = 240 }: {
  series: LineSeries[];
  xLabels: { index: number; label: string }[];
  ariaLabel: string;
  format: (n: number) => string;
  height?: number;
}) {
  const all = series.flatMap((s) => s.values);
  const lo = Math.min(0, ...all);
  let hi = Math.max(0, ...all);
  if (hi === lo) hi = lo + 1;
  const n = Math.max(1, ...series.map((s) => s.values.length - 1));
  const x = (i: number) => PAD.l + (i / n) * (W - PAD.l - PAD.r);
  const y = (v: number) => PAD.t + (1 - (v - lo) / (hi - lo)) * (height - PAD.t - PAD.b);
  const ticks = [0, 1, 2, 3, 4].map((k) => lo + ((hi - lo) * k) / 4);

  return (
    <figure>
      <svg role="img" aria-label={ariaLabel} viewBox={`0 0 ${W} ${height}`} className="h-auto w-full">
        {ticks.map((t) => (
          <g key={t}>
            <line x1={PAD.l} x2={W - PAD.r} y1={y(t)} y2={y(t)} stroke="var(--color-line)" strokeWidth={1} />
            <text x={PAD.l - 8} y={y(t) + 4} textAnchor="end" fontSize={11} fill="var(--color-muted)" fontFamily="var(--font-mono)">{format(t)}</text>
          </g>
        ))}
        {lo < 0 && <line x1={PAD.l} x2={W - PAD.r} y1={y(0)} y2={y(0)} stroke="var(--color-ink)" strokeWidth={1} />}
        {xLabels.map((l) => (
          <text key={l.index} x={x(l.index)} y={height - 8} textAnchor="middle" fontSize={11} fill="var(--color-muted)" fontFamily="var(--font-mono)">{l.label}</text>
        ))}
        {series.map((s) => (
          <path
            key={s.id}
            data-series={s.id}
            fill="none"
            stroke={s.color}
            strokeWidth={2}
            strokeDasharray={s.dashed ? '5 4' : undefined}
            d={s.values.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ')}
          />
        ))}
      </svg>
      <figcaption className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm">
        {series.map((s) => (
          <span key={s.id} className="flex items-center gap-2">
            <span className="inline-block h-0.5 w-5" style={{ background: s.color }} aria-hidden />
            {s.label}
          </span>
        ))}
      </figcaption>
    </figure>
  );
}
