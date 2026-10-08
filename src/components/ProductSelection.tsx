import { useState } from 'react';
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
  const defaults = persona.form;
  const apr = aprForScore(persona.creditScore);
  const [account, setAccount] = useState('current');
  const [amount, setAmount] = useState(defaults.loanAmount);
  const [term, setTerm] = useState(defaults.loanTerm);
  const [purpose, setPurpose] = useState('home-improvement');
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(apiUrl(`/workflow/${workflowId}/products`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          products: [
            { type: account, config: {} },
            { type: 'personal-loan', config: { amount, term, purpose } },
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
    <form onSubmit={onSubmit} className="space-y-8">
      <div className="rounded-lg border border-line bg-surface p-6">
        <h2 className="font-display text-lg font-semibold text-ink mb-4">Choose your account</h2>
        <div className="space-y-3">
          {accounts.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => setAccount(a.id)}
              className={`w-full text-left border-2 rounded-lg p-4 transition-all flex justify-between items-start ${
                account === a.id ? 'border-accent bg-accent-soft' : 'border-line hover:border-accent/50'
              }`}
            >
              <div>
                <p className="font-semibold text-sm text-ink">{a.label}</p>
                <p className="text-xs text-muted mt-0.5">{a.description}</p>
              </div>
              <span className="text-xs font-medium text-muted ml-4 shrink-0">{a.fee}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-line bg-surface p-6">
        <h2 className="font-display text-lg font-semibold text-ink mb-4">Personal loan</h2>

        <div className="mb-4">
          <label className="text-sm font-medium text-ink block mb-2">Purpose</label>
          <select value={purpose} onChange={(e) => setPurpose(e.target.value)} className="w-full border border-line rounded-md px-3 py-2 text-sm">
            <option value="home-improvement">Home improvement</option>
            <option value="vehicle">Vehicle purchase</option>
            <option value="debt-consolidation">Debt consolidation</option>
            <option value="education">Education</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div className="space-y-6 p-4 bg-wash rounded-lg border border-line">
          <div>
            <label className="text-sm font-medium text-ink">
              Loan amount: <span className="text-accent font-bold">€{amount.toLocaleString()}</span>
            </label>
            <input type="range" min={1000} max={50000} step={500} value={amount} onChange={(e) => setAmount(Number(e.target.value))} className="w-full mt-2 accent-[#0f6e6a]" />
            <div className="flex justify-between text-xs text-muted mt-1"><span>€1,000</span><span>€50,000</span></div>
          </div>

          <div>
            <label className="text-sm font-medium text-ink block mb-2">Repayment term</label>
            <select value={term} onChange={(e) => setTerm(e.target.value)} className="w-full rounded-md border border-line px-3 py-2 text-sm">
              {['12','24','36','48','60'].map((t) => <option key={t} value={t}>{t} months</option>)}
            </select>
          </div>

          <div className="bg-surface rounded-lg border border-line p-4 text-center">
            <p className="text-xs text-muted">Estimated monthly payment</p>
            <p className="num mt-1 text-2xl font-medium text-ink">{fmtEur(monthlyPayment(amount, apr, Number(term)), { cents: true })}</p>
            <p className="mt-1 text-xs text-muted">{fmtRate(apr)} APR for your credit profile · indicative only</p>
          </div>
        </div>
      </div>

      <button type="submit" disabled={saving} className="w-full bg-accent text-white font-semibold py-3 rounded-lg hover:bg-accent/90 disabled:opacity-60 transition-colors">
        {saving ? 'Saving…' : 'Continue'}
      </button>
    </form>
  );
}