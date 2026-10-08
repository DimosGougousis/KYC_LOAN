import { describe, expect, it } from 'vitest';
import { allCases, portfolioKpis } from './portfolio';

describe('portfolio', () => {
  it('summarises the six cases', () => {
    const k = portfolioKpis(allCases());
    expect(k.map((x) => x.value)).toEqual(['6', '4', '2', '8.5 min', '€100,000']);
  });
});
