import { describe, expect, it } from 'vitest';
import { fmtEur, fmtPct, fmtRate, fmtScore, fmtTime, round2 } from './format';
import { isPersonaId } from './types';

describe('format', () => {
  it('formats euros without and with cents', () => {
    expect(fmtEur(15000)).toBe('€15,000');
    expect(fmtEur(462.466, { cents: true })).toBe('€462.47');
    expect(fmtEur(-69.4)).toBe('−€69');
  });
  it('formats ratios as percentages', () => {
    expect(fmtPct(0.15287)).toBe('15.3%');
    expect(fmtPct(0.4914, 2)).toBe('49.14%');
  });
  it('formats APR, scores and UTC timestamps', () => {
    expect(fmtRate(6.9)).toBe('6.9%');
    expect(fmtScore(0.6)).toBe('0.60');
    expect(fmtTime('2026-10-06T10:08:00Z')).toBe('06 Oct 2026, 10:08');
  });
  it('rounds to cents', () => {
    expect(round2(1.005)).toBe(1.01);
    expect(round2(2.344)).toBe(2.34);
  });
  it('recognises persona ids', () => {
    expect(isPersonaId('watchlist-hit')).toBe(true);
    expect(isPersonaId('foo')).toBe(false);
    expect(isPersonaId(null)).toBe(false);
  });
});
