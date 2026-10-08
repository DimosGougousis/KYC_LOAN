import { http, HttpResponse } from 'msw';
import { buildCaseFile } from '../domain/caseFile';
import { fmtEur, fmtRate } from '../domain/format';
import { POLICY } from '../domain/policy';
import { validateReview, type ReviewInput } from '../domain/review';
import { isPersonaId } from '../domain/types';
import { readPersonaId } from '../lib/storage';
import { listReviews, recordReview, resetReviews } from './reviewStore';

interface WfState { stage: string; sub: string }

const workflowCache = new Map<string, WfState>();
const verificationCounts = new Map<string, number>();
const decisionCounts = new Map<string, number>();
const resubmitted = new Set<string>();

export function resetMockState(): void {
  workflowCache.clear();
  verificationCounts.clear();
  decisionCounts.clear();
  resubmitted.clear();
  resetReviews();
}

function currentCase() {
  return buildCaseFile(readPersonaId())!;
}

function bump(counts: Map<string, number>, id: string): number {
  const n = (counts.get(id) ?? 0) + 1;
  counts.set(id, n);
  return n;
}

export const handlers = [
  // --- Workflow ---
  http.post('/workflow', () => {
    const workflowId = `wf-${Date.now()}`;
    const state = { stage: 'personal-details', sub: 'editing' };
    workflowCache.set(workflowId, state);
    return HttpResponse.json({ workflowId, correlationId: workflowId, state, nextStep: 'personal-details' });
  }),

  http.get('/workflow/:id/state', ({ params }) => {
    const state = workflowCache.get(params.id as string) ?? { stage: 'personal-details', sub: 'editing' };
    return HttpResponse.json({ state, checkpoint: null, expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString() });
  }),

  // --- Personal details ---
  http.put('/workflow/:id/personal-details', () =>
    HttpResponse.json({
      state: { stage: 'verification', sub: 'checking' },
      documentAssessments: [
        { documentId: 'doc-001', type: 'passport', status: 'processing' },
        { documentId: 'doc-002', type: 'proof-of-address', status: 'processing' },
      ],
    })),

  // --- Verification: results come from the persona's documents and checks ---
  http.get('/workflow/:id/verification/status', ({ params }) => {
    const id = params.id as string;
    const count = bump(verificationCounts, id);
    if (count < 3) {
      return HttpResponse.json({
        state: { stage: 'verification', sub: 'checking' },
        checks: [
          { type: 'document-quality', status: 'in-progress', detail: null },
          { type: 'identity-verification', status: 'waiting', detail: null },
          { type: 'compliance-screening', status: 'waiting', detail: null },
        ],
      });
    }

    const cf = currentCase();
    const failedDoc = cf.persona.documents.find((d) => d.quality < POLICY.docQualityMin);
    if (failedDoc && !resubmitted.has(id)) {
      return HttpResponse.json({
        state: { stage: 'verification', sub: 'issues' },
        checks: [
          { type: 'document-quality', status: 'failed', detail: 'Low confidence scan — please re-upload a clearer image' },
          { type: 'identity-verification', status: 'waiting', detail: null },
          { type: 'compliance-screening', status: 'waiting', detail: null },
        ],
        documents: [{ documentId: 'doc-001', type: failedDoc.doc, status: 'needs-resubmit', confidence: failedDoc.quality, reason: 'Low quality scan' }],
      });
    }

    const review = cf.persona.checks.find((c) => c.result === 'review');
    if (review) {
      return HttpResponse.json({
        state: { stage: 'verification', sub: 'manual-review' },
        checks: [
          { type: 'document-quality', status: 'passed', detail: 'Documents clear' },
          { type: 'identity-verification', status: 'passed', detail: 'Identity confirmed' },
          { type: 'compliance-screening', status: 'pending-review', detail: `${review.label}: manual review required` },
        ],
        reviewId: cf.persona.applicationId,
        estimatedWait: '2-4 hours',
      });
    }

    return HttpResponse.json({
      state: { stage: 'verification', sub: 'complete' },
      checks: [
        { type: 'document-quality', status: 'passed', detail: 'All documents clear' },
        { type: 'identity-verification', status: 'passed', detail: 'Identity confirmed' },
        { type: 'compliance-screening', status: 'passed', detail: 'No flags' },
      ],
    });
  }),

  http.post('/workflow/:id/verification/resubmit', ({ params }) => {
    resubmitted.add(params.id as string);
    return HttpResponse.json({ documentAssessment: { documentId: 'doc-003', type: 'passport', status: 'processing', confidence: null } });
  }),

  // --- Products / financials / submit ---
  http.put('/workflow/:id/products', () =>
    HttpResponse.json({
      state: { stage: 'financial-details', sub: 'editing' },
      productConfirmations: [{ type: 'current-account', status: 'reserved', accountNumber: null }],
    })),

  http.put('/workflow/:id/financial-details', () => HttpResponse.json({ state: { stage: 'review-submit', sub: 'reviewing' } })),

  http.post('/workflow/:id/submit', () =>
    HttpResponse.json({ state: { stage: 'decision', sub: 'processing' }, underwritingId: `uw-${Date.now()}` })),

  // --- Decision: mapped from the policy engine's decision for the persona ---
  http.get('/workflow/:id/decision', ({ params }) => {
    if (bump(decisionCounts, params.id as string) < 3) {
      return HttpResponse.json({ state: { stage: 'decision', sub: 'processing' }, decision: null });
    }
    const cf = currentCase();
    const d = cf.decision;
    switch (d.outcome) {
      case 'approved':
        return HttpResponse.json({
          state: { stage: 'decision', sub: 'approved' },
          decision: 'approved',
          details: {
            amount: d.requested.amount, rate: d.requested.aprPct, termMonths: d.requested.termMonths,
            monthlyPayment: d.affordability.payment, currency: 'EUR',
            message: 'Congratulations! Your application has been approved.',
          },
        });
      case 'counter-offer':
        return HttpResponse.json({
          state: { stage: 'decision', sub: 'counter-offer' },
          decision: 'counter-offer',
          details: {
            originalAmount: d.requested.amount, offeredAmount: d.offer!.amount, rate: d.offer!.aprPct,
            termMonths: d.offer!.termMonths, monthlyPayment: d.offerAffordability!.payment, currency: 'EUR',
            message: `We can offer you ${fmtEur(d.offer!.amount)} at ${fmtRate(d.offer!.aprPct)} over ${d.offer!.termMonths} months instead.`,
          },
        });
      case 'declined':
        return HttpResponse.json({
          state: { stage: 'decision', sub: 'declined' },
          decision: 'declined',
          details: {
            message: "We're unable to offer you a loan right now.",
            reasons: d.rules.filter((r) => r.outcome === 'declined').map((r) => r.text),
            canReapplyDate: new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0],
          },
        });
      default:
        return HttpResponse.json({
          state: { stage: 'decision', sub: 'manual-review' },
          decision: 'manual-review',
          details: {
            message: 'Your application needs a specialist review. We will notify you within 2 business days.',
            reviewId: cf.persona.applicationId,
            estimatedWait: '1-2 business days',
          },
        });
    }
  }),

  http.post('/workflow/:id/decision/accept', async ({ request }) => {
    const body = (await request.json()) as { accepted?: boolean };
    return HttpResponse.json({
      state: { stage: 'decision', sub: body.accepted ? 'approved' : 'declined' },
      accountDetails: body.accepted ? { accountNumber: '12345678', sortCode: '20-00-00' } : null,
      nextSteps: body.accepted ? ['Set up online banking', 'Download the app'] : null,
    });
  }),

  // --- Reviewer decisions (HITL) ---
  http.get('/case/:personaId/reviews', ({ params }) => {
    const id = params.personaId as string;
    return isPersonaId(id) ? HttpResponse.json(listReviews(id)) : HttpResponse.json({ error: 'Unknown persona' }, { status: 404 });
  }),

  http.post('/case/:personaId/review', async ({ params, request }) => {
    const id = params.personaId as string;
    if (!isPersonaId(id)) return HttpResponse.json({ error: 'Unknown persona' }, { status: 404 });
    const input = (await request.json()) as ReviewInput;
    const errors = validateReview(input);
    if (Object.keys(errors).length) return HttpResponse.json({ errors }, { status: 400 });
    return HttpResponse.json(recordReview(id, input));
  }),

  http.post('/demo/reset', () => {
    resetMockState();
    return HttpResponse.json({ ok: true });
  }),
];
