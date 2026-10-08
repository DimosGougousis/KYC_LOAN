import { getPersona, type Persona } from '../data/personas';
import { buildAudit } from './audit';
import { fmtEur, fmtPct, fmtRate } from './format';
import { buildInsights, type Insight } from './insights';
import { decideForPersona, requestedTerms } from './persona';
import { POLICY, scoreBand, type Decision } from './policy';
import { buildQuestions } from './questions';
import type { AuditEvent, LoanTerms, Outcome, Tone } from './types';

export const OUTCOME_LABEL: Record<Outcome, string> = {
  approved: 'Approved',
  'refer-compliance': 'Referred to compliance',
  'refer-underwriting': 'Referred to underwriting',
  'counter-offer': 'Counter-offer',
  declined: 'Declined',
};

export const OUTCOME_TONE: Record<Outcome, Tone> = {
  approved: 'good',
  'refer-compliance': 'warn',
  'refer-underwriting': 'warn',
  'counter-offer': 'warn',
  declined: 'bad',
};

export interface Kpi { label: string; value: string; sub: string; tone?: Tone }

export interface CaseFile {
  persona: Persona;
  terms: LoanTerms;
  decision: Decision;
  insights: Insight[];
  questions: string[];
  kpis: Kpi[];
  audit: AuditEvent[];
  needsReviewer: boolean;
  submittedAt: string;
  decisionMinutes: number;
}

export function buildCaseFile(id: string | undefined): CaseFile | null {
  const persona = getPersona(id);
  if (!persona) return null;
  const terms = requestedTerms(persona);
  const decision = decideForPersona(persona);
  const audit = buildAudit(persona, decision);
  // Derived from the audit trail so the KPI and the timeline can never disagree.
  const decidedAt = audit.filter((e) => e.stage === 'decision').at(-1)!.at;
  const decisionMinutes = (Date.parse(decidedAt) - Date.parse(persona.startedAt)) / 60_000;
  const dti = decision.affordability.dtiAfter;
  const s = persona.creditScore;
  const needsReviewer = decision.outcome === 'refer-compliance' || decision.outcome === 'refer-underwriting';
  const kpis: Kpi[] = [
    { label: 'Requested', value: fmtEur(terms.amount), sub: `${terms.termMonths} months · ${persona.purpose}` },
    { label: 'Monthly payment', value: fmtEur(decision.affordability.payment, { cents: true }), sub: `${fmtRate(terms.aprPct)} APR` },
    {
      label: 'DTI after loan', value: dti === null ? 'n/a' : fmtPct(dti), sub: 'Auto-approve ≤ 33%',
      tone: dti === null || dti > POLICY.dtiMax ? 'bad' : dti > POLICY.dtiAuto ? 'warn' : 'good',
    },
    { label: 'Credit score', value: String(s), sub: scoreBand(s), tone: s < POLICY.scoreMin ? 'bad' : s < POLICY.scoreAuto ? 'warn' : 'good' },
    { label: 'Time to decision', value: `${decisionMinutes} min`, sub: needsReviewer ? 'to referral' : 'fully automated' },
  ];
  const submitted = audit.find((e) => e.stage === 'review-submit') ?? audit[audit.length - 1];
  return {
    persona, terms, decision, audit, needsReviewer, kpis,
    insights: buildInsights(persona, decision),
    questions: buildQuestions(persona, decision),
    submittedAt: submitted.at,
    decisionMinutes,
  };
}
