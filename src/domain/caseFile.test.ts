import { describe, expect, it } from 'vitest';
import { buildCaseFile } from './caseFile';
import { liveSnapshot } from './live';
import { PERSONA_IDS } from './types';

const cf = (id: string) => buildCaseFile(id)!;

describe('buildCaseFile', () => {
  it('returns null for unknown personas', () => {
    expect(buildCaseFile('nope')).toBeNull();
    expect(buildCaseFile(undefined)).toBeNull();
  });
  it('builds five KPIs with computed values', () => {
    const k = cf('happy-path').kpis;
    expect(k.map((x) => x.label)).toEqual(['Requested', 'Monthly payment', 'DTI after loan', 'Credit score', 'Time to decision']);
    expect(k[1].value).toBe('€462.47');
    expect(k[2].value).toBe('15.3%');
    expect(k[3].sub).toBe('Very good');
  });
  it('flags reviewer cases', () => {
    expect(cf('watchlist-hit').needsReviewer).toBe(true);
    expect(cf('borderline-credit').needsReviewer).toBe(true);
    expect(cf('happy-path').needsReviewer).toBe(false);
  });
  it('every persona has insights, questions and a time-ordered audit trail ending in the decision stage', () => {
    for (const id of PERSONA_IDS) {
      const c = cf(id);
      expect(c.insights.length).toBeGreaterThanOrEqual(4);
      expect(c.insights.length).toBeLessThanOrEqual(7);
      expect(c.questions.length).toBeGreaterThanOrEqual(2);
      const times = c.audit.map((e) => Date.parse(e.at));
      expect([...times].sort((a, b) => a - b)).toEqual(times);
      expect(c.audit.at(-1)!.stage).toBe('decision');
    }
  });
});

describe('insights', () => {
  it('orders bad before warn before good', () => {
    const rank = { bad: 0, warn: 1, good: 2, info: 3 };
    for (const id of PERSONA_IDS) {
      const r = cf(id).insights.map((i) => rank[i.tone]);
      expect([...r].sort((a, b) => a - b)).toEqual(r);
    }
  });
  it('puts the PEP match first for Alex', () => {
    const first = cf('watchlist-hit').insights[0];
    expect(first.tag).toBe('AML');
    expect(first.tone).toBe('bad');
    expect(first.detail).toContain('0.87');
  });
  it('explains the counter-offer with computed DTIs', () => {
    const offer = cf('counter-offer').insights.find((i) => i.tag === 'OFFER')!;
    expect(offer.detail).toContain('€8,000');
    expect(offer.detail).toContain('31.4%');
    expect(offer.detail).toContain('49.1%');
  });
  it('mentions the re-upload for James', () => {
    const docs = cf('blurry-docs').insights.find((i) => i.tag === 'DOCUMENTS')!;
    expect(docs.tone).toBe('warn');
    expect(docs.detail).toContain('0.62');
    expect(docs.detail).toContain('0.94');
  });
});

describe('audit and questions use computed numbers', () => {
  it('quotes the real DTI in the affordability event', () => {
    const e = cf('borderline-credit').audit.find((x) => x.text.startsWith('Affordability'))!;
    expect(e.text).toContain('39.1%');
  });
  it('asks the underwriter about a 60-month term with its DTI', () => {
    expect(cf('borderline-credit').questions.some((q) => q.includes('60 months') && q.includes('32.4%'))).toBe(true);
  });
  it('asks compliance about the PEP match', () => {
    expect(cf('watchlist-hit').questions[0]).toContain('PEP');
  });
});

describe('liveSnapshot', () => {
  it('reveals nothing at the first stage', () => {
    const s = liveSnapshot(cf('happy-path'), 'personal-details');
    expect(s.checks.every((c) => c.status === 'pending')).toBe(true);
    expect(s.risk.label).toBe('Not assessed yet');
    expect(s.events.length).toBeGreaterThan(0);
    expect(s.events.every((e) => e.stage === 'personal-details')).toBe(true);
  });
  it('reveals check results from verification onward, newest event first, max five', () => {
    const s = liveSnapshot(cf('watchlist-hit'), 'verification');
    expect(s.checks.find((c) => c.label === 'PEP')!.status).toBe('review');
    expect(s.risk.tone).toBe('warn');
    expect(s.events.length).toBeLessThanOrEqual(5);
    expect(Date.parse(s.events[0].at)).toBeGreaterThanOrEqual(Date.parse(s.events.at(-1)!.at));
  });
  it('shows the outcome at the decision stage', () => {
    expect(liveSnapshot(cf('declined'), 'decision').risk).toEqual({ label: 'Declined', tone: 'bad' });
  });
});
