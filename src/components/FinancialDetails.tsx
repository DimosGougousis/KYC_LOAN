import { useState, type FormEvent } from 'react';
import { currentPersona } from '../data/personas';
import { fmtEur } from '../domain/format';
import { apiUrl } from '../lib/api';

const EMPLOYMENT: Record<string, string> = {
  employed: 'Employed',
  'self-employed': 'Self-employed',
  contractor: 'Contractor',
  retired: 'Retired',
  unemployed: 'Not currently employed',
};

interface Props {
  workflowId: string;
  onStateChange: (state: { stage: string; sub: string }) => void;
}

export default function FinancialDetails({ workflowId, onStateChange }: Props) {
  const persona = currentPersona();
  const f = persona.form;
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch(apiUrl(`/workflow/${workflowId}/financial-details`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employmentType: f.employmentType, annualIncome: f.annualIncome, payFrequency: 'monthly',
          monthlyRent: f.monthlyRent, existingDebt: f.existingDebt, otherExpenses: f.otherExpenses,
        }),
      });
      const json = await res.json();
      onStateChange(json.state);
    } finally {
      setSubmitting(false);
    }
  }

  const rows: [string, string][] = [
    ['Employment', EMPLOYMENT[f.employmentType] ?? f.employmentType],
    ['Employer', persona.employer],
    ['Years with employer', String(persona.yearsEmployed)],
    ['Annual gross income', fmtEur(f.annualIncome)],
    ['Monthly rent or mortgage', fmtEur(f.monthlyRent)],
    ['Existing debt repayments', fmtEur(f.existingDebt)],
    ['Other monthly expenses', fmtEur(f.otherExpenses)],
  ];

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="rounded-lg border border-line bg-surface p-6">
        <h2 className="font-display text-lg font-semibold text-ink">Income and outgoings</h2>
        <p className="mt-1 text-sm text-muted">Declared in {f.firstName}'s application file. The affordability check uses exactly these figures.</p>
        <dl className="mt-4 divide-y divide-line rounded-lg border border-line">
          {rows.map(([k, v]) => (
            <div key={k} className="flex items-center justify-between gap-4 px-4 py-2.5 text-sm">
              <dt className="text-muted">{k}</dt>
              <dd className="num text-right text-ink">{v}</dd>
            </div>
          ))}
        </dl>
      </div>

      <button type="submit" disabled={submitting} className="w-full rounded-lg bg-accent py-3 font-semibold text-white transition-colors hover:bg-accent/90 disabled:opacity-60">
        {submitting ? 'Saving…' : 'Continue'}
      </button>
    </form>
  );
}
