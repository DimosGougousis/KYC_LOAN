import { afterEach, describe, expect, it, vi } from 'vitest';
import { readPersonaId, writePersonaId } from './storage';

afterEach(() => vi.restoreAllMocks());

describe('persona storage', () => {
  it('defaults to happy-path', () => expect(readPersonaId()).toBe('happy-path'));
  it('round-trips a valid id under the legacy key', () => {
    writePersonaId('declined');
    expect(localStorage.getItem('demoPersona')).toBe('declined');
    expect(readPersonaId()).toBe('declined');
  });
  it('ignores unknown stored values', () => {
    localStorage.setItem('demoPersona', 'blah');
    expect(readPersonaId()).toBe('happy-path');
  });
  it('falls back to memory when localStorage throws', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('quota'); });
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('denied'); });
    expect(() => writePersonaId('counter-offer')).not.toThrow();
    expect(readPersonaId()).toBe('counter-offer');
  });
});
