import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { applyPersonaDefaults } from '../data/personaDefaults';

const personas: Record<string, { name: string; label: string; description: string }> = {
  'happy-path': { name: 'Maria Santos', label: 'Happy Path', description: 'Clean approval — all docs pass, excellent credit, instant €15k at 6.9%' },
  'blurry-docs': { name: 'James Chen', label: 'Document Resubmit', description: 'Low-quality ID scan prompts re-upload; approves after clean re-upload' },
  'watchlist-hit': { name: 'Alex Petrov', label: 'Compliance HITL', description: 'PEP watchlist hit — manual compliance review required before proceeding' },
  'borderline-credit': { name: 'Sarah Miller', label: 'Underwriter HITL', description: 'Borderline DTI — sent to manual underwriter who approves with conditions' },
  'declined': { name: 'Tom Baker', label: 'Respectful Decline', description: 'Credit score below threshold — declined with 3 reasons + download letter' },
  'counter-offer': { name: 'Lisa Wang', label: 'Counter-Offer', description: 'Requested €15k; approved for €8k at 8.9% / 24 mo — can accept or decline' },
};

export default function Home() {
  const [persona, setPersona] = useState('happy-path');
  const [role, setRole] = useState('applicant');
  const navigate = useNavigate();

  function start() {
    applyPersonaDefaults(persona);
    localStorage.setItem('demoRole', role);
    if (role === 'compliance-officer') {
      navigate('/hitl/compliance/rev-alex-001');
    } else if (role === 'underwriter') {
      navigate('/hitl/underwriting/rev-sarah-001');
    } else {
      navigate('/workflow/new');
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-2xl overflow-hidden">
        <div className="bg-blue-700 px-8 py-6">
          <h1 className="text-white text-2xl font-bold">BIAN Onboarding — Demo</h1>
          <p className="text-blue-200 text-sm mt-1">Select a persona to explore a specific journey</p>
        </div>

        <div className="p-8 space-y-8">
          <fieldset>
            <legend className="text-sm font-semibold text-slate-700 mb-3">Demo persona</legend>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(personas).map(([key, p]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => { setPersona(key); setRole('applicant'); }}
                  className={`text-left border-2 rounded-xl p-4 transition-all ${
                    persona === key && role === 'applicant'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-200 hover:border-blue-300'
                  }`}
                >
                  <p className="font-semibold text-sm text-slate-800">{p.label}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{p.name}</p>
                  <p className="text-xs text-slate-400 mt-1">{p.description}</p>
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="text-sm font-semibold text-slate-700 mb-3">View as role (HITL)</legend>
            <div className="flex gap-3">
              {['compliance-officer', 'underwriter'].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`flex-1 border-2 rounded-xl p-3 text-sm font-medium transition-all ${
                    role === r
                      ? 'border-amber-500 bg-amber-50 text-amber-800'
                      : 'border-slate-200 text-slate-600 hover:border-amber-300'
                  }`}
                >
                  {r === 'compliance-officer' ? '🔍 Compliance Officer' : '📊 Underwriter'}
                </button>
              ))}
            </div>
          </fieldset>

          <button
            type="button"
            onClick={start}
            className="w-full bg-blue-600 text-white font-semibold py-3.5 rounded-xl hover:bg-blue-700 transition-colors text-base"
          >
            Start demo
          </button>
        </div>
      </div>
    </div>
  );
}
