import { useState } from 'react';
import { getPersonaDefaults } from '../data/personaDefaults';

interface Props {
  workflowId: string;
  onStateChange: (state: { stage: string; sub: string }) => void;
}

export default function ReviewSubmit({ workflowId, onStateChange }: Props) {
  const defaults = getPersonaDefaults();
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
      const res = await fetch(`/workflow/${workflowId}/submit`, {
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
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-800 mb-6">Review your application</h2>
        <div className="space-y-6">
          {sections.map((s) => (
            <div key={s.title} className="border border-slate-200 rounded-lg overflow-hidden">
              <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
                <h3 className="text-sm font-semibold text-slate-700">{s.title}</h3>
              </div>
              <dl className="divide-y divide-slate-100">
                {s.fields.map((f) => (
                  <div key={f.label} className="flex px-4 py-2.5 gap-4">
                    <dt className="text-xs text-slate-500 w-40 shrink-0">{f.label}</dt>
                    <dd className="text-sm text-slate-800 font-medium">{f.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <label className="flex items-start gap-3 cursor-pointer">
          <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-0.5 w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-300" />
          <span className="text-sm text-slate-700">
            I confirm that all information provided is accurate and complete. I have read and agree to the{' '}
            <a href="#" className="text-blue-600 underline">Terms and Conditions</a>,{' '}
            <a href="#" className="text-blue-600 underline">Privacy Policy</a>, and{' '}
            <a href="#" className="text-blue-600 underline">Loan Agreement</a>.
          </span>
        </label>
      </div>

      <button type="submit" disabled={!agreed || submitting} className="w-full bg-blue-600 text-white font-semibold py-3.5 rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors">
        {submitting ? 'Submitting…' : 'Submit application'}
      </button>
    </form>
  );
}