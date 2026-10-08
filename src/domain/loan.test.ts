import { describe, expect, it } from 'vitest';
import { amortize, monthlyPayment, totalInterest, yearlySummary } from './loan';

describe('monthlyPayment', () => {
  it('matches the spec reference values', () => {
    expect(monthlyPayment(15000, 6.9, 36)).toBe(462.47);
    expect(monthlyPayment(8000, 8.9, 24)).toBe(365.11);
    expect(monthlyPayment(15000, 8.9, 24)).toBe(684.58);
  });
  it('uses straight-line repayment at zero rate', () => {
    expect(monthlyPayment(12000, 0, 24)).toBe(500);
  });
});

describe('amortize', () => {
  const rows = amortize(15000, 6.9, 36);
  it('has one row per month and ends at exactly zero', () => {
    expect(rows).toHaveLength(36);
    expect(rows[35].closing).toBe(0);
  });
  it('charges interest on the opening balance', () => {
    expect(rows[0].opening).toBe(15000);
    expect(rows[0].interest).toBe(86.25);
    expect(rows[0].principal).toBe(376.22);
    expect(rows[1].opening).toBe(rows[0].closing);
  });
  it('repays the whole principal', () => {
    const repaid = rows.reduce((s, r) => s + r.principal, 0);
    expect(Math.round(repaid * 100) / 100).toBe(15000);
  });
  it('handles zero rate', () => {
    const z = amortize(1000, 0, 3);
    expect(z.map((r) => r.principal)).toEqual([333.33, 333.33, 333.34]);
    expect(totalInterest(z)).toBe(0);
  });
});

describe('yearlySummary', () => {
  it('rolls months up into years', () => {
    const years = yearlySummary(amortize(15000, 6.9, 36));
    expect(years).toHaveLength(3);
    expect(years[0].opening).toBe(15000);
    expect(years[2].closing).toBe(0);
    const interest = years.reduce((s, y) => s + y.interest, 0);
    expect(Math.round(interest * 100) / 100).toBe(totalInterest(amortize(15000, 6.9, 36)));
  });
  it('handles a partial final year', () => {
    expect(yearlySummary(amortize(5000, 5, 18))).toHaveLength(2);
  });
});
