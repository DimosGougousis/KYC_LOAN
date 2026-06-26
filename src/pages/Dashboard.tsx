import { useState } from 'react';
import { storyScripts } from '../data/storyScripts';
import type { OutcomeColor } from '../data/storyScripts';
import FlowDiagram from '../components/dashboard/FlowDiagram';
import NarrativeCard from '../components/dashboard/NarrativeCard';
import ApplicationPassport from '../components/dashboard/ApplicationPassport';

const PERSONA_TAB_ACTIVE: Record<OutcomeColor, string> = {
  green: 'border-green-500 bg-green-50 text-green-800',
  red:   'border-red-500 bg-red-50 text-red-800',
  blue:  'border-blue-500 bg-blue-50 text-blue-800',
  amber: 'border-amber-500 bg-amber-50 text-amber-800',
};

export default function Dashboard() {
  const [personaId, setPersonaId] = useState(storyScripts[0].personaId);
  const [activeStepId, setActiveStepId] = useState<string | null>(storyScripts[0].steps[0].stepId);

  const persona = storyScripts.find((p) => p.personaId === personaId) ?? storyScripts[0];

  function handlePersonaChange(id: string) {
    const next = storyScripts.find((p) => p.personaId === id);
    if (!next) return;
    setPersonaId(id);
    setActiveStepId(next.steps[0].stepId);
  }

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Header */}
      <header className="bg-blue-700 px-6 py-4 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <p className="text-xs text-blue-200 uppercase tracking-wide font-medium">BIAN Onboarding</p>
            <h1 className="text-xl font-bold text-white mt-0.5">Workflow Story Dashboard</h1>
          </div>
          <a href="/" className="text-xs text-blue-200 hover:text-white transition-colors">Exit dashboard</a>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">

        {/* Persona selector */}
        <section>
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Select a scenario</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {storyScripts.map((p) => (
              <button
                key={p.personaId}
                type="button"
                onClick={() => handlePersonaChange(p.personaId)}
                className={`
                  text-left border-2 rounded-xl px-4 py-3 transition-all text-sm
                  ${personaId === p.personaId
                    ? PERSONA_TAB_ACTIVE[p.outcomeColor]
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  }
                `}
              >
                <p className="font-semibold">{p.personaLabel}</p>
                <p className="text-xs opacity-70 mt-0.5">{p.personaName}</p>
              </button>
            ))}
          </div>
        </section>

        {/* Flow diagram */}
        <section className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">Application flow</h2>
          <FlowDiagram
            persona={persona}
            activeStepId={activeStepId}
            onStepClick={setActiveStepId}
          />
        </section>

        {/* Application Passport */}
        <section>
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Application passport</h2>
          <ApplicationPassport
            passport={persona.passport}
            outcomeColor={persona.outcomeColor}
          />
        </section>

        {/* Narrative cards */}
        <section className="space-y-4">
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Step-by-step story</h2>
          {persona.steps.map((step, i) => (
            <NarrativeCard
              key={step.stepId}
              step={step}
              index={i}
              isActive={activeStepId === step.stepId}
              outcomeColor={persona.outcomeColor}
              onClick={() => setActiveStepId(step.stepId)}
            />
          ))}
        </section>

      </div>
    </div>
  );
}
