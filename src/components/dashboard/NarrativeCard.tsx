import type { StepScript, OutcomeColor } from '../../data/storyScripts';

interface NarrativeCardProps {
  step: StepScript;
  index: number;
  isActive: boolean;
  outcomeColor: OutcomeColor;
  onClick: () => void;
}

const MOMENT_ROWS: { key: keyof import('../../data/storyScripts').Moment; label: string; icon: string }[] = [
  { key: 'context',  label: 'Context',        icon: '📋' },
  { key: 'trigger',  label: 'Trigger',         icon: '⚡' },
  { key: 'decision', label: 'Decision Point',  icon: '🔀' },
  { key: 'action',   label: 'Action',          icon: '▶' },
  { key: 'outcome',  label: 'Outcome',         icon: '✓' },
];

const ACTIVE_BORDER: Record<OutcomeColor, string> = {
  green: 'border-l-4 border-l-green-500',
  red:   'border-l-4 border-l-red-500',
  blue:  'border-l-4 border-l-blue-500',
  amber: 'border-l-4 border-l-amber-500',
};

const ACTIVE_LABEL: Record<OutcomeColor, string> = {
  green: 'text-green-700 bg-green-50',
  red:   'text-red-700 bg-red-50',
  blue:  'text-blue-700 bg-blue-50',
  amber: 'text-amber-700 bg-amber-50',
};

const EXCEPTION_BADGE: Record<string, string> = {
  amber: 'bg-amber-100 text-amber-700 border border-amber-200',
  red:   'bg-red-100 text-red-700 border border-red-200',
};

export default function NarrativeCard({ step, index, isActive, outcomeColor, onClick }: NarrativeCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        w-full text-left bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden
        transition-all hover:shadow-md
        ${isActive ? ACTIVE_BORDER[outcomeColor] : 'border-l-4 border-l-slate-200'}
      `}
    >
      {/* Card header */}
      <div className={`px-5 py-3 flex items-center justify-between ${isActive ? ACTIVE_LABEL[outcomeColor] : 'bg-slate-50'}`}>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center
            ${isActive ? 'bg-white text-slate-700' : 'bg-slate-200 text-slate-600'}`}
          >
            {index + 1}
          </span>
          <span className="font-semibold text-sm">{step.stepLabel}</span>
          {step.exception && (
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${EXCEPTION_BADGE[step.exceptionColor ?? 'amber']}`}>
              {step.exception}
            </span>
          )}
        </div>
        <span className="text-xs opacity-40">{isActive ? 'selected' : 'click to focus'}</span>
      </div>

      {/* Moment rows — always visible */}
      <div className="px-5 py-4 divide-y divide-slate-100">
        {MOMENT_ROWS.map(({ key, label, icon }) => (
          <div key={key} className="py-2.5 flex gap-3 text-sm">
            <span className="shrink-0 w-28 flex items-start gap-1.5 text-slate-500 font-medium text-xs pt-0.5">
              <span>{icon}</span>
              {label}
            </span>
            <span className="text-slate-700 leading-relaxed">{step.moment[key]}</span>
          </div>
        ))}
      </div>
    </button>
  );
}
