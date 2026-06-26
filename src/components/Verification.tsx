import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

const checkLabels: Record<string, string> = {
  'document-quality': 'Document quality',
  'identity-verification': 'Identity verification',
  'compliance-screening': 'Compliance screening',
};

interface Props {
  workflowId: string;
  onStateChange: (state: { stage: string; sub: string }) => void;
}

export default function Verification({ workflowId, onStateChange }: Props) {
  const { data } = useQuery({
    queryKey: ['verification', workflowId],
    queryFn: async () => {
      const res = await fetch(`/workflow/${workflowId}/verification/status`);
      return res.json();
    },
    refetchInterval: (q) => {
      const sub = q.state.data?.state.sub;
      return sub === 'complete' || sub === 'rejected' ? false : 1000;
    },
  });

  useEffect(() => {
    if (data?.state.sub === 'complete') {
      onStateChange({ stage: 'product-selection', sub: 'selecting' });
    }
  }, [data?.state.sub]);

  const sub = data?.state.sub ?? 'checking';

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-bold text-slate-800">Verifying your identity</h2>
        <p className="text-sm text-slate-500 mt-1">This usually takes less than a minute.</p>
      </div>

      {data?.checks?.length > 0 && (
        <ul className="space-y-4">
          {data.checks.map((c: any, i: number) => (
            <li key={i} className="flex items-start gap-3">
              <div className="mt-0.5 shrink-0 w-5 text-center">
                {c.status === 'passed' && <span className="text-green-500 font-bold">✓</span>}
                {c.status === 'failed' && <span className="text-red-500 font-bold">✗</span>}
                {c.status === 'in-progress' && <span className="inline-block w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />}
                {(c.status === 'waiting' || c.status === 'pending-review') && <span className="inline-block w-4 h-4 rounded-full border-2 border-slate-300" />}
              </div>
              <div>
                <p className={`text-sm font-medium ${c.status === 'passed' ? 'text-slate-700' : c.status === 'failed' ? 'text-red-700' : 'text-slate-500'}`}>
                  {checkLabels[c.type] ?? c.type}
                </p>
                {c.detail && <p className="text-xs text-slate-400 mt-0.5">{c.detail}</p>}
              </div>
            </li>
          ))}
        </ul>
      )}

      {sub === 'checking' && (
        <div className="text-center py-4">
          <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-500 mt-3">Checking your documents…</p>
        </div>
      )}

      {sub === 'issues' && data?.documents && (
        <div className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm font-semibold text-yellow-800 mb-1">⚠ Action required</p>
            <p className="text-sm text-yellow-700">One or more documents need attention. Please re-upload a clearer version.</p>
          </div>
          {data.documents.map((d: any) => (
            <div key={d.documentId}>
              <p className="text-xs font-medium text-slate-600 mb-2 uppercase tracking-wide">{d.type?.replace(/-/g, ' ')}</p>
              {d.confidence != null && (
                <p className="text-xs text-slate-500 mb-2">
                  Confidence: {Math.round(d.confidence * 100)}% — below our threshold
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {sub === 'manual-review' && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center space-y-3">
          <div className="text-3xl">🔍</div>
          <h3 className="font-semibold text-blue-800">Your application is under review</h3>
          <p className="text-sm text-slate-600">
            Our compliance team is reviewing your application.{data?.estimatedWait && ` This usually takes ${data.estimatedWait}.`}
          </p>
          <p className="text-sm text-slate-500">We'll send you an email when we have an update.</p>
        </div>
      )}
    </div>
  );
}