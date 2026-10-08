import { buildCaseFile, type CaseFile, type Kpi } from './caseFile';
import { fmtEur } from './format';
import { PERSONA_IDS } from './types';

export function allCases(): CaseFile[] {
  return PERSONA_IDS.map((id) => buildCaseFile(id)!);
}

export function portfolioKpis(cases: CaseFile[]): Kpi[] {
  const mins = cases.map((c) => c.persona.decisionMinutes).sort((a, b) => a - b);
  const mid = mins.length / 2;
  const median = mins.length % 2 ? mins[Math.floor(mid)] : (mins[mid - 1] + mins[mid]) / 2;
  const human = cases.filter((c) => c.needsReviewer).length;
  return [
    { label: 'Applications', value: String(cases.length), sub: 'synthetic personas' },
    { label: 'Decided automatically', value: String(cases.length - human), sub: 'approve, decline or counter-offer' },
    { label: 'Referred to a person', value: String(human), sub: 'compliance or underwriting', tone: 'warn' },
    { label: 'Median time to decision', value: `${median} min`, sub: 'from first click' },
    { label: 'Total requested', value: fmtEur(cases.reduce((s, c) => s + c.terms.amount, 0)), sub: 'across all cases' },
  ];
}
