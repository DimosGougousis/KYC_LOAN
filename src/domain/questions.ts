import type { Persona } from '../data/personas';
import { fmtEur, fmtPct, fmtScore } from './format';
import { monthlyPayment } from './loan';
import { POLICY, type Decision } from './policy';

export function buildQuestions(p: Persona, d: Decision): string[] {
  const q: string[] = [];
  const first = p.form.firstName;

  const pep = p.checks.find((c) => c.id === 'pep');
  if (pep && pep.result !== 'pass') {
    q.push(`Is ${p.name} the person in the PEP match (similarity ${fmtScore(pep.score)})? Obtain role, dates in office and source of wealth.`);
  }
  const media = p.checks.find((c) => c.id === 'adverse-media');
  if (media && media.result !== 'pass') q.push('Does the adverse-media hit change the customer risk rating?');
  if (p.checks.some((c) => c.id === 'sanctions' && c.result === 'fail')) q.push('Escalate the sanctions match to the MLRO before any further contact.');

  const reuploaded = p.documents.find((x) => x.quality < POLICY.docQualityMin);
  if (reuploaded) q.push(`Compare the re-uploaded ${reuploaded.name.toLowerCase()} with the first capture: same document, no edits?`);

  const dti = d.affordability.dtiAfter;
  const r = d.requested;
  if (dti !== null && dti > POLICY.dtiAuto && dti <= POLICY.dtiMax) {
    q.push(`DTI after the loan is ${fmtPct(dti)} against a 33% auto-approve limit. Do ${p.yearsEmployed} years with ${p.employer} offset the margin?`);
    const longer = (p.form.existingDebt + monthlyPayment(r.amount, r.aprPct, 60)) / d.affordability.grossMonthlyIncome;
    q.push(`Would 60 months (DTI ${fmtPct(longer)}) suit ${first} better than ${r.termMonths}?`);
  }
  if (p.creditScore >= POLICY.scoreMin && p.creditScore < POLICY.scoreAuto) {
    q.push(`What drives the ${p.creditScore} score? Pull the full bureau file.`);
  }
  if (d.outcome === 'declined') {
    const reasons = d.rules.filter((x) => x.outcome === 'declined').map((x) => x.text.toLowerCase());
    q.push(`Has ${first} been told which factors to improve (${reasons.join('; ')}) and when they can reapply?`);
  }
  if (d.outcome === 'counter-offer') {
    q.push(`Does ${first} still need the full ${fmtEur(r.amount)}? What would the remaining ${fmtEur(r.amount - d.offer!.amount)} have funded?`);
  }
  if (d.outcome === 'approved') q.push('Has the applicant received the pre-contract credit information (SECCI) before signing?');
  q.push(`Has ${first} confirmed the loan purpose (${p.purpose.toLowerCase()}) and that the income figures are current?`);
  return q;
}
