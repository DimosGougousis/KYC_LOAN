import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

const terminalStates = new Set(['approved', 'declined', 'counter-offer']);

interface Props {
  workflowId: string;
  onStateChange: (state: { stage: string; sub: string }) => void;
}

interface DecisionDetails {
  message: string;
  amount?: number;
  rate?: number;
  termMonths?: number;
  monthlyPayment?: number;
  currency?: string;
  originalAmount?: number;
  offeredAmount?: number;
  reasons?: string[];
  canReapplyDate?: string;
  reviewId?: string;
  estimatedWait?: string;
}

export default function Decision({ workflowId }: Props) {
  const { data } = useQuery({
    queryKey: ['decision', workflowId],
    queryFn: async () => {
      const res = await fetch(`/workflow/${workflowId}/decision`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    },
    refetchInterval: (q) => {
      const sub = q.state.data?.state.sub;
      return sub && terminalStates.has(sub) ? false : 1000;
    },
    enabled: !!workflowId,
  });

  const sub = data?.state.sub ?? 'processing';
  const details = data?.details as DecisionDetails | undefined;
  const [accepted, setAccepted] = useState<string | null>(null);

  async function handleAccept() {
    await fetch(`/workflow/${workflowId}/decision/accept`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accepted: true }),
    });
    setAccepted('approved');
  }

  async function handleDecline() {
    await fetch(`/workflow/${workflowId}/decision/accept`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accepted: false }),
    });
    setAccepted('declined');
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-800 mb-6">Application decision</h2>

        {accepted ? (
          <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
            <div className="text-4xl">{accepted === 'approved' ? '🎉' : '👋'}</div>
            <h2 className="text-xl font-bold text-green-800 mt-2">
              {accepted === 'approved' ? 'Offer accepted!' : 'Offer declined'}
            </h2>
            <p className="text-sm text-slate-500 mt-2">
              {accepted === 'approved' ? 'Your account will be set up shortly.' : 'Thank you for considering our offer.'}
            </p>
          </div>
        ) : sub === 'approved' && details ? (
          <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center space-y-4">
            <div className="text-4xl">🎉</div>
            <h2 className="text-xl font-bold text-green-800">{details.message}</h2>
            <div className="bg-white border border-green-100 rounded-lg p-4 space-y-1 text-sm">
              <p><span className="text-slate-500">Amount:</span> <strong>€{details.amount?.toLocaleString()}</strong></p>
              <p><span className="text-slate-500">Rate:</span> <strong>{details.rate}% APR</strong></p>
              <p><span className="text-slate-500">Term:</span> <strong>{details.termMonths} months</strong></p>
              <p><span className="text-slate-500">Monthly payment:</span> <strong>€{details.monthlyPayment}</strong></p>
            </div>
            <button onClick={handleAccept} className="w-full bg-green-600 text-white font-semibold py-3 rounded-lg hover:bg-green-700 transition-colors">Accept offer</button>
          </div>
        ) : sub === 'declined' && details ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 space-y-4">
            <h2 className="text-xl font-bold text-red-800">Application outcome</h2>
            <p className="text-slate-700">{details.message}</p>
            {details.reasons && (
              <ul className="list-disc list-inside space-y-1 text-sm text-slate-600">
                {details.reasons.map((r) => <li key={r}>{r}</li>)}
              </ul>
            )}
            {details.canReapplyDate && (
              <p className="text-sm text-slate-500">You may reapply after: <strong>{details.canReapplyDate}</strong></p>
            )}
          </div>
        ) : sub === 'counter-offer' && details ? (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 space-y-4">
            <h2 className="text-xl font-bold text-blue-800">We have an offer for you</h2>
            <p className="text-slate-700">{details.message}</p>
            <div className="bg-white border border-blue-100 rounded-lg p-4 space-y-1 text-sm">
              <p><span className="text-slate-500">Offered amount:</span> <strong>€{details.offeredAmount?.toLocaleString()}</strong></p>
              <p><span className="text-slate-500">Rate:</span> <strong>{details.rate}% APR</strong></p>
              <p><span className="text-slate-500">Term:</span> <strong>{details.termMonths} months</strong></p>
              <p><span className="text-slate-500">Monthly payment:</span> <strong>€{details.monthlyPayment}</strong></p>
            </div>
            <div className="flex gap-3">
              <button onClick={handleAccept} className="flex-1 bg-blue-600 text-white font-semibold py-2.5 rounded-lg hover:bg-blue-700">Accept</button>
              <button onClick={handleDecline} className="flex-1 border border-slate-300 text-slate-700 font-semibold py-2.5 rounded-lg hover:bg-slate-50">Decline</button>
            </div>
          </div>
        ) : sub === 'manual-review' && details ? (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 space-y-4 text-center">
            <div className="text-4xl">⏳</div>
            <h2 className="text-xl font-bold text-amber-800">Under review</h2>
            <p className="text-slate-700">{details.message}</p>
            {details.estimatedWait && <p className="text-sm text-slate-500">Estimated wait: <strong>{details.estimatedWait}</strong></p>}
          </div>
        ) : (
          <div className="text-center py-12 space-y-4">
            <div className="inline-block w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-600">Processing your application…</p>
          </div>
        )}
      </div>
    </div>
  );
}