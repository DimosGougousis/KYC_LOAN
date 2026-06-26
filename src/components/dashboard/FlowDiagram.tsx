import type { PersonaScript } from '../../data/storyScripts';

interface FlowDiagramProps {
  persona: PersonaScript;
  activeStepId: string | null;
  onStepClick: (stepId: string) => void;
}

const OUTCOME_ACTIVE: Record<string, string> = {
  green:  'bg-green-600 border-green-600 text-white',
  red:    'bg-red-600 border-red-600 text-white',
  blue:   'bg-blue-600 border-blue-600 text-white',
  amber:  'bg-amber-500 border-amber-500 text-white',
};

const OUTCOME_RING: Record<string, string> = {
  green:  'ring-2 ring-green-300',
  red:    'ring-2 ring-red-300',
  blue:   'ring-2 ring-blue-300',
  amber:  'ring-2 ring-amber-300',
};

const EXCEPTION_BADGE: Record<string, string> = {
  amber: 'bg-amber-100 text-amber-700 border-amber-200',
  red:   'bg-red-100 text-red-700 border-red-200',
};

export default function FlowDiagram({ persona, activeStepId, onStepClick }: FlowDiagramProps) {
  const color = persona.outcomeColor;

  return (
    <div className="overflow-x-auto">
      <div className="flex items-start gap-0 min-w-max pb-2">
        {persona.steps.map((step, i) => (
          <div key={step.stepId} className="flex items-start">
            {/* Node */}
            <div className="flex flex-col items-center gap-1.5">
              <button
                type="button"
                onClick={() => onStepClick(step.stepId)}
                className={`
                  px-3 py-2 rounded-lg border-2 text-xs font-semibold whitespace-nowrap transition-all
                  ${activeStepId === step.stepId
                    ? `${OUTCOME_ACTIVE[color]} ${OUTCOME_RING[color]}`
                    : 'bg-white border-slate-300 text-slate-600 hover:border-slate-400 hover:text-slate-800'
                  }
                `}
              >
                <span className="mr-1 text-[10px] opacity-60">{i + 1}</span>
                {step.stepLabel}
              </button>
              {step.exception && (
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border whitespace-nowrap ${EXCEPTION_BADGE[step.exceptionColor ?? 'amber']}`}>
                  {step.exception}
                </span>
              )}
            </div>

            {/* Arrow connector (not after last item) */}
            {i < persona.steps.length - 1 && (
              <div className="flex items-center mt-2.5 mx-1 text-slate-300 text-sm select-none">
                →
              </div>
            )}
          </div>
        ))}

        {/* Outcome badge */}
        <div className="flex items-center mt-2.5 mx-1 text-slate-300 text-sm select-none">→</div>
        <div className={`
          self-start mt-0.5 px-3 py-2 rounded-lg border-2 text-xs font-semibold whitespace-nowrap
          ${OUTCOME_ACTIVE[color]}
        `}>
          {persona.outcomeLabel}
        </div>
      </div>
    </div>
  );
}
