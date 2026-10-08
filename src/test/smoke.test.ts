import { describe, expect, it } from 'vitest';

describe('test tooling', () => {
  it('runs in jsdom', () => {
    expect(typeof window.document).toBe('object');
    expect(window.location.origin).toBe('http://localhost:3000');
  });
});
