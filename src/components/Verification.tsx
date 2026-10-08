import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import type { Tone } from '../domain/types';
import { apiUrl } from '../lib/api';
import { useDemo } from '../lib/demo';
import { StatusBadge } from '../ui/primitives';

const checkLabels: Record<string, string> = {
  'document-quality': 'Document quality',
  'identity-verification': 'Identity verification',
  'compliance-screening': 'Compliance screening',
};

const STATUS: Record<string, { tone: Tone; text: string }> = {
  passed: { tone: 'good', text: 'Pass' },
  failed: { tone: 'bad', text: 'Fail' },
  'in-progress': { tone: 'info', text: 'Checking' },
  waiting: { tone: 'info', text: 'Waiting' },
  'pending-review': { tone: 'warn', text: 'Review' },
};

interface Check { type: string; status: string; detail: string | null }
interface Doc { documentId: string; type: string; confidence: number | null }
interface StatusResponse {
  state: { stage: string; sub: string };
  checks?: Check[];
  documents?: Doc[];
  estimatedWait?: string;
}

interface Props {
  workflowId: string;
  onStateChange: (state: { stage: string; sub: string }) => void;
}

export default function Verification({ workflowId, onStateChange }: Props) {
  const { personaId } = useDemo();
  const [uploading, setUploading] = useState(false);
  const { data } = useQuery({
    queryKey: ['verification', workflowId],
    queryFn: async (): Promise<StatusResponse> => {
      const res = await fetch(apiUrl(`/workflow/${workflowId}/verification/status`));
      return res.json();
    },
    refetchInterval: (q) => {
      const sub = q.state.data?.state.sub;
      return sub === 'complete' || sub === 'rejected' || sub === 'manual-review' ? false : 1000;
    },
  });

  const sub = data?.state.sub ?? 'checking';

  useEffect(() => {
    if (sub === 'complete') onStateChange({ stage: 'product-selection', sub: 'selecting' });
  }, [sub, onStateChange]);

  async function reupload() {
    setUploading(true);
    try {
      await fetch(apiUrl(`/workflow/${workflowId}/verification/resubmit`), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-6 rounded-lg border border-line bg-surface p-6">
      <div>
        <h2 className="font-display text-[22px] font-semibold text-ink">Verifying your identity</h2>
        <p className="mt-1 text-sm text-muted">This usually takes less than a minute.</p>
      </div>

      {(data?.checks?.length ?? 0) > 0 && (
        <ul className="divide-y divide-line">
          {data!.checks!.map((c) => {
            const st = STATUS[c.status] ?? { tone: 'info' as Tone, text: c.status };
            return (
              <li key={c.type} className="flex items-start justify-between gap-3 py-3">
                <div>
                  <p className="text-sm font-medium text-ink">{checkLabels[c.type] ?? c.type}</p>
                  {c.detail && <p className="mt-0.5 text-xs text-muted">{c.detail}</p>}
                </div>
                <StatusBadge tone={st.tone}>{st.text}</StatusBadge>
              </li>
            );
          })}
        </ul>
      )}

      {sub === 'checking' && (
        <div className="flex items-center gap-3 text-sm text-muted">
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-accent border-t-transparent" aria-hidden />
          Checking your documents…
        </div>
      )}

      {sub === 'issues' && data?.documents && (
        <div className="space-y-4 rounded-lg border border-warn/30 bg-warn-soft p-4">
          <p className="text-sm font-semibold text-warn">Action required</p>
          {data.documents.map((d) => (
            <div key={d.documentId} className="space-y-3">
              <p className="text-sm text-ink">
                Your {d.type.replace(/-/g, ' ')} scan is hard to read
                {d.confidence != null && <> (confidence {Math.round(d.confidence * 100)}% — below our threshold)</>}.
              </p>
              <button
                type="button"
                onClick={reupload}
                disabled={uploading}
                className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90 disabled:opacity-60"
              >
                {uploading ? 'Uploading…' : `Re-upload ${d.type.replace(/-/g, ' ')}`}
              </button>
            </div>
          ))}
        </div>
      )}

      {sub === 'manual-review' && (
        <div className="space-y-3 rounded-lg border border-warn/30 bg-warn-soft p-5">
          <h3 className="font-display text-lg font-semibold text-ink">Your application is under review</h3>
          <p className="text-sm text-ink">
            Our compliance team is reviewing your application.{data?.estimatedWait && ` This usually takes ${data.estimatedWait}.`} We'll email you when we
            have an update.
          </p>
          <Link to={`/case/${personaId}`} className="inline-block text-sm font-medium text-accent underline underline-offset-4">
            See what the compliance officer sees →
          </Link>
        </div>
      )}
    </div>
  );
}
