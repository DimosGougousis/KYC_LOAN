import { describe, expect, it } from 'vitest';
import { assessAffordability } from './affordability';

const maria = { annualIncome: 52000, monthlyRent: 1200, existingDebt: 200, otherExpenses: 400 };

describe('assessAffordability', () => {
  it('computes gross/net income, DTI before/after and residual', () => {
    const a = assessAffordability(maria, { amount: 15000, aprPct: 6.9, termMonths: 36 });
    expect(a.grossMonthlyIncome).toBeCloseTo(4333.33, 2);
    expect(a.netMonthlyIncome).toBeCloseTo(3120, 2);
    expect(a.payment).toBe(462.47);
    expect(a.dtiBefore).toBeCloseTo(200 / 4333.333, 6);
    expect(a.dtiAfter).toBeCloseTo(662.47 / 4333.333, 6);
    expect(a.residual).toBeCloseTo(3120 - 1200 - 200 - 400 - 462.47, 2);
  });
  it('returns null DTI when there is no income', () => {
    const a = assessAffordability({ ...maria, annualIncome: 0 }, { amount: 1000, aprPct: 5, termMonths: 12 });
    expect(a.dtiBefore).toBeNull();
    expect(a.dtiAfter).toBeNull();
    expect(a.residual).toBeLessThan(0);
  });
});
