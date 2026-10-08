import { useQuery } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { fmtEur, fmtRate } from '../domain/format';
import { apiUrl } from '../lib/api';
import { useDemo } from '../lib/demo';
import { StatusBadge } from '../ui/primitives';

const terminalStates = new Set(['approved', 'declined', 'counter-offer', 'manual-review']);

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

function Terms({ rows }: { rows: [string, ReactNode][] }) {
  return (
    <dl className="grid grid-cols-2 gap-y-1.5 rounded-lg border border-line bg-surface p-4 text-sm">
      {rows.map(([k, v]) => (
        <div key={k} className="contents">
          <dt className="text-muted">{k}</dt>
          <dd className="num text-right">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

const button = 'rounded-md px-4 py-2.5 text-sm font-medium';

export default function Decision({ workflowId }: Props) {
  const { personaId } = useDemo();
  const { data } = useQuery({
    queryKey: ['decision', workflowId],
    queryFn: async () => {
      const res = await fetch(apiUrl(`/workflow/${workflowId}/decision`));
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
  const [accepted, setAccepted] = useState<'approved' | 'declined' | null>(null);

  async function respond(accept: boolean) {
    await fetch(apiUrl(`/workflow/${workflowId}/decision/accept`), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accepted: accept }),
    });
    setAccepted(accept ? 'approved' : 'declined');
  }

  let body: ReactNode;
  if (accepted) {
    body = (
      <div className="space-y-2">
        <StatusBadge tone={accepted === 'approved' ? 'good' : 'info'} size="lg">{accepted === 'approved' ? 'Offer accepted' : 'Offer declined'}</StatusBadge>
        <p className="text-sm text-ink">{accepted === 'approved' ? 'Your account will be set up shortly.' : 'Thank you for considering our offer.'}</p>
      </div>
    );
  } else if (sub === 'approved' && details) {
    body = (
      <div className="space-y-4">
        <StatusBadge tone="good" size="lg">Approved</StatusBadge>
        <p className="text-ink">{details.message}</p>
        <Terms rows={[
          ['Amount', fmtEur(details.amount ?? 0)],
          ['Rate', `${fmtRate(details.rate ?? 0)} APR`],
          ['Term', `${details.termMonths} months`],
          ['Monthly payment', fmtEur(details.monthlyPayment ?? 0, { cents: true })],
        ]} />
        <button type="button" onClick={() => respond(true)} className={`${button} w-full bg-accent text-white hover:bg-accent/90`}>Accept offer</button>
      </div>
    );
  } else if (sub === 'counter-offer' && details) {
    body = (
      <div className="space-y-4">
        <StatusBadge tone="warn" size="lg">Counter-offer</StatusBadge>
        <p className="text-ink">{details.message}</p>
        <Terms rows={[
          ['Requested', <s key="r" className="text-muted">{fmtEur(details.originalAmount ?? 0)}</s>],
          ['Offered', fmtEur(details.offeredAmount ?? 0)],
          ['Rate', `${fmtRate(details.rate ?? 0)} APR`],
          ['Term', `${details.termMonths} months`],
          ['Monthly payment', fmtEur(details.monthlyPayment ?? 0, { cents: true })],
        ]} />
        <div className="flex gap-3">
          <button type="button" onClick={() => respond(true)} className={`${button} flex-1 bg-accent text-white hover:bg-accent/90`}>Accept</button>
          <button type="button" onClick={() => respond(false)} className={`${button} flex-1 border border-line text-ink hover:bg-wash`}>Decline</button>
        </div>
      </div>
    );
  } else if (sub === 'declined' && details) {
    body = (
      <div className="space-y-4">
        <StatusBadge tone="bad" size="lg">Declined</StatusBadge>
        <p className="text-ink">{details.message}</p>
        {details.reasons && <ul className="list-disc space-y-1 pl-5 text-sm">{details.reasons.map((r) => <li key={r}>{r}</li>)}</ul>}
        {details.canReapplyDate && <p className="text-sm text-muted">You may reapply after <span className="num text-ink">{details.canReapplyDate}</span>.</p>}
      </div>
    );
  } else if (sub === 'manual-review' && details) {
    body = (
      <div className="space-y-3">
        <StatusBadge tone="warn" size="lg">Under review</StatusBadge>
        <p className="text-ink">{details.message}</p>
        {details.estimatedWait && <p className="text-sm text-muted">Estimated wait: {details.estimatedWait}</p>}
      </div>
    );
  } else {
    body = (
      <div className="flex items-center gap-3 py-8 text-muted">
        <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-accent border-t-transparent" aria-hidden />
        Processing your application…
      </div>
    );
  }

  const done = terminalStates.has(sub);
  return (
    <div className="space-y-5 rounded-lg border border-line bg-surface p-6">
      <h2 className="font-display text-xl font-semibold text-ink">Application decision</h2>
      {body}
      {done && (
        <Link to={`/case/${personaId}`} className="inline-block text-sm font-medium text-accent underline underline-offset-4">
          See how the bank decided →
        </Link>
      )}
    </div>
  );
}
