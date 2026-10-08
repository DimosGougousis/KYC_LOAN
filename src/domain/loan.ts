import { round2 } from './format';

export interface AmortRow { month: number; opening: number; interest: number; principal: number; closing: number }
export interface YearRow { year: number; opening: number; interest: number; principal: number; closing: number }

export function monthlyPayment(principal: number, aprPct: number, months: number): number {
  if (months <= 0) return 0;
  const r = aprPct / 1200;
  if (r === 0) return round2(principal / months);
  return round2((principal * r) / (1 - Math.pow(1 + r, -months)));
}

export function amortize(principal: number, aprPct: number, months: number): AmortRow[] {
  const r = aprPct / 1200;
  const payment = monthlyPayment(principal, aprPct, months);
  const rows: AmortRow[] = [];
  let balance = principal;
  for (let month = 1; month <= months; month++) {
    const interest = round2(balance * r);
    // The final month repays whatever is left, absorbing rounding drift.
    const principalPart = month === months ? balance : round2(payment - interest);
    const closing = round2(balance - principalPart);
    rows.push({ month, opening: balance, interest, principal: round2(principalPart), closing });
    balance = closing;
  }
  return rows;
}

export function yearlySummary(rows: AmortRow[]): YearRow[] {
  const years: YearRow[] = [];
  rows.forEach((row, i) => {
    const year = Math.floor(i / 12) + 1;
    const current = years[year - 1];
    if (!current) {
      years.push({ year, opening: row.opening, interest: row.interest, principal: row.principal, closing: row.closing });
    } else {
      current.interest = round2(current.interest + row.interest);
      current.principal = round2(current.principal + row.principal);
      current.closing = row.closing;
    }
  });
  return years;
}

export function totalInterest(rows: AmortRow[]): number {
  return round2(rows.reduce((s, r) => s + r.interest, 0));
}
