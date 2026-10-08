import { assessAffordability, type Affordability } from './affordability';
import { fmtPct } from './format';
import { POLICY } from './policyConfig';
import type { Check, Financials, LoanTerms, Outcome } from './types';

export { POLICY };

export function aprForScore(score: number): number {
  return POLICY.rates.find((r) => score >= r.minScore)!.aprPct;
}

export type ScoreBand = 'Very good' | 'Good' | 'Fair' | 'Weak' | 'Poor';

export function scoreBand(score: number): ScoreBand {
  if (score >= 720) return 'Very good';
  if (score >= 680) return 'Good';
  if (score >= POLICY.scoreAuto) return 'Fair';
  if (score >= POLICY.scoreMin) return 'Weak';
  return 'Poor';
}

export type RuleId = 'income' | 'dti' | 'score' | 'sanctions' | 'aml' | 'documents';
export interface FiredRule { id: RuleId; outcome: Outcome | null; text: string }
export interface PolicyInput { grossMonthlyIncome: number; dtiAfter: number | null; creditScore: number; checks: Check[]; latestDocQuality: number }
export interface PolicyResult { outcome: Exclude<Outcome, 'counter-offer'>; rules: FiredRule[]; needsReupload: boolean }

const PRECEDENCE: Exclude<Outcome, 'counter-offer'>[] = ['declined', 'refer-compliance', 'refer-underwriting', 'approved'];

export function evaluatePolicy(input: PolicyInput): PolicyResult {
  const rules: FiredRule[] = [];
  const { dtiAfter, creditScore } = input;

  if (input.grossMonthlyIncome <= 0 || dtiAfter === null) {
    rules.push({ id: 'income', outcome: 'declined', text: 'No verifiable income' });
  } else if (dtiAfter > POLICY.dtiMax) {
    rules.push({ id: 'dti', outcome: 'declined', text: `DTI after the loan is ${fmtPct(dtiAfter)}, above the 45% maximum` });
  } else if (dtiAfter > POLICY.dtiAuto) {
    rules.push({ id: 'dti', outcome: 'refer-underwriting', text: `DTI after the loan is ${fmtPct(dtiAfter)}, between the 33% auto-approve limit and the 45% maximum` });
  } else {
    rules.push({ id: 'dti', outcome: 'approved', text: `DTI after the loan is ${fmtPct(dtiAfter)}, within the 33% auto-approve limit` });
  }

  if (creditScore < POLICY.scoreMin) {
    rules.push({ id: 'score', outcome: 'declined', text: `Credit score ${creditScore} is below the 580 minimum` });
  } else if (creditScore < POLICY.scoreAuto) {
    rules.push({ id: 'score', outcome: 'refer-underwriting', text: `Credit score ${creditScore} is in the 580–639 refer band` });
  } else {
    rules.push({ id: 'score', outcome: 'approved', text: `Credit score ${creditScore} meets the 640 auto-approve level` });
  }

  for (const c of input.checks) {
    if (c.id === 'sanctions' && c.result === 'fail') {
      rules.push({ id: 'sanctions', outcome: 'declined', text: 'Confirmed sanctions match' });
    }
    if ((c.id === 'pep' || c.id === 'adverse-media') && c.result !== 'pass') {
      rules.push({ id: 'aml', outcome: 'refer-compliance', text: `${c.label} match needs manual review` });
    }
  }

  const needsReupload = input.latestDocQuality < POLICY.docQualityMin;
  if (needsReupload) {
    rules.push({ id: 'documents', outcome: null, text: 'Document quality is below 0.70; re-upload requested' });
  }

  const outcome = PRECEDENCE.find((o) => rules.some((r) => r.outcome === o)) ?? 'approved';
  return { outcome, rules, needsReupload };
}

export interface DecideInput { financials: Financials; terms: LoanTerms; creditScore: number; checks: Check[]; latestDocQuality: number }
export interface Decision {
  outcome: Outcome;
  rules: FiredRule[];
  needsReupload: boolean;
  affordability: Affordability;
  requested: LoanTerms;
  offer: LoanTerms | null;
  offerAffordability: Affordability | null;
}

function evaluate(input: DecideInput, terms: LoanTerms) {
  const affordability = assessAffordability(input.financials, terms);
  const policy = evaluatePolicy({
    grossMonthlyIncome: affordability.grossMonthlyIncome,
    dtiAfter: affordability.dtiAfter,
    creditScore: input.creditScore,
    checks: input.checks,
    latestDocQuality: input.latestDocQuality,
  });
  return { affordability, policy };
}

export function decide(input: DecideInput): Decision {
  const { affordability, policy } = evaluate(input, input.terms);
  const base = { rules: policy.rules, needsReupload: policy.needsReupload, affordability, requested: input.terms };

  if (policy.outcome === 'approved') {
    return { ...base, outcome: 'approved', offer: input.terms, offerAffordability: affordability };
  }

  // Counter-offer only when DTI alone pushed the application into decline.
  const failing = policy.rules.filter((r) => r.outcome && r.outcome !== 'approved');
  const dtiOnlyDecline = policy.outcome === 'declined' && failing.length === 1 && failing[0].id === 'dti';
  if (dtiOnlyDecline) {
    for (let amount = input.terms.amount - POLICY.counterOfferStep; amount >= POLICY.counterOfferMin; amount -= POLICY.counterOfferStep) {
      const terms = { ...input.terms, amount };
      const attempt = evaluate(input, terms);
      if (attempt.policy.outcome === 'approved') {
        return { ...base, outcome: 'counter-offer', offer: terms, offerAffordability: attempt.affordability };
      }
    }
  }
  return { ...base, outcome: policy.outcome, offer: null, offerAffordability: null };
}
