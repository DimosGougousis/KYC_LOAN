import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import ProgressBar from '../components/ProgressBar';
import PersonalDetails from '../components/PersonalDetails';
import Verification from '../components/Verification';
import ProductSelection from '../components/ProductSelection';
import FinancialDetails from '../components/FinancialDetails';
import ReviewSubmit from '../components/ReviewSubmit';
import Decision from '../components/Decision';

const steps = [
  'personal-details',
  'verification',
  'product-selection',
  'financial-details',
  'review-submit',
  'decision',
] as const;

const stepLabels: Record<string, string> = {
  'personal-details': 'Personal Details',
  'verification': 'Verification',
  'product-selection': 'Product Selection',
  'financial-details': 'Financial Details',
  'review-submit': 'Review & Submit',
  'decision': 'Decision',
};

interface WFState {
  stage: string;
  sub: string;
}

export default function WorkflowPage() {
  const { workflowId } = useParams<{ workflowId: string }>();
  const [wfId, setWfId] = useState<string | null>(workflowId === 'new' ? null : workflowId ?? null);
  const [state, setState] = useState<WFState>({ stage: 'personal-details', sub: 'editing' });

  useEffect(() => {
    if (wfId) return;
    fetch('/workflow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idempotencyKey: crypto.randomUUID() }),
    })
      .then((r) => r.json())
      .then((d) => {
        setWfId(d.workflowId);
        setState(d.state);
      });
  }, [wfId]);

  if (!wfId) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>;

  const currentIdx = steps.indexOf(state.stage as typeof steps[number]);
  const props = { workflowId: wfId, state, onStateChange: setState };

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Private Client Onboarding</p>
            <h1 className="text-lg font-bold text-slate-800">{stepLabels[state.stage]}</h1>
          </div>
          <a href="/" className="text-xs text-slate-500 hover:text-slate-700">Exit demo</a>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="mb-8 bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <ProgressBar steps={steps.map((s) => stepLabels[s])} currentIndex={currentIdx} completedUpTo={currentIdx} />
        </div>

        <main>
          {state.stage === 'personal-details' && <PersonalDetails {...props} />}
          {state.stage === 'verification' && <Verification {...props} />}
          {state.stage === 'product-selection' && <ProductSelection {...props} />}
          {state.stage === 'financial-details' && <FinancialDetails {...props} />}
          {state.stage === 'review-submit' && <ReviewSubmit {...props} />}
          {state.stage === 'decision' && <Decision {...props} />}
        </main>
      </div>
    </div>
  );
}
