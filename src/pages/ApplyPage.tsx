import { useEffect, useMemo, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { LiveCaseSidebar } from '../components/apply/LiveCaseSidebar';
import Decision from '../components/Decision';
import FinancialDetails from '../components/FinancialDetails';
import PersonalDetails from '../components/PersonalDetails';
import ProductSelection from '../components/ProductSelection';
import ReviewSubmit from '../components/ReviewSubmit';
import Verification from '../components/Verification';
import { buildCaseFile } from '../domain/caseFile';
import { STAGES, type Stage } from '../domain/types';
import { apiUrl } from '../lib/api';
import { useDemo } from '../lib/demo';
import { Eyebrow } from '../ui/primitives';

const STAGE_LABEL: Record<Stage, string> = {
  'personal-details': 'Personal details',
  verification: 'Verification',
  'product-selection': 'Product selection',
  'financial-details': 'Financial details',
  'review-submit': 'Review & submit',
  decision: 'Decision',
};

interface WFState { stage: string; sub: string }
const INITIAL: WFState = { stage: 'personal-details', sub: 'editing' };

export default function ApplyPage() {
  const { workflowId } = useParams();
  const location = useLocation();
  const { personaId } = useDemo();
  const cf = useMemo(() => buildCaseFile(personaId)!, [personaId]);
  const [wfId, setWfId] = useState<string | null>(null);
  const [state, setState] = useState<WFState>(INITIAL);

  // "new" (or a restart from the TopBar, which changes location.key) creates a fresh workflow.
  useEffect(() => {
    setState(INITIAL);
    if (workflowId && workflowId !== 'new') {
      setWfId(workflowId);
      return;
    }
    setWfId(null);
    let cancelled = false;
    fetch(apiUrl('/workflow'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idempotencyKey: crypto.randomUUID() }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        setWfId(d.workflowId);
        setState(d.state);
      });
    return () => { cancelled = true; };
  }, [workflowId, location.key]);

  const stage: Stage = (STAGES as readonly string[]).includes(state.stage) ? (state.stage as Stage) : 'personal-details';
  const idx = STAGES.indexOf(stage);

  return (
    <main className="mx-auto grid max-w-[1180px] gap-8 px-4 pb-16 md:px-8 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="min-w-0">
        <header className="pt-8 pb-5">
          <Eyebrow>Step {idx + 1} of 6 · {STAGE_LABEL[stage]}</Eyebrow>
          <h1 className="mt-2 font-display text-[32px] leading-tight font-semibold">{STAGE_LABEL[stage]}</h1>
          <div className="mt-4 h-[3px] w-full bg-line" aria-hidden>
            <div className="h-full bg-accent transition-all" style={{ width: `${((idx + 1) / STAGES.length) * 100}%` }} />
          </div>
          <ol className="mt-2 hidden justify-between gap-3 font-mono text-[11px] text-muted xl:flex">
            {STAGES.map((s, i) => <li key={s} className={i <= idx ? 'text-accent' : ''}>{STAGE_LABEL[s]}</li>)}
          </ol>
        </header>
        {wfId ? (
          <div key={`${wfId}-${personaId}`}>
            {stage === 'personal-details' && <PersonalDetails workflowId={wfId} onStateChange={setState} />}
            {stage === 'verification' && <Verification workflowId={wfId} onStateChange={setState} />}
            {stage === 'product-selection' && <ProductSelection workflowId={wfId} onStateChange={setState} />}
            {stage === 'financial-details' && <FinancialDetails workflowId={wfId} onStateChange={setState} />}
            {stage === 'review-submit' && <ReviewSubmit workflowId={wfId} onStateChange={setState} />}
            {stage === 'decision' && <Decision workflowId={wfId} onStateChange={setState} />}
          </div>
        ) : (
          <p className="py-16 text-center text-muted">Starting application…</p>
        )}
      </div>
      <LiveCaseSidebar cf={cf} stage={stage} sub={state.sub} />
    </main>
  );
}
