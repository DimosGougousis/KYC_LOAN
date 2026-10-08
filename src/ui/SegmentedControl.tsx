export function SegmentedControl<T extends string>({ options, value, onChange, label }: {
  options: { id: T; label: string }[];
  value: T;
  onChange: (id: T) => void;
  label: string;
}) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          aria-pressed={value === o.id}
          onClick={() => onChange(o.id)}
          className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${value === o.id
            ? 'border-accent bg-accent-soft font-medium text-accent'
            : 'border-line text-ink hover:border-accent/50'}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
