import { BIAN } from '../domain/audit';
import { REVIEW_LABEL, REVIEW_TONE, type ReviewInput, type ReviewRecord } from '../domain/review';
import type { PersonaId } from '../domain/types';

const store = new Map<PersonaId, ReviewRecord[]>();

export function recordReview(personaId: PersonaId, input: ReviewInput, now = new Date()): ReviewRecord {
  const compliance = personaId === 'watchlist-hit';
  const conditions = input.action === 'approve-conditions' && input.conditions ? ` Conditions: ${input.conditions.trim()}.` : '';
  const record: ReviewRecord = {
    ...input,
    event: {
      at: now.toISOString(),
      actor: compliance ? 'Compliance officer' : 'Underwriter',
      domain: compliance ? BIAN.compliance : BIAN.loan,
      stage: 'decision',
      tone: REVIEW_TONE[input.action],
      text: `${REVIEW_LABEL[input.action]}: ${input.rationale.trim()}.${conditions}`,
    },
  };
  store.set(personaId, [...(store.get(personaId) ?? []), record]);
  return record;
}

export function listReviews(personaId: PersonaId): ReviewRecord[] {
  return store.get(personaId) ?? [];
}

export function resetReviews(): void {
  store.clear();
}
