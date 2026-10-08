import { describe, expect, it } from 'vitest';
import { aprForScore, decide, evaluatePolicy, scoreBand, type PolicyInput } from './policy';
import type { Check } from './types';

const clean: Check[] = [
  { id: 'sanctions', label: 'Sanctions', result: 'pass', score: 0, provider: 'x', minutesAfterStart: 1, detail: '' },
  { id: 'pep', label: 'PEP', result: 'pass', score: 0.1, provider: 'x', minutesAfterStart: 1, detail: '' },
];
const base: PolicyInput = { grossMonthlyIncome: 4000, dtiAfter: 0.2, creditScore: 700, checks: clean, latestDocQuality: 0.9 };
const outcome = (p: Partial<PolicyInput>) => evaluatePolicy({ ...base, ...p }).outcome;

describe('evaluatePolicy thresholds', () => {
  it('DTI boundaries', () => {
    expect(outcome({ dtiAfter: 0.33 })).toBe('approved');
    expect(outcome({ dtiAfter: 0.3301 })).toBe('refer-underwriting');
    expect(outcome({ dtiAfter: 0.45 })).toBe('refer-underwriting');
    expect(outcome({ dtiAfter: 0.4501 })).toBe('declined');
  });
  it('score boundaries', () => {
    expect(outcome({ creditScore: 640 })).toBe('approved');
    expect(outcome({ creditScore: 639 })).toBe('refer-underwriting');
    expect(outcome({ creditScore: 580 })).toBe('refer-underwriting');
    expect(outcome({ creditScore: 579 })).toBe('declined');
  });
  it('document quality boundary requests re-upload without changing the outcome', () => {
    expect(evaluatePolicy({ ...base, latestDocQuality: 0.7 }).needsReupload).toBe(false);
    const r = evaluatePolicy({ ...base, latestDocQuality: 0.69 });
    expect(r.needsReupload).toBe(true);
    expect(r.outcome).toBe('approved');
  });
  it('no income declines', () => {
    const r = evaluatePolicy({ ...base, grossMonthlyIncome: 0, dtiAfter: null });
    expect(r.outcome).toBe('declined');
    expect(r.rules.find((x) => x.id === 'income')?.text).toBe('No verifiable income');
  });
  it('AML matches refer to compliance; sanctions hits decline', () => {
    const pep = clean.map((c) => (c.id === 'pep' ? { ...c, result: 'review' as const } : c));
    expect(outcome({ checks: pep })).toBe('refer-compliance');
    const sanc = clean.map((c) => (c.id === 'sanctions' ? { ...c, result: 'fail' as const } : c));
    expect(outcome({ checks: sanc })).toBe('declined');
  });
  it('applies precedence declined > compliance > underwriting', () => {
    const pep = clean.map((c) => (c.id === 'pep' ? { ...c, result: 'review' as const } : c));
    expect(outcome({ checks: pep, dtiAfter: 0.4 })).toBe('refer-compliance');
    expect(outcome({ checks: pep, creditScore: 500 })).toBe('declined');
  });
});

describe('aprForScore and scoreBand', () => {
  it('bands APR by score', () => {
    expect(aprForScore(742)).toBe(6.9);
    expect(aprForScore(720)).toBe(6.9);
    expect(aprForScore(719)).toBe(7.9);
    expect(aprForScore(680)).toBe(7.9);
    expect(aprForScore(679)).toBe(8.9);
    expect(aprForScore(400)).toBe(8.9);
  });
  it('names score bands', () => {
    expect([742, 700, 650, 600, 540].map(scoreBand)).toEqual(['Very good', 'Good', 'Fair', 'Weak', 'Poor']);
  });
});

describe('decide (counter-offer search)', () => {
  const lisa = { annualIncome: 21600, monthlyRent: 350, existingDebt: 200, otherExpenses: 200 };
  const lisaInput = { financials: lisa, terms: { amount: 15000, aprPct: 8.9, termMonths: 24 }, creditScore: 660, checks: clean, latestDocQuality: 0.9 };
  it('offers the largest amount that auto-approves on a DTI-only decline', () => {
    const d = decide(lisaInput);
    expect(d.outcome).toBe('counter-offer');
    expect(d.offer).toEqual({ amount: 8000, aprPct: 8.9, termMonths: 24 });
    expect(d.offerAffordability?.dtiAfter).toBeLessThanOrEqual(0.33);
  });
  it('does not counter-offer when another rule also declines', () => {
    expect(decide({ ...lisaInput, creditScore: 500 }).outcome).toBe('declined');
  });
  it('does not counter-offer in the DTI refer band', () => {
    const d = decide({ ...lisaInput, financials: { ...lisa, annualIncome: 30000, existingDebt: 500 }, terms: { amount: 15000, aprPct: 8.9, termMonths: 36 } });
    expect(d.outcome).toBe('refer-underwriting');
    expect(d.offer).toBeNull();
  });
  it('stays declined when even €5,000 does not fit', () => {
    const d = decide({ ...lisaInput, financials: { ...lisa, existingDebt: 900 } });
    expect(d.outcome).toBe('declined');
    expect(d.offer).toBeNull();
  });
  it('returns the requested terms as the offer when approved', () => {
    const d = decide({ ...lisaInput, terms: { amount: 8000, aprPct: 8.9, termMonths: 24 } });
    expect(d.outcome).toBe('approved');
    expect(d.offer).toEqual({ amount: 8000, aprPct: 8.9, termMonths: 24 });
  });
});
