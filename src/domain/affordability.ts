import { monthlyPayment } from './loan';
import { POLICY } from './policyConfig';
import type { Financials, LoanTerms } from './types';

export interface Affordability {
  grossMonthlyIncome: number;
  netMonthlyIncome: number;
  payment: number;
  dtiBefore: number | null;
  dtiAfter: number | null;
  residual: number;
}

export function assessAffordability(f: Financials, terms: LoanTerms): Affordability {
  const grossMonthlyIncome = Math.max(0, f.annualIncome) / 12;
  const netMonthlyIncome = grossMonthlyIncome * POLICY.netIncomeFactor;
  const payment = monthlyPayment(terms.amount, terms.aprPct, terms.termMonths);
  const hasIncome = grossMonthlyIncome > 0;
  return {
    grossMonthlyIncome,
    netMonthlyIncome,
    payment,
    dtiBefore: hasIncome ? f.existingDebt / grossMonthlyIncome : null,
    dtiAfter: hasIncome ? (f.existingDebt + payment) / grossMonthlyIncome : null,
    residual: netMonthlyIncome - f.monthlyRent - f.existingDebt - f.otherExpenses - payment,
  };
}
