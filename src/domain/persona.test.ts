import { describe, expect, it } from 'vitest';
import { PERSONAS, getPersona } from '../data/personas';
import { PERSONA_IDS } from './types';
import { TARGET_OUTCOME, decideForPersona, latestDocQuality, requestedTerms } from './persona';

describe('persona data', () => {
  it('has exactly the six known personas in order', () => {
    expect(PERSONAS.map((p) => p.id)).toEqual([...PERSONA_IDS]);
  });
  it('looks personas up and rejects unknown ids', () => {
    expect(getPersona('declined')?.name).toBe('Tom Baker');
    expect(getPersona('nope')).toBeUndefined();
    expect(getPersona(undefined)).toBeUndefined();
  });
  it('uses the latest attempt per document for quality', () => {
    expect(latestDocQuality(getPersona('blurry-docs')!)).toBe(0.91);
  });
});

describe('persona consistency: outcomes come from the policy engine', () => {
  for (const p of PERSONAS) {
    it(`${p.id} → ${TARGET_OUTCOME[p.id]}`, () => {
      expect(decideForPersona(p).outcome).toBe(TARGET_OUTCOME[p.id]);
    });
  }
  it('Maria gets 6.9% and €462.47 a month', () => {
    const p = getPersona('happy-path')!;
    expect(requestedTerms(p)).toEqual({ amount: 15000, aprPct: 6.9, termMonths: 36 });
    expect(decideForPersona(p).affordability.payment).toBe(462.47);
  });
  it('Lisa is offered €8,000 over 24 months at 8.9%', () => {
    expect(decideForPersona(getPersona('counter-offer')!).offer).toEqual({ amount: 8000, aprPct: 8.9, termMonths: 24 });
  });
  it('Sarah is referred on DTI only, inside (36%, 45%]', () => {
    const d = decideForPersona(getPersona('borderline-credit')!);
    expect(d.affordability.dtiAfter!).toBeGreaterThan(0.36);
    expect(d.affordability.dtiAfter!).toBeLessThanOrEqual(0.45);
    expect(d.rules.filter((r) => r.outcome === 'refer-underwriting').map((r) => r.id)).toEqual(['dti']);
  });
  it('Alex is referred on AML only', () => {
    const d = decideForPersona(getPersona('watchlist-hit')!);
    expect(d.rules.filter((r) => r.outcome && r.outcome !== 'approved').map((r) => r.id)).toEqual(['aml']);
  });
});
