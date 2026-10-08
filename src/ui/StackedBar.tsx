export interface BarSegment { label: string; value: number; color: string }

export function StackedBar({ segments, ariaLabel, format }: { segments: BarSegment[]; ariaLabel: string; format: (n: number) => string }) {
  const shown = segments.filter((s) => s.value > 0);
  const total = shown.reduce((s, x) => s + x.value, 0) || 1;
  return (
    <div>
      <div role="img" aria-label={ariaLabel} className="flex h-6 w-full overflow-hidden rounded-sm">
        {shown.map((s) => (
          <div key={s.label} data-segment style={{ width: `${(s.value / total) * 100}%`, background: s.color }} title={`${s.label}: ${format(s.value)}`} />
        ))}
      </div>
      <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm">
        {segments.map((s) => (
          <li key={s.label} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: s.color }} aria-hidden />
            <span>{s.label}</span>
            <span className="num text-muted">{format(s.value)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
