import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import { REVIEW_LABEL, validateReview, type ReviewAction, type ReviewInput, type ReviewRecord } from '../../domain/review';
import type { PersonaId } from '../../domain/types';
import { api } from '../../lib/api';
import { Panel } from '../../ui/primitives';

const ACTIONS: { id: ReviewAction; label: string }[] = [
  { id: 'approve', label: 'Approve' },
  { id: 'approve-conditions', label: 'Approve with conditions' },
  { id: 'decline', label: 'Decline' },
  { id: 'request-info', label: 'Request more information' },
];

const field = 'rounded-md border border-line px-3 py-2 text-sm focus:ring-2 focus:ring-accent/30 focus:outline-none';

export function ReviewerPanel({ personaId, role }: { personaId: PersonaId; role: string }) {
  const qc = useQueryClient();
  const [action, setAction] = useState<ReviewAction>('approve');
  const [rationale, setRationale] = useState('');
  const [conditions, setConditions] = useState('');
  const [errors, setErrors] = useState<ReturnType<typeof validateReview>>({});
  const m = useMutation({
    mutationFn: (input: ReviewInput) => api<ReviewRecord>(`/case/${personaId}/review`, { method: 'POST', body: JSON.stringify(input) }),
    onSuccess: () => {
      setRationale('');
      setConditions('');
      return qc.invalidateQueries({ queryKey: ['reviews', personaId] });
    },
  });

  function submit(e: FormEvent) {
    e.preventDefault();
    const input: ReviewInput = { action, rationale, conditions: action === 'approve-conditions' ? conditions : undefined };
    const v = validateReview(input);
    setErrors(v);
    if (!Object.keys(v).length) m.mutate(input);
  }

  return (
    <section aria-label="Reviewer decision" className="mt-6">
      <Panel className="border-accent p-5">
        <p className="font-mono text-[11px] tracking-[0.12em] text-accent uppercase">{role} · your decision</p>
        <form onSubmit={submit} className="mt-3 space-y-4">
          <fieldset className="flex flex-wrap gap-2">
            <legend className="sr-only">Action</legend>
            {ACTIONS.map((a) => (
              <label
                key={a.id}
                className={`cursor-pointer rounded-full border px-3 py-1.5 text-sm has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-accent/40 ${action === a.id ? 'border-accent bg-accent-soft text-accent' : 'border-line'}`}
              >
                <input type="radio" name="action" value={a.id} checked={action === a.id} onChange={() => setAction(a.id)} className="sr-only" />
                {a.label}
              </label>
            ))}
          </fieldset>
          <div className="flex flex-col gap-1">
            <label htmlFor="rationale" className="text-sm">Rationale</label>
            <textarea id="rationale" rows={3} value={rationale} onChange={(e) => setRationale(e.target.value)} className={field} />
            {errors.rationale && <p role="alert" className="text-xs text-bad">{errors.rationale}</p>}
          </div>
          {action === 'approve-conditions' && (
            <div className="flex flex-col gap-1">
              <label htmlFor="conditions" className="text-sm">Conditions</label>
              <input id="conditions" value={conditions} onChange={(e) => setConditions(e.target.value)} className={field} />
              {errors.conditions && <p role="alert" className="text-xs text-bad">{errors.conditions}</p>}
            </div>
          )}
          {m.isError && <p role="alert" className="text-sm text-bad">Could not record the decision. Try again.</p>}
          <div className="flex flex-wrap items-center gap-3">
            <button type="submit" disabled={m.isPending} className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90 disabled:opacity-60">
              {m.isPending ? 'Recording…' : 'Record decision'}
            </button>
            <p className="text-xs text-muted">Recorded as “{REVIEW_LABEL[action]}” in the audit trail.</p>
          </div>
        </form>
      </Panel>
    </section>
  );
}
