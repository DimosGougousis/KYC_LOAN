export function NumberField({ id, label, value, onChange, suffix, error }: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  suffix?: string;
  error?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm text-ink">
        {label}{suffix && <span className="text-muted">, {suffix}</span>}
      </label>
      <input
        id={id}
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`num rounded-md border bg-surface px-3 py-2 text-sm focus:ring-2 focus:outline-none ${error ? 'border-bad focus:ring-bad/30' : 'border-line focus:ring-accent/30'}`}
      />
      {error && <p id={`${id}-error`} role="alert" className="text-xs text-bad">{error}</p>}
    </div>
  );
}
