import type { Persona } from '../data/personas';
import { aprForScore, decide, type Decision } from './policy';
import type { Financials, LoanTerms, Outcome, PersonaId } from './types';

// The outcome each persona is designed to demonstrate. Tests assert the policy engine produces it.
export const TARGET_OUTCOME: Record<PersonaId, Outcome> = {
  'happy-path': 'approved',
  'blurry-docs': 'approved',
  'watchlist-hit': 'refer-compliance',
  'borderline-credit': 'refer-underwriting',
  declined: 'declined',
  'counter-offer': 'counter-offer',
};

export function requestedTerms(p: Persona): LoanTerms {
  return { amount: p.form.loanAmount, aprPct: aprForScore(p.creditScore), termMonths: Number(p.form.loanTerm) };
}

export function financialsOf(p: Persona): Financials {
  const { annualIncome, monthlyRent, existingDebt, otherExpenses } = p.form;
  return { annualIncome, monthlyRent, existingDebt, otherExpenses };
}

export function latestDocQuality(p: Persona): number {
  const latest = new Map<string, number>();
  [...p.documents].sort((a, b) => a.minutesAfterStart - b.minutesAfterStart).forEach((d) => latest.set(d.doc, d.quality));
  return Math.min(...latest.values());
}

export function decideForPersona(p: Persona, overrides: { terms?: LoanTerms; financials?: Financials } = {}): Decision {
  return decide({
    financials: overrides.financials ?? financialsOf(p),
    terms: overrides.terms ?? requestedTerms(p),
    creditScore: p.creditScore,
    checks: p.checks,
    latestDocQuality: latestDocQuality(p),
  });
}
