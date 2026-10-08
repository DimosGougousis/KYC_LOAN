import { describe, expect, it } from 'vitest';
import { getPersona } from '../data/personas';
import { PRESETS, baseInputs, clampInputs, parseInputs, runAllScenarios, runScenario } from './scenarios';

const sarah = getPersona('borderline-credit')!;
const lisa = getPersona('counter-offer')!;
const preset = (id: string) => PRESETS.find((p) => p.id === id)!;

describe('scenario outcomes (spec success criterion 3)', () => {
  it('Sarah: refer at base, approve at 60 months, counter-offer at income −20%', () => {
    const b = baseInputs(sarah);
    expect(runScenario(sarah, b).decision.outcome).toBe('refer-underwriting');
    expect(runScenario(sarah, preset('term-60').apply(b)).decision.outcome).toBe('approved');
    const lower = runScenario(sarah, preset('income-20').apply(b)).decision;
    expect(lower.outcome).toBe('counter-offer');
    expect(lower.offer).toEqual({ amount: 5000, aprPct: 8.9, termMonths: 36 });
  });
  it('Lisa: counter-offer as requested, approved at the counter-offer terms', () => {
    const b = baseInputs(lisa);
    expect(runScenario(lisa, b).decision.outcome).toBe('counter-offer');
    expect(runScenario(lisa, { ...b, amount: 8000 }).decision.outcome).toBe('approved');
  });
});

describe('scenario mechanics', () => {
  it('rate presets add percentage points', () => {
    expect(preset('rate-2').apply(baseInputs(sarah)).aprPct).toBeCloseTo(10.9, 5);
    expect(preset('rate-4').apply(baseInputs(sarah)).aprPct).toBeCloseTo(12.9, 5);
  });
  it('a job-loss shock lowers minimum residual income but not the DTI decision', () => {
    const b = baseInputs(sarah);
    const shocked = runScenario(sarah, preset('job-loss-3').apply(b));
    const normal = runScenario(sarah, b);
    expect(shocked.decision.outcome).toBe(normal.decision.outcome);
    expect(shocked.minResidual).toBeLessThan(normal.minResidual);
    expect(shocked.residual.slice(0, 3).every((r) => r < 0)).toBe(true);
  });
  it('produces balances from principal to zero and yearly rows', () => {
    const r = runScenario(sarah, baseInputs(sarah));
    expect(r.balance[0]).toBe(15000);
    expect(r.balance.at(-1)).toBe(0);
    expect(r.balance).toHaveLength(37);
    expect(r.residual).toHaveLength(36);
    expect(r.years).toHaveLength(3);
  });
  it('clamps to limits', () => {
    const c = clampInputs({ amount: 500, aprPct: 50, termMonths: 400, incomeChangePct: -300, expensesChangePct: 300, shockMonths: 99 });
    expect(c).toEqual({ amount: 1000, aprPct: 30, termMonths: 120, incomeChangePct: -100, expensesChangePct: 100, shockMonths: 12 });
  });
  it('parses drafts, reporting empty and out-of-range fields', () => {
    const ok = parseInputs({ amount: '15000', aprPct: '8.9', termMonths: '36', incomeChangePct: '0', expensesChangePct: '0', shockMonths: '0' });
    expect(ok.errors).toEqual({});
    expect(ok.inputs?.amount).toBe(15000);
    const bad = parseInputs({ amount: '', aprPct: 'abc', termMonths: '3', incomeChangePct: '0', expensesChangePct: '0', shockMonths: '0' });
    expect(bad.inputs).toBeNull();
    expect(bad.errors).toEqual({ amount: 'Enter a number', aprPct: 'Enter a number', termMonths: 'Between 6 and 120' });
  });
  it('runs every preset', () => {
    expect(runAllScenarios(sarah).map((s) => s.id)).toEqual(PRESETS.map((p) => p.id));
  });
});
