import { useState, type FormEvent } from 'react';
import { currentPersona } from '../data/personas';
import { fmtEur, fmtRate } from '../domain/format';
import { monthlyPayment } from '../domain/loan';
import { aprForScore } from '../domain/policy';
import { apiUrl } from '../lib/api';

interface Props {
  workflowId: string;
  onStateChange: (state: { stage: string; sub: string }) => void;
}

export default function ReviewSubmit({ workflowId, onStateChange }: Props) {
  const persona = currentPersona();
  const f = persona.form;
  const apr = aprForScore(persona.creditScore);
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const sections: { title: string; fields: [string, string][] }[] = [
    {
      title: 'Personal details',
      fields: [['Full name', `${f.firstName} ${f.lastName}`], ['Email', f.email], ['Phone', f.phone]],
    },
    {
      title: 'Loan',
      fields: [
        ['Purpose', persona.purpose],
        ['Amount', fmtEur(f.loanAmount)],
        ['Term', `${f.loanTerm} months`],
        ['Rate', `${fmtRate(apr)} APR`],
        ['Monthly payment', fmtEur(monthlyPayment(f.loanAmount, apr, Number(f.loanTerm)), { cents: true })],
      ],
    },
    {
      title: 'Financial details',
      fields: [
        ['Annual income', fmtEur(f.annualIncome)],
        ['Monthly rent', fmtEur(f.monthlyRent)],
        ['Existing repayments', fmtEur(f.existingDebt)],
      ],
    },
  ];

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!agreed) return;
    setSubmitting(true);
    try {
      const res = await fetch(apiUrl(`/workflow/${workflowId}/submit`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ termsAccepted: true, idempotencyKey: crypto.randomUUID() }),
      });
      const json = await res.json();
      onStateChange(json.state);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-lg border border-line bg-surface p-6">
        <h2 className="mb-6 font-display text-xl font-semibold text-ink">Review your application</h2>
        <div className="space-y-6">
          {sections.map((s) => (
            <div key={s.title} className="overflow-hidden rounded-lg border border-line">
              <div className="border-b border-line bg-wash px-4 py-3">
                <h3 className="text-sm font-semibold text-ink">{s.title}</h3>
              </div>
              <dl className="divide-y divide-line">
                {s.fields.map(([label, value]) => (
                  <div key={label} className="flex flex-wrap justify-between gap-x-4 gap-y-0.5 px-4 py-2.5">
                    <dt className="text-xs text-muted">{label}</dt>
                    <dd className="num text-sm font-medium break-all text-ink">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-line bg-surface p-6">
        <label className="flex cursor-pointer items-start gap-3">
          <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-0.5 h-4 w-4 rounded border-line" />
          <span className="text-sm text-ink">
            I confirm that all information provided is accurate and complete, and I agree to the demo terms. (Demo only: nothing is sent anywhere.)
          </span>
        </label>
      </div>

      <button type="submit" disabled={!agreed || submitting} className="w-full rounded-lg bg-accent py-3.5 font-semibold text-white transition-colors hover:bg-accent/90 disabled:opacity-50">
        {submitting ? 'Submitting…' : 'Submit application'}
      </button>
    </form>
  );
}
