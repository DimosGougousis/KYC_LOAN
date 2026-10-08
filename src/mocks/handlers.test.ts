import { describe, expect, it } from 'vitest';
import type { ReviewRecord } from '../domain/review';
import { api } from '../lib/api';
import { writePersonaId } from '../lib/storage';

type Json = any;

async function poll(path: string, times = 3): Promise<Json> {
  let r: Json;
  for (let i = 0; i < times; i++) r = await api<Json>(path);
  return r;
}

describe('wizard endpoints derive from the policy engine', () => {
  it('unknown workflow ids start at personal details', async () => {
    const r = await api<Json>('/workflow/does-not-exist/state');
    expect(r.state).toEqual({ stage: 'personal-details', sub: 'editing' });
  });
  it('counter-offer persona gets the computed offer', async () => {
    writePersonaId('counter-offer');
    const r = await poll('/workflow/wf-1/decision');
    expect(r.decision).toBe('counter-offer');
    expect(r.details).toMatchObject({ originalAmount: 15000, offeredAmount: 8000, rate: 8.9, termMonths: 24, monthlyPayment: 365.11 });
  });
  it('happy path gets the computed payment', async () => {
    writePersonaId('happy-path');
    const r = await poll('/workflow/wf-2/decision');
    expect(r.details).toMatchObject({ amount: 15000, rate: 6.9, termMonths: 36, monthlyPayment: 462.47 });
  });
  it('declined persona gets reasons from fired rules', async () => {
    writePersonaId('declined');
    const r = await poll('/workflow/wf-3/decision');
    expect(r.decision).toBe('declined');
    expect(r.details.reasons).toContain('Credit score 540 is below the 580 minimum');
  });
  it('underwriting referral becomes manual review', async () => {
    writePersonaId('borderline-credit');
    expect((await poll('/workflow/wf-4/decision')).decision).toBe('manual-review');
  });
  it('compliance persona stops verification in manual review', async () => {
    writePersonaId('watchlist-hit');
    expect((await poll('/workflow/wf-5/verification/status')).state.sub).toBe('manual-review');
  });
  it('blurry-docs persona reports a document issue until re-upload', async () => {
    writePersonaId('blurry-docs');
    const r = await poll('/workflow/wf-6/verification/status');
    expect(r.state.sub).toBe('issues');
    expect(r.documents[0].confidence).toBe(0.62);
    await api('/workflow/wf-6/verification/resubmit', { method: 'POST', body: '{}' });
    expect((await api<Json>('/workflow/wf-6/verification/status')).state.sub).toBe('complete');
  });
});

describe('reviews and reset', () => {
  it('records a review as an audit event and lists it', async () => {
    const rec = await api<ReviewRecord>('/case/watchlist-hit/review', {
      method: 'POST', body: JSON.stringify({ action: 'approve', rationale: 'Different person: DOB differs by 3 years' }),
    });
    expect(rec.event.actor).toBe('Compliance officer');
    expect(rec.event.stage).toBe('decision');
    expect(await api<ReviewRecord[]>('/case/watchlist-hit/reviews')).toHaveLength(1);
  });
  it('rejects an invalid review', async () => {
    await expect(api('/case/borderline-credit/review', { method: 'POST', body: JSON.stringify({ action: 'approve', rationale: 'ok' }) }))
      .rejects.toThrow('400');
  });
  it('reset clears reviews', async () => {
    await api('/case/borderline-credit/review', { method: 'POST', body: JSON.stringify({ action: 'decline', rationale: 'Margin too thin for this term' }) });
    await api('/demo/reset', { method: 'POST' });
    expect(await api<ReviewRecord[]>('/case/borderline-credit/reviews')).toEqual([]);
  });
});
