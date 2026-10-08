import type { AuditEvent, Tone } from './types';

export type ReviewAction = 'approve' | 'approve-conditions' | 'decline' | 'request-info';
export interface ReviewInput { action: ReviewAction; rationale: string; conditions?: string }
export interface ReviewRecord extends ReviewInput { event: AuditEvent }

export const REVIEW_LABEL: Record<ReviewAction, string> = {
  approve: 'Approved by reviewer',
  'approve-conditions': 'Approved with conditions',
  decline: 'Declined by reviewer',
  'request-info': 'More information requested',
};

export const REVIEW_TONE: Record<ReviewAction, Tone> = {
  approve: 'good',
  'approve-conditions': 'good',
  decline: 'bad',
  'request-info': 'warn',
};

export function validateReview(i: ReviewInput): Partial<Record<'rationale' | 'conditions', string>> {
  const errors: Partial<Record<'rationale' | 'conditions', string>> = {};
  if (i.rationale.trim().length < 10) errors.rationale = 'Give a rationale of at least 10 characters';
  if (i.action === 'approve-conditions' && !i.conditions?.trim()) errors.conditions = 'List the conditions';
  return errors;
}

export function isFinalReview(a: ReviewAction): boolean {
  return a !== 'request-info';
}
