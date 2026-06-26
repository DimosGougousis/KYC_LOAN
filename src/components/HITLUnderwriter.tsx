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

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-blue-800 text-white px-6 py-4">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs text-blue-300 uppercase tracking-wide font-medium">Manual Underwriting</p>
          <h1 className="text-xl font-bold mt-0.5">Loan Application Review</h1>
        </div>
      </header>
      <div className="max-w-5xl mx-auto p-6 grid grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-700 mb-3">Loan request — {data.applicantName}</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex gap-4"><dt className="text-slate-500 w-32">Amount</dt><dd className="font-bold text-slate-800">£{data.loanRequest?.amount?.toLocaleString()}</dd></div>
              <div className="flex gap-4"><dt className="text-slate-500 w-32">Term</dt><dd className="text-slate-800">{data.loanRequest?.term} months</dd></div>
            </dl>
          </div>
        </div>
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-700 mb-3">Decision</h2>
            <textarea
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              placeholder="Enter justification for your decision…"
              rows={4}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none"
            />
            {showCounter && (
              <div className="mt-3">
                <label className="text-xs font-medium text-slate-600 block mb-1">Counter-offer amount (£)</label>
                <input type="number" value={counterAmount} onChange={(e) => setCounterAmount(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" placeholder="e.g. 8000" />
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