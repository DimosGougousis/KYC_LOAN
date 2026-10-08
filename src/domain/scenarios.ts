import type { Persona } from '../data/personas';
import { amortize, totalInterest, yearlySummary, type YearRow } from './loan';
import { decideForPersona, financialsOf, requestedTerms } from './persona';
import type { Decision } from './policy';

export interface ScenarioInputs {
  amount: number;
  aprPct: number;
  termMonths: number;
  incomeChangePct: number;
  expensesChangePct: number;
  shockMonths: number;
}
export type InputKey = keyof ScenarioInputs;
export type PresetId = 'base' | 'rate-2' | 'rate-4' | 'income-20' | 'job-loss-3' | 'costs-15' | 'term-60';

export const LIMITS: Record<InputKey, [number, number]> = {
  amount: [1000, 100000],
  aprPct: [0, 30],
  termMonths: [6, 120],
  incomeChangePct: [-100, 100],
  expensesChangePct: [-100, 100],
  shockMonths: [0, 12],
};

export const PRESETS: { id: PresetId; label: string; blurb: string; apply: (b: ScenarioInputs) => ScenarioInputs }[] = [
  { id: 'base', label: 'Base case', blurb: 'The application as submitted.', apply: (b) => b },
  { id: 'rate-2', label: 'Rate +2pp', blurb: 'APR two percentage points higher.', apply: (b) => ({ ...b, aprPct: b.aprPct + 2 }) },
  { id: 'rate-4', label: 'Rate +4pp', blurb: 'APR four percentage points higher.', apply: (b) => ({ ...b, aprPct: b.aprPct + 4 }) },
  { id: 'income-20', label: 'Income −20%', blurb: 'Gross income falls by a fifth for the whole term.', apply: (b) => ({ ...b, incomeChangePct: -20 }) },
  { id: 'job-loss-3', label: 'Job loss (3 mo)', blurb: 'No income for the first three months, then back to normal.', apply: (b) => ({ ...b, shockMonths: 3 }) },
  { id: 'costs-15', label: 'Living costs +15%', blurb: 'Rent and other expenses rise by 15%.', apply: (b) => ({ ...b, expensesChangePct: 15 }) },
  { id: 'term-60', label: 'Longer term (60 mo)', blurb: 'Same amount spread over 60 months.', apply: (b) => ({ ...b, termMonths: 60 }) },
];

export function baseInputs(p: Persona): ScenarioInputs {
  const t = requestedTerms(p);
  return { amount: t.amount, aprPct: t.aprPct, termMonths: t.termMonths, incomeChangePct: 0, expensesChangePct: 0, shockMonths: 0 };
}

const clamp = (v: number, [lo, hi]: [number, number]) => Math.min(hi, Math.max(lo, v));

export function clampInputs(i: ScenarioInputs): ScenarioInputs {
  const out = { ...i };
  (Object.keys(LIMITS) as InputKey[]).forEach((k) => { out[k] = clamp(i[k], LIMITS[k]); });
  out.termMonths = Math.round(out.termMonths);
  out.shockMonths = Math.round(out.shockMonths);
  return out;
}

export function parseInputs(draft: Record<InputKey, string>): { inputs: ScenarioInputs | null; errors: Partial<Record<InputKey, string>> } {
  const errors: Partial<Record<InputKey, string>> = {};
  const values = {} as ScenarioInputs;
  (Object.keys(LIMITS) as InputKey[]).forEach((k) => {
    const raw = draft[k].trim();
    const n = Number(raw);
    const [lo, hi] = LIMITS[k];
    if (raw === '' || !Number.isFinite(n)) errors[k] = 'Enter a number';
    else if (n < lo || n > hi) errors[k] = `Between ${lo} and ${hi}`;
    else values[k] = n;
  });
  return { inputs: Object.keys(errors).length ? null : clampInputs(values), errors };
}

export interface ScenarioResult {
  decision: Decision;
  payment: number;
  dtiAfter: number | null;
  totalInterest: number;
  minResidual: number;
  years: YearRow[];
  balance: number[];
  residual: number[];
}

export function runScenario(p: Persona, i: ScenarioInputs): ScenarioResult {
  const f = financialsOf(p);
  const financials = {
    annualIncome: f.annualIncome * (1 + i.incomeChangePct / 100),
    monthlyRent: f.monthlyRent * (1 + i.expensesChangePct / 100),
    otherExpenses: f.otherExpenses * (1 + i.expensesChangePct / 100),
    existingDebt: f.existingDebt,
  };
  const terms = { amount: i.amount, aprPct: i.aprPct, termMonths: i.termMonths };
  const decision = decideForPersona(p, { terms, financials });
  const a = decision.affordability;
  const rows = amortize(terms.amount, terms.aprPct, terms.termMonths);
  const fixedCosts = financials.monthlyRent + financials.otherExpenses + financials.existingDebt + a.payment;
  // Policy is tested on a normal month; the shock only affects money left over.
  const residual = rows.map((r) => (r.month <= i.shockMonths ? 0 : a.netMonthlyIncome) - fixedCosts);
  return {
    decision,
    payment: a.payment,
    dtiAfter: a.dtiAfter,
    totalInterest: totalInterest(rows),
    minResidual: Math.min(...residual),
    years: yearlySummary(rows),
    balance: [terms.amount, ...rows.map((r) => r.closing)],
    residual,
  };
}

export function runAllScenarios(p: Persona): { id: PresetId; label: string; result: ScenarioResult }[] {
  const b = baseInputs(p);
  return PRESETS.map((pr) => ({ id: pr.id, label: pr.label, result: runScenario(p, clampInputs(pr.apply(b))) }));
}
