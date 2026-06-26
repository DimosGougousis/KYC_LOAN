import { useState } from 'react';
import { getPersonaDefaults } from '../data/personaDefaults';

const accounts = [
  { id: 'current', label: 'Current Account', description: 'Everyday banking with debit card, contactless, and mobile app', fee: 'Free' },
  { id: 'savings', label: 'Savings Account', description: 'Earn 4.2% AER on your balance with instant access', fee: 'Free' },
  { id: 'premium', label: 'Premium Account', description: 'Priority support, worldwide travel insurance, and premium card', fee: '£15/month' },
];

interface Props {
  workflowId: string;
  onStateChange: (state: { stage: string; sub: string }) => void;
}

export default function ProductSelection({ workflowId, onStateChange }: Props) {
  const defaults = getPersonaDefaults();
  const [account, setAccount] = useState('current');
  const [amount, setAmount] = useState(defaults.loanAmount);
  const [term, setTerm] = useState(defaults.loanTerm);
  const [purpose, setPurpose] = useState('home-improvement');
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/workflow/${workflowId}/products`, {
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
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <h2 className="text-base font-semibold text-slate-800 mb-4">Choose your account</h2>
        <div className="space-y-3">
          {accounts.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => setAccount(a.id)}
              className={`w-full text-left border-2 rounded-xl p-4 transition-all flex justify-between items-start ${
                account === a.id ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-blue-300'
              }`}
            >
              <div>
                <p className="font-semibold text-sm text-slate-800">{a.label}</p>
                <p className="text-xs text-slate-500 mt-0.5">{a.description}</p>
              </div>
              <span className="text-xs font-medium text-slate-600 ml-4 shrink-0">{a.fee}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <h2 className="text-base font-semibold text-slate-800 mb-4">Personal loan</h2>

        <div className="mb-4">
          <label className="text-sm font-medium text-slate-700 block mb-2">Purpose</label>
          <select value={purpose} onChange={(e) => setPurpose(e.target.value)} className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm">
            <option value="home-improvement">Home improvement</option>
            <option value="vehicle">Vehicle purchase</option>
            <option value="debt-consolidation">Debt consolidation</option>
            <option value="education">Education</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div className="space-y-6 p-4 bg-slate-50 rounded-xl border border-slate-200">
          <div>
            <label className="text-sm font-medium text-slate-700">
              Loan amount: <span className="text-blue-700 font-bold">€{amount.toLocaleString()}</span>
            </label>
            <input type="range" min={1000} max={50000} step={500} value={amount} onChange={(e) => setAmount(Number(e.target.value))} className="w-full mt-2 accent-blue-600" />
            <div className="flex justify-between text-xs text-slate-400 mt-1"><span>€1,000</span><span>€50,000</span></div>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 block mb-2">Repayment term</label>
            <select value={term} onChange={(e) => setTerm(e.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
              {['12','24','36','48','60'].map((t) => <option key={t} value={t}>{t} months</option>)}
            </select>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 p-4 text-center">
            <p className="text-xs text-slate-500">Estimated monthly payment</p>
            <p className="text-2xl font-bold text-slate-800 mt-1">€{Math.round(amount * (0.00575 * 1.00575 ** Number(term)) / (1.00575 ** Number(term) - 1)).toLocaleString()}</p>
            <p className="text-xs text-slate-400 mt-1">Representative 6.9% APR · indicative only</p>
          </div>
        </div>
      </div>

      <button type="submit" disabled={saving} className="w-full bg-blue-600 text-white font-semibold py-3 rounded-xl hover:bg-blue-700 disabled:opacity-60 transition-colors">
        {saving ? 'Saving…' : 'Continue'}
      </button>
    </form>
  );
}