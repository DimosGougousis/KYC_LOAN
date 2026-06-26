import { useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useState } from 'react';

export default function HITLCompliance() {
  const { reviewId } = useParams<{ reviewId: string }>();
  const [justification, setJustification] = useState('');
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
    mutationFn: async ({ decision }: { decision: string }) => {
      const res = await fetch(`/workflow/wf-current/review/${reviewId}/decision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision, justification, reviewerId: 'officer-001' }),
      });
      return res.json();
    },
    onSuccess: () => setDone(true),
  });

  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" /></div>;

  if (done) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center max-w-sm">
        <div className="text-4xl mb-4">✓</div>
        <h2 className="text-xl font-bold text-slate-800">Decision recorded</h2>
        <p className="text-sm text-slate-500 mt-2">The applicant will be notified. The workflow will continue.</p>
      </div>
    </div>
  );

  if (!data) return null;

  const riskLevel = (score: number) => {
    if (score > 60) return { bar: 'bg-red-500', badge: 'bg-red-100 text-red-700 border-red-200', label: 'High' };
    if (score > 20) return { bar: 'bg-amber-400', badge: 'bg-amber-100 text-amber-700 border-amber-200', label: 'Medium' };
    if (score > 0) return { bar: 'bg-yellow-300', badge: 'bg-yellow-50 text-yellow-700 border-yellow-200', label: 'Low' };
    return { bar: 'bg-green-400', badge: 'bg-green-100 text-green-700 border-green-200', label: 'None' };
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-amber-700 text-white px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <p className="text-xs text-amber-200 uppercase tracking-wide font-medium">Compliance Review</p>
            <h1 className="text-xl font-bold mt-0.5">Manual KYC/AML Review</h1>
          </div>
          {data.slaDeadline && (
            <div className="text-right text-sm">
              <p className="text-amber-200">SLA deadline</p>
              <p className="font-semibold">{new Date(data.slaDeadline).toLocaleTimeString()}</p>
            </div>
          )}
        </div>
      </header>

      <div className="max-w-5xl mx-auto p-6 grid grid-cols-2 gap-6">
        {/* LEFT COLUMN */}
        <div className="space-y-4">
          {/* Applicant card */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-700 mb-3">Applicant</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex gap-4"><dt className="text-slate-500 w-28">Name</dt><dd className="font-medium text-slate-800">{data.applicantName}</dd></div>
              <div className="flex gap-4"><dt className="text-slate-500 w-28">Date of birth</dt><dd className="text-slate-800">{data.dob}</dd></div>
              <div className="flex gap-4"><dt className="text-slate-500 w-28">Nationality</dt><dd className="text-slate-800">{data.nationality}</dd></div>
            </dl>
          </div>

          {/* Watchlist matches */}
          {data.watchlistMatches?.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-slate-700 mb-3">Watchlist matches</h2>
              {data.watchlistMatches.map((m: any, i: number) => (
                <div key={i} className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-1">
                  <p className="text-xs font-bold text-red-700 uppercase">{m.list} match — {Math.round(m.similarity * 100)}% similarity</p>
                  <p className="text-sm text-slate-700 font-medium">{m.matchName}</p>
                  <p className="text-xs text-slate-500">{m.role} · {m.jurisdiction}</p>
                </div>
              ))}
            </div>
          )}

          {/* Risk breakdown */}
          {data.riskBreakdown && (
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-slate-700 mb-4">Risk breakdown</h2>
              <div className="space-y-4">
                {Object.entries(data.riskBreakdown as Record<string, any>).map(([key, r]) => {
                  const { bar, badge, label } = riskLevel(r.score);
                  return (
                    <div key={key} className="border border-slate-100 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-slate-800">{r.label}</span>
                          <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded border ${badge}`}>{label}</span>
                        </div>
                        <span className="text-lg font-black" style={{ color: r.score > 60 ? '#dc2626' : r.score > 20 ? '#f59e0b' : r.score > 0 ? '#ca8a04' : '#16a34a' }}>{r.score}</span>
                      </div>
                      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden mb-3">
                        <div className={`h-full rounded-full transition-all ${bar}`} style={{ width: `${r.score}%` }} />
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed mb-2">{r.description}</p>
                      <a href={r.sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                        View source: {r.sourceName}
                      </a>
                      <p className="text-[10px] text-slate-400 mt-1">Triggered {new Date(r.triggeredAt).toLocaleString()}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Decision */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-700 mb-3">Decision</h2>
            <p className="text-xs text-slate-500 mb-3">Justification is required for audit trail.</p>
            <textarea value={justification} onChange={(e) => setJustification(e.target.value)} placeholder="Enter justification for your decision…" rows={5} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 resize-none" />
            <div className="flex gap-3 mt-4">
              <button onClick={() => mutation.mutate({ decision: 'approved' })} disabled={!justification.trim() || mutation.isPending} className="flex-1 bg-green-600 text-white font-semibold py-2.5 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors">Approve</button>
              <button onClick={() => mutation.mutate({ decision: 'rejected' })} disabled={!justification.trim() || mutation.isPending} className="flex-1 bg-red-600 text-white font-semibold py-2.5 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors">Reject</button>
              <button onClick={() => mutation.mutate({ decision: 'request-info' })} disabled={!justification.trim() || mutation.isPending} className="flex-1 border border-slate-300 text-slate-700 font-semibold py-2.5 rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-colors">Request info</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
