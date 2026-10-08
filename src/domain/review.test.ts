import { describe, expect, it } from 'vitest';
import { isFinalReview, validateReview } from './review';

describe('validateReview', () => {
  it('requires a rationale of at least 10 characters', () => {
    expect(validateReview({ action: 'approve', rationale: 'short' })).toEqual({ rationale: 'Give a rationale of at least 10 characters' });
    expect(validateReview({ action: 'approve', rationale: 'Employment is stable' })).toEqual({});
  });
  it('requires conditions when approving with conditions', () => {
    expect(validateReview({ action: 'approve-conditions', rationale: 'Stable employment', conditions: ' ' }))
      .toEqual({ conditions: 'List the conditions' });
  });
  it('treats request-info as non-final', () => {
    expect(isFinalReview('request-info')).toBe(false);
    expect(isFinalReview('decline')).toBe(true);
  });
});
