import { useState } from 'react';
import { currentPersona } from '../data/personas';
import { apiUrl } from '../lib/api';

interface Props {
  workflowId: string;
  onStateChange: (state: { stage: string; sub: string }) => void;
}

export default function ReviewSubmit({ workflowId, onStateChange }: Props) {
  const defaults = currentPersona().form;
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const sections = [
    {
      title: 'Personal details',
      fields: [
        { label: 'Full name', value: `${defaults.firstName} ${defaults.lastName}` },
        { label: 'Email', value: defaults.email },
        { label: 'Phone', value: defaults.phone },
      ],
    },
    {
      title: 'Products selected',
      fields: [
        { label: 'Account type', value: 'Current Account' },
        { label: 'Loan amount', value: `€${defaults.loanAmount.toLocaleString()}` },
        { label: 'Loan term', value: `${defaults.loanTerm} months` },
        { label: 'Est. monthly', value: `€${Math.round(defaults.loanAmount * (0.00575 * 1.00575 ** Number(defaults.loanTerm)) / (1.00575 ** Number(defaults.loanTerm) - 1)).toLocaleString()}` },
      ],
    },
    {
      title: 'Financial details',
      fields: [
        { label: 'Employment', value: defaults.employmentType.replace('-', ' ') },
        { label: 'Annual income', value: `€${defaults.annualIncome.toLocaleString()}` },
        { label: 'Monthly rent', value: `€${defaults.monthlyRent.toLocaleString()}` },
      ],
    },
  ];

  async function handleSubmit(e: React.FormEvent) {
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
        <h2 className="font-display text-xl font-semibold text-ink mb-6">Review your application</h2>
        <div className="space-y-6">
          {sections.map((s) => (
            <div key={s.title} className="border border-line rounded-lg overflow-hidden">
              <div className="bg-wash px-4 py-3 border-b border-line">
                <h3 className="text-sm font-semibold text-ink">{s.title}</h3>
              </div>
              <dl className="divide-y divide-line">
                {s.fields.map((f) => (
                  <div key={f.label} className="flex px-4 py-2.5 gap-4">
                    <dt className="text-xs text-muted w-40 shrink-0">{f.label}</dt>
                    <dd className="text-sm text-ink font-medium">{f.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-line bg-surface p-6">
        <label className="flex items-start gap-3 cursor-pointer">
          <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-0.5 w-4 h-4 rounded border-line text-accent focus:ring-accent/30" />
          <span className="text-sm text-ink">
            I confirm that all information provided is accurate and complete. I have read and agree to the{' '}
            <a href="#" className="text-accent underline">Terms and Conditions</a>,{' '}
            <a href="#" className="text-accent underline">Privacy Policy</a>, and{' '}
            <a href="#" className="text-accent underline">Loan Agreement</a>.
          </span>
        </label>
      </div>

      <button type="submit" disabled={!agreed || submitting} className="w-full bg-accent text-white font-semibold py-3.5 rounded-lg hover:bg-accent/90 disabled:opacity-50 transition-colors">
        {submitting ? 'Submitting…' : 'Submit application'}
      </button>
    </form>
  );
}