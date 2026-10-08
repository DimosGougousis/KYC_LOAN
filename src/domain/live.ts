import { OUTCOME_LABEL, OUTCOME_TONE, type CaseFile } from './caseFile';
import { fmtEur, fmtPct } from './format';
import { POLICY } from './policy';
import { STAGES, type AuditEvent, type CheckResult, type Stage, type Tone } from './types';

export interface LiveCheck { label: string; status: 'pending' | CheckResult }
export interface LiveSnapshot { events: AuditEvent[]; checks: LiveCheck[]; risk: { label: string; tone: Tone }; narrative: string }

// What the live sidebar can honestly show while the applicant is on a given wizard stage.
export function liveSnapshot(cf: CaseFile, stage: Stage): LiveSnapshot {
  const idx = STAGES.indexOf(stage);
  const visible = cf.audit.filter((e) => STAGES.indexOf(e.stage) <= idx);
  const events = [...visible].reverse().slice(0, 5);
  const revealed = idx >= STAGES.indexOf('verification');
  const p = cf.persona;
  const d = cf.decision;
  const a = d.affordability;
  const checks: LiveCheck[] = p.checks.map((c) => ({ label: c.label, status: revealed ? c.result : 'pending' }));

  let risk: LiveSnapshot['risk'] = { label: 'Not assessed yet', tone: 'info' };
  if (stage === 'decision') {
    risk = { label: OUTCOME_LABEL[d.outcome], tone: OUTCOME_TONE[d.outcome] };
  } else if (idx >= STAGES.indexOf('financial-details')) {
    const dti = a.dtiAfter;
    risk = dti === null
      ? { label: 'No verifiable income', tone: 'bad' }
      : { label: `DTI ${fmtPct(dti)}`, tone: dti > POLICY.dtiMax ? 'bad' : dti > POLICY.dtiAuto ? 'warn' : 'good' };
  } else if (revealed) {
    const worst = p.checks.find((c) => c.result === 'fail') ?? p.checks.find((c) => c.result === 'review');
    risk = worst
      ? { label: `${worst.label} ${worst.result === 'fail' ? 'failed' : 'needs review'}`, tone: worst.result === 'fail' ? 'bad' : 'warn' }
      : { label: 'KYC clear', tone: 'good' };
  }

  const narrative: Record<Stage, string> = {
    'personal-details': `Capturing identity details for ${p.name}. Nothing has been decided yet.`,
    verification: risk.tone === 'warn' || risk.tone === 'bad'
      ? `Screening found something a person must look at: ${risk.label.toLowerCase()}.`
      : 'Documents, liveness, register and watchlist checks run in parallel.',
    'product-selection': `${p.form.firstName} chooses ${fmtEur(cf.terms.amount)} over ${cf.terms.termMonths} months; indicative payment ${fmtEur(a.payment, { cents: true })}.`,
    'financial-details': `Gross income ${fmtEur(a.grossMonthlyIncome)} a month against ${fmtEur(p.form.existingDebt)} of existing repayments.`,
    'review-submit': `Credit score ${p.creditScore} and affordability go to the decision engine.`,
    decision: `Outcome: ${OUTCOME_LABEL[d.outcome].toLowerCase()}.`,
  };
  return { events, checks, risk, narrative: narrative[stage] };
}
