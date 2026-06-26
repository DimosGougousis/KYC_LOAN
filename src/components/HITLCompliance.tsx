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
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-700 mb-3">Applicant</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex gap-4"><dt className="text-slate-500 w-28">Name</dt><dd className="font-medium text-slate-800">{data.applicantName}</dd></div>
              <div className="flex gap-4"><dt className="text-slate-500 w-28">Date of birth</dt><dd className="text-slate-800">{data.dob}</dd></div>
              <div className="flex gap-4"><dt className="text-slate-500 w-28">Nationality</dt><dd className="text-slate-800">{data.nationality}</dd></div>
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
              rows={5}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 resize-none"
            />
            <div className="flex gap-3 mt-4">
              <button onClick={() => mutation.mutate({ decision: 'approved' })} disabled={!justification.trim() || mutation.isPending} className="flex-1 bg-green-600 text-white font-semibold py-2.5 rounded-lg hover:bg-green-700 disabled:opacity-50">Approve</button>
              <button onClick={() => mutation.mutate({ decision: 'rejected' })} disabled={!justification.trim() || mutation.isPending} className="flex-1 bg-red-600 text-white font-semibold py-2.5 rounded-lg hover:bg-red-700 disabled:opacity-50">Reject</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}