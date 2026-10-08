import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { currentPersona } from '../data/personas';
import { fmtEur, fmtRate } from '../domain/format';
import { monthlyPayment } from '../domain/loan';
import { aprForScore } from '../domain/policy';
import { apiUrl } from '../lib/api';

const accounts = [
  { id: 'current', label: 'Current Account', description: 'Everyday banking with debit card, contactless, and mobile app', fee: 'Free' },
  { id: 'savings', label: 'Savings Account', description: 'Earn 4.2% AER on your balance with instant access', fee: 'Free' },
  { id: 'premium', label: 'Premium Account', description: 'Priority support, worldwide travel insurance, and premium card', fee: '€15/month' },
];

interface Props {
  workflowId: string;
  onStateChange: (state: { stage: string; sub: string }) => void;
}

export default function ProductSelection({ workflowId, onStateChange }: Props) {
  const persona = currentPersona();
  const { loanAmount, loanTerm } = persona.form;
  const apr = aprForScore(persona.creditScore);
  const [account, setAccount] = useState('current');
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(apiUrl(`/workflow/${workflowId}/products`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          products: [
            { type: account, config: {} },
            { type: 'personal-loan', config: { amount: loanAmount, term: loanTerm, purpose: persona.purpose } },
          ],
        }),
      });
      const json = await res.json();
      onStateChange(json.state);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="rounded-lg border border-line bg-surface p-6">
        <h2 className="mb-4 font-display text-lg font-semibold text-ink">Choose your account</h2>
        <div className="space-y-3" role="group" aria-label="Account">
          {accounts.map((a) => (
            <button
              key={a.id}
              type="button"
              aria-pressed={account === a.id}
              onClick={() => setAccount(a.id)}
              className={`flex w-full items-start justify-between rounded-lg border-2 p-4 text-left transition-all ${
                account === a.id ? 'border-accent bg-accent-soft' : 'border-line hover:border-accent/50'
              }`}
            >
              <div>
                <p className="text-sm font-semibold text-ink">{a.label}</p>
                <p className="mt-0.5 text-xs text-muted">{a.description}</p>
              </div>
              <span className="ml-4 shrink-0 text-xs font-medium text-muted">{a.fee}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-line bg-surface p-6">
        <h2 className="font-display text-lg font-semibold text-ink">Personal loan</h2>
        <p className="mt-1 text-sm text-muted">Pre-filled from {persona.form.firstName}'s application file; the decision is made on these figures.</p>
        <dl className="mt-4 grid grid-cols-2 gap-y-2 rounded-lg border border-line bg-wash p-4 text-sm">
          <dt className="text-muted">Purpose</dt><dd className="text-right">{persona.purpose}</dd>
          <dt className="text-muted">Amount</dt><dd className="num text-right">{fmtEur(loanAmount)}</dd>
          <dt className="text-muted">Term</dt><dd className="num text-right">{loanTerm} months</dd>
          <dt className="text-muted">Rate</dt><dd className="num text-right">{fmtRate(apr)} APR</dd>
        </dl>
        <div className="mt-4 rounded-lg border border-line p-4 text-center">
          <p className="text-xs text-muted">Estimated monthly payment</p>
          <p className="num mt-1 text-2xl font-medium text-ink">{fmtEur(monthlyPayment(loanAmount, apr, Number(loanTerm)), { cents: true })}</p>
          <p className="mt-1 text-xs text-muted">{fmtRate(apr)} APR for your credit profile · indicative only</p>
        </div>
        <p className="mt-4 text-sm text-muted">
          Want to try a different amount or term? Use the{' '}
          <Link to={`/case/${persona.id}#scenario-lab`} className="font-medium text-accent underline underline-offset-4">scenario lab</Link>{' '}
          in the reviewer's case file.
        </p>
      </div>

      <button type="submit" disabled={saving} className="w-full rounded-lg bg-accent py-3 font-semibold text-white transition-colors hover:bg-accent/90 disabled:opacity-60">
        {saving ? 'Saving…' : 'Continue'}
      </button>
    </form>
  );
}
