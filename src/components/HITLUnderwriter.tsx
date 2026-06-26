import { useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useState } from 'react';

export default function HITLUnderwriter() {
  const { reviewId } = useParams<{ reviewId: string }>();
  const [justification, setJustification] = useState('');
  const [counterAmount, setCounterAmount] = useState('');
  const [showCounter, setShowCounter] = useState(false);
  const [done, setDone] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['review', reviewId],
    queryFn: async () => {
      const res = await fetch(`/workflow/wf-current/review/${reviewId}`);
      return res.json();
    },
    enabled: !!reviewId,
  });

  const mutation = useMutation({
    mutationFn: async ({ decision, counterOffer }: { decision: string; counterOffer?: any }) => {
      const res = await fetch(`/workflow/wf-current/review/${reviewId}/decision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision, justification, counterOffer, reviewerId: 'underwriter-001' }),
      });
      return res.json();
    },
    onSuccess: () => setDone(true),
  });

  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>;

  if (done) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center max-w-sm">
        <div className="text-4xl mb-4">✓</div>
        <h2 className="text-xl font-bold text-slate-800">Underwriting decision recorded</h2>
        <p className="text-sm text-slate-500 mt-2">The applicant will be notified of the outcome.</p>
      </div>
    </div>
  );

  if (!data) return null;

  const dti = data.dti ? Math.round(data.dti * 100) : 0;

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-blue-800 text-white px-6 py-4">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs text-blue-300 uppercase tracking-wide font-medium">Manual Underwriting</p>
          <h1 className="text-xl font-bold mt-0.5">Loan Application Review</h1>
        </div>
      </header>

      <div className="max-w-5xl mx-auto p-6 grid grid-cols-2 gap-6">
        {/* LEFT COLUMN: Loan request + Credit + Income */}
        <div className="space-y-4">
          {/* Loan request */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-700 mb-3">Loan request — {data.applicantName}</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex gap-4"><dt className="text-slate-500 w-32">Amount</dt><dd className="font-bold text-slate-800">£{data.loanRequest?.amount?.toLocaleString()}</dd></div>
              <div className="flex gap-4"><dt className="text-slate-500 w-32">Term</dt><dd className="text-slate-800">{data.loanRequest?.term} months</dd></div>
              <div className="flex gap-4"><dt className="text-slate-500 w-32">Purpose</dt><dd className="text-slate-800 capitalize">{(data.loanRequest?.purpose ?? '').replace(/-/g, ' ')}</dd></div>
            </dl>
          </div>

          {/* Credit report */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-700 mb-3">Credit report — {data.creditReport?.bureau}</h2>
            <div className="flex items-center gap-4 mb-3">
              <div className={`text-3xl font-black ${(data.creditReport?.score ?? 0) >= 680 ? 'text-green-600' : (data.creditReport?.score ?? 0) >= 580 ? 'text-amber-500' : 'text-red-600'}`}>
                {data.creditReport?.score}
              </div>
              <div className="text-xs text-slate-500">
                {data.creditReport?.score && data.creditReport.score >= 680 ? 'Good' : data.creditReport?.score && data.creditReport.score >= 580 ? 'Fair' : 'Poor'}
              </div>
            </div>
            {data.creditReport?.factors?.length > 0 && (
              <ul className="space-y-1">
                {data.creditReport.factors.map((f: string, i: number) => (
                  <li key={i} className="text-xs text-slate-600 flex items-start gap-1"><span className="text-amber-400 mt-0.5">•</span>{f}</li>
                ))}
              </ul>
            )}
          </div>

          {/* Income vs outgoings */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-700 mb-3">Income vs outgoings</h2>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs text-slate-500 mb-1">
                  <span>Monthly income</span>
                  <span className="font-medium text-slate-700">£{data.monthlyIncome?.toLocaleString()}</span>
                </div>
                <div className="h-3 bg-green-100 rounded-full overflow-hidden">
                  <div className="h-full bg-green-400 rounded-full" style={{ width: '100%' }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs text-slate-500 mb-1">
                  <span>Monthly debt</span>
                  <span className={`font-medium ${dti > 40 ? 'text-red-600' : 'text-slate-700'}`}>£{data.monthlyDebt?.toLocaleString()} ({dti}% DTI)</span>
                </div>
                <div className="h-3 bg-red-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${dti > 40 ? 'bg-red-500' : 'bg-amber-400'}`} style={{ width: `${dti}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* Model recommendation */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <h2 className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-2">Model recommendation</h2>
            <p className="text-sm font-medium text-blue-800 capitalize">{data.modelOutput?.recommendation}</p>
            <p className="text-xs text-slate-500 mt-1">PD: {data.modelOutput?.pd} · LGD: {data.modelOutput?.lgd}</p>
          </div>
        </div>

        {/* RIGHT COLUMN: Decision */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-700 mb-3">Decision</h2>
            <textarea value={justification} onChange={(e) => setJustification(e.target.value)} placeholder="Enter justification for your decision…" rows={4} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none" />
            {showCounter && (
              <div className="mt-3">
                <label className="text-xs font-medium text-slate-600 block mb-1">Counter-offer amount (£)</label>
                <input type="number" value={counterAmount} onChange={(e) => setCounterAmount(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" placeholder="e.g. 8000" />
              </div>
            )}
            <div className="flex gap-2 mt-4">
              <button onClick={() => mutation.mutate({ decision: 'approved' })} disabled={!justification.trim() || mutation.isPending} className="flex-1 bg-green-600 text-white text-sm font-semibold py-2 rounded-lg hover:bg-green-700 disabled:opacity-50">Approve</button>
              <button onClick={() => setShowCounter(!showCounter)} className="flex-1 border border-blue-300 text-blue-700 text-sm font-semibold py-2 rounded-lg hover:bg-blue-50">Counter-offer</button>
              <button onClick={() => mutation.mutate({ decision: 'declined' })} disabled={!justification.trim() || mutation.isPending} className="flex-1 bg-red-600 text-white text-sm font-semibold py-2 rounded-lg hover:bg-red-700 disabled:opacity-50">Decline</button>
            </div>
            {showCounter && counterAmount && (
              <button onClick={() => mutation.mutate({ decision: 'counter-offer', counterOffer: { amount: Number(counterAmount), rate: 8.9, term: 24 } })} disabled={!justification.trim() || !counterAmount || mutation.isPending} className="w-full mt-2 bg-blue-600 text-white text-sm font-semibold py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">
                Submit counter-offer of £{counterAmount}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
