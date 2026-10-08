import type { Persona } from '../data/personas';
import { fmtEur, fmtPct, fmtRate, fmtScore } from './format';
import { POLICY, scoreBand, type Decision } from './policy';
import type { AuditEvent, Check, Stage, Tone } from './types';

export const BIAN = {
  party: 'Party Reference Data Directory',
  documents: 'Document Directory',
  auth: 'Party Authentication',
  compliance: 'Regulatory Compliance',
  fraud: 'Fraud Detection',
  rating: 'Customer Credit Rating',
  loan: 'Consumer Loan',
  offer: 'Customer Offer',
} as const;

const CHECK_DOMAIN: Record<Check['id'], string> = {
  liveness: BIAN.auth,
  'identity-register': BIAN.auth,
  sanctions: BIAN.compliance,
  pep: BIAN.compliance,
  'adverse-media': BIAN.compliance,
  'device-fraud': BIAN.fraud,
};
const RESULT_WORD: Record<Check['result'], string> = { pass: 'PASS', review: 'REVIEW', fail: 'FAIL' };
const RESULT_TONE: Record<Check['result'], Tone> = { pass: 'good', review: 'warn', fail: 'bad' };

export function decisionText(p: Persona, d: Decision): string {
  const req = d.requested;
  const failing = d.rules.filter((r) => r.outcome && r.outcome !== 'approved').map((r) => r.text);
  switch (d.outcome) {
    case 'approved':
      return `Approved automatically: ${fmtEur(req.amount)} at ${fmtRate(req.aprPct)} APR over ${req.termMonths} months, ${fmtEur(d.affordability.payment, { cents: true })} a month.`;
    case 'counter-offer':
      return `Counter-offer: ${fmtEur(d.offer!.amount)} at ${fmtRate(d.offer!.aprPct)} APR over ${d.offer!.termMonths} months, ${fmtEur(d.offerAffordability!.payment, { cents: true })} a month. The requested ${fmtEur(req.amount)} failed on DTI only.`;
    case 'refer-compliance':
      return `Referred to compliance: ${d.rules.filter((r) => r.id === 'aml').map((r) => r.text).join('; ')}.`;
    case 'refer-underwriting':
      return `Referred to underwriting: ${failing.join('; ')}.`;
    case 'declined':
      return `Declined for ${p.form.firstName}: ${failing.join('; ')}.`;
  }
}

export function buildAudit(p: Persona, d: Decision): AuditEvent[] {
  const t0 = Date.parse(p.startedAt);
  const ev = (min: number, actor: AuditEvent['actor'], domain: string, stage: Stage, tone: Tone, text: string) => ({
    min,
    event: { at: new Date(t0 + min * 60_000).toISOString(), actor, domain, stage, tone, text } as AuditEvent,
  });

  const lastCheck = Math.max(...p.checks.map((c) => c.minutesAfterStart), ...p.documents.map((x) => x.minutesAfterStart));
  const a = d.affordability;
  const dti = a.dtiAfter;
  const dtiTone: Tone = dti === null || dti > POLICY.dtiMax ? 'bad' : dti > POLICY.dtiAuto ? 'warn' : 'good';
  const scoreTone: Tone = p.creditScore < POLICY.scoreMin ? 'bad' : p.creditScore < POLICY.scoreAuto ? 'warn' : 'good';
  const outcomeTone: Tone = d.outcome === 'approved' ? 'good' : d.outcome === 'declined' ? 'bad' : 'warn';

  const events = [
    ev(0, 'Applicant', BIAN.party, 'personal-details', 'info', `Application started; personal details captured for ${p.name}.`),
    ...p.documents.map((doc) => {
      const ok = doc.quality >= POLICY.docQualityMin;
      return ev(doc.minutesAfterStart, 'System', BIAN.documents, 'verification', ok ? 'good' : 'warn',
        ok ? `${doc.name}: quality ${fmtScore(doc.quality)}, accepted.`
          : `${doc.name}: quality ${fmtScore(doc.quality)} is below the 0.70 threshold; re-upload requested.`);
    }),
    ...p.checks.map((c) =>
      ev(c.minutesAfterStart, 'System', CHECK_DOMAIN[c.id], 'verification', RESULT_TONE[c.result], `${c.label}: ${RESULT_WORD[c.result]}. ${c.detail}`)),
    ev(lastCheck + 1, 'Applicant', BIAN.loan, 'product-selection', 'info',
      `Selected a personal loan of ${fmtEur(d.requested.amount)} over ${d.requested.termMonths} months (${p.purpose.toLowerCase()}).`),
    ev(lastCheck + 2, 'Applicant', BIAN.party, 'financial-details', 'info',
      `Declared gross income of ${fmtEur(a.grossMonthlyIncome)} a month and existing repayments of ${fmtEur(p.form.existingDebt)} a month.`),
    ev(lastCheck + 3, 'System', BIAN.rating, 'review-submit', scoreTone, `Credit score ${p.creditScore} (${scoreBand(p.creditScore)}) from ${p.bureau}.`),
    ev(lastCheck + 3, 'System', BIAN.loan, 'review-submit', dtiTone,
      dti === null ? 'Affordability: no verifiable income.' : `Affordability: DTI after the loan is ${fmtPct(dti)} (auto-approve ≤ 33%, maximum 45%).`),
    ev(Math.max(p.decisionMinutes, lastCheck + 4), 'System', d.outcome === 'counter-offer' ? BIAN.offer : BIAN.loan, 'decision', outcomeTone, decisionText(p, d)),
  ];
  // Stable sort by time keeps same-minute events in narrative order.
  return events
    .map((e, i) => ({ ...e, i }))
    .sort((x, y) => x.min - y.min || x.i - y.i)
    .map((e) => e.event);
}
