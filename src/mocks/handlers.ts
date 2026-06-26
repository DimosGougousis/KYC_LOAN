import { http, HttpResponse } from 'msw';

const workflowCache = new Map<string, any>();
const verificationCounts = new Map<string, number>();
const decisionCounts = new Map<string, number>();

function getPersona(): string {
  return localStorage.getItem('demoPersona') ?? 'happy-path';
}

// --- Workflow creation ---
export const handlers = [
  http.post('/workflow', async () => {
    const wfId = `wf-${Date.now()}`;
    const state = { stage: 'personal-details', sub: 'editing' };
    workflowCache.set(wfId, state);
    return HttpResponse.json({
      workflowId: wfId,
      correlationId: wfId,
      state,
      nextStep: 'personal-details',
    });
  }),

  http.get('/workflow/:id/state', ({ params }) => {
    const { id } = params;
    const state = workflowCache.get(id as string) ?? { stage: 'personal-details', sub: 'editing' };
    return HttpResponse.json({
      state,
      checkpoint: null,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    });
  }),

  // --- Personal Details ---
  http.put('/workflow/:id/personal-details', async () => {
    return HttpResponse.json({
      state: { stage: 'verification', sub: 'checking' },
      documentAssessments: [
        { documentId: 'doc-001', type: 'passport', status: 'processing' },
        { documentId: 'doc-002', type: 'proof-of-address', status: 'processing' },
      ],
    });
  }),

  // --- Verification ---
  http.get('/workflow/:id/verification/status', ({ params }) => {
    const { id } = params;
    const persona = getPersona();
    const count = (verificationCounts.get(id as string) ?? 0) + 1;
    verificationCounts.set(id as string, count);

    const checkingState = {
      state: { stage: 'verification', sub: 'checking' },
      checks: [
        { type: 'document-quality', status: 'in-progress' as const, detail: null },
        { type: 'identity-verification', status: 'waiting' as const, detail: null },
        { type: 'compliance-screening', status: 'waiting' as const, detail: null },
      ],
    };

    const passedState = {
      state: { stage: 'verification', sub: 'complete' as const },
      checks: [
        { type: 'document-quality', status: 'passed' as const, detail: 'All documents clear' },
        { type: 'identity-verification', status: 'passed' as const, detail: 'Identity confirmed' },
        { type: 'compliance-screening', status: 'passed' as const, detail: 'No flags' },
      ],
    };

    const isHappyOrSimilar = ['happy-path', 'borderline-credit', 'declined', 'counter-offer'].includes(persona);

    if (isHappyOrSimilar) {
      return HttpResponse.json(count < 3 ? checkingState : passedState);
    }

    if (persona === 'blurry-docs') {
      if (count < 3) {
        return HttpResponse.json({
          state: { stage: 'verification', sub: 'issues' },
          checks: [
            { type: 'document-quality', status: 'failed' as const, detail: 'Low confidence scan — please re-upload a clearer image' },
            { type: 'identity-verification', status: 'waiting' as const, detail: null },
            { type: 'compliance-screening', status: 'waiting' as const, detail: null },
          ],
          documents: [{ documentId: 'doc-001', type: 'passport', status: 'needs-resubmit', confidence: 0.62, reason: 'Low quality scan' }],
        });
      }
      return HttpResponse.json(passedState);
    }

    if (persona === 'watchlist-hit') {
      if (count < 3) return HttpResponse.json(checkingState);
      return HttpResponse.json({
        state: { stage: 'verification', sub: 'manual-review' },
        checks: [
          { type: 'document-quality', status: 'passed' as const, detail: 'Documents clear' },
          { type: 'identity-verification', status: 'passed' as const, detail: 'Identity confirmed' },
          { type: 'compliance-screening', status: 'pending-review' as const, detail: 'Manual review required' },
        ],
        reviewId: 'rev-alex-001',
        estimatedWait: '2-4 hours',
      });
    }

    return HttpResponse.json(passedState);
  }),

  http.post('/workflow/:id/verification/resubmit', ({ params }) => {
    verificationCounts.set(params.id as string, 3);
    return HttpResponse.json({
      documentAssessment: { documentId: 'doc-003', type: 'passport', status: 'processing', confidence: null },
    });
  }),

  // --- Products ---
  http.put('/workflow/:id/products', async () => {
    return HttpResponse.json({
      state: { stage: 'financial-details', sub: 'editing' },
      productConfirmations: [{ type: 'current-account', status: 'reserved', accountNumber: null }],
    });
  }),

  // --- Financial Details ---
  http.put('/workflow/:id/financial-details', async () => {
    return HttpResponse.json({
      state: { stage: 'review-submit', sub: 'reviewing' },
    });
  }),

  // --- Submit ---
  http.post('/workflow/:id/submit', async () => {
    return HttpResponse.json({
      state: { stage: 'decision', sub: 'processing' },
      underwritingId: `uw-${Date.now()}`,
    });
  }),

  // --- Decision ---
  http.get('/workflow/:id/decision', ({ params }) => {
    const { id } = params;
    const persona = getPersona();
    const count = (decisionCounts.get(id as string) ?? 0) + 1;
    decisionCounts.set(id as string, count);

    if (count < 3) {
      return HttpResponse.json({
        state: { stage: 'decision', sub: 'processing' },
        decision: null,
      });
    }

    const approved = {
      state: { stage: 'decision', sub: 'approved' },
      decision: 'approved',
      details: {
        amount: 15000,
        rate: 6.9,
        termMonths: 36,
        monthlyPayment: 463,
        currency: 'EUR',
        message: 'Congratulations! Your application has been approved.',
      },
    };

    if (['happy-path', 'blurry-docs', 'watchlist-hit'].includes(persona)) {
      return HttpResponse.json(approved);
    }

    if (persona === 'declined') {
      return HttpResponse.json({
        state: { stage: 'decision', sub: 'declined' },
        decision: 'declined',
        details: {
          message: "We're unable to offer you a loan right now.",
          reasons: [
            'Credit score below minimum threshold',
            'Debt-to-income ratio exceeds our current lending criteria',
            'Insufficient credit history for the requested amount',
          ],
          canReapplyDate: new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0],
        },
      });
    }

    if (persona === 'counter-offer') {
      return HttpResponse.json({
        state: { stage: 'decision', sub: 'counter-offer' },
        decision: 'counter-offer',
        details: {
          originalAmount: 15000,
          offeredAmount: 8000,
          rate: 8.9,
          termMonths: 24,
          monthlyPayment: 367,
          currency: 'EUR',
          message: 'We can offer you €8,000 at 8.9% over 24 months instead.',
        },
      });
    }

    if (persona === 'borderline-credit') {
      return HttpResponse.json({
        state: { stage: 'decision', sub: 'manual-review' },
        decision: 'manual-review',
        details: {
          message: 'Manual underwriter review required. We will notify you within 2 business days.',
          reviewId: 'rev-sarah-001',
          estimatedWait: '1-2 business days',
        },
      });
    }

    return HttpResponse.json({
      state: { stage: 'decision', sub: 'processing' },
      decision: null,
    });
  }),

  http.post('/workflow/:id/decision/accept', async ({ request }) => {
    const body = await request.json() as any;
    return HttpResponse.json({
      state: { stage: 'decision', sub: body.accepted ? 'approved' : 'declined' },
      accountDetails: body.accepted ? { accountNumber: '12345678', sortCode: '20-00-00' } : null,
      nextSteps: body.accepted ? ['Set up online banking', 'Download the app'] : null,
    });
  }),

  // --- HITL ---
  http.get('/workflow/:id/review-queue', () => {
    const persona = getPersona();
    if (persona === 'watchlist-hit') {
      return HttpResponse.json({
        reviews: [{
          reviewId: 'rev-alex-001',
          type: 'compliance',
          applicantName: 'Alex Petrov',
          submittedAt: new Date().toISOString(),
          slaDeadline: new Date(Date.now() + 14400000).toISOString(),
          riskScore: 72,
          flags: ['PEP match (0.87 similarity)', 'Eastern European national'],
        }],
      });
    }
    if (persona === 'borderline-credit') {
      return HttpResponse.json({
        reviews: [{
          reviewId: 'rev-sarah-001',
          type: 'underwriting',
          applicantName: 'Sarah Miller',
          submittedAt: new Date().toISOString(),
          slaDeadline: new Date(Date.now() + 2880000).toISOString(),
          creditScore: 621,
          dti: 0.38,
          requestedAmount: 15000,
          modelDecision: 'borderline',
          pd: 0.042,
          lgd: 0.55,
        }],
      });
    }
    return HttpResponse.json({ reviews: [] });
  }),

  // --- HITL Review Details ---
  http.get('/workflow/wf-current/review/:reviewId', ({ params }) => {
    const { reviewId } = params;

    if (reviewId === 'rev-alex-001') {
      return HttpResponse.json({
        reviewId,
        type: 'compliance',
        applicantName: 'Alex Petrov',
        dob: '1980-02-20',
        nationality: 'RU',
        idDocuments: [{ type: 'passport', number: 'P-****7892', verified: true }],
        watchlistMatches: [{
          list: 'PEP',
          similarity: 0.87,
          matchName: 'Alexei Petrov',
          jurisdiction: 'RU',
          role: 'Former Regional Official',
        }],
        riskBreakdown: {
          pep: { score: 72, label: 'PEP Screening', description: 'Name matched a Politically Exposed Person record at 87% confidence.', sourceName: 'World-Check PEP Database', sourceUrl: '/audit/pep-scan/alex-petrov-001', triggeredAt: '2026-06-26T10:42:00Z' },
          sanctions: { score: 0, label: 'Sanctions Screening', description: 'No matches found against UN, EU, OFAC, or UK sanctions lists.', sourceName: 'Consolidated Sanctions List', sourceUrl: '/audit/sanctions-scan/alex-petrov-001', triggeredAt: '2026-06-26T10:42:00Z' },
          adverseMedia: { score: 15, label: 'Adverse Media', description: 'One local news article from 2023 mentions the applicant.', sourceName: 'LexisNexis Adverse Media', sourceUrl: '/audit/media-scan/alex-petrov-001', triggeredAt: '2026-06-26T10:42:00Z' },
          aml: { score: 30, label: 'AML Risk Factors', description: 'Recent deposits totalling €28,000 across 3 transactions.', sourceName: 'Transaction Monitoring System', sourceUrl: '/audit/aml-txn/alex-petrov-001', triggeredAt: '2026-06-26T10:42:00Z' },
        },
        slaDeadline: new Date(Date.now() + 14400000).toISOString(),
      });
    }

    if (reviewId === 'rev-sarah-001') {
      return HttpResponse.json({
        reviewId,
        type: 'underwriting',
        applicantName: 'Sarah Miller',
        loanRequest: { amount: 15000, term: 36, purpose: 'home-improvement' },
        creditReport: { score: 621, bureau: 'Experian', factors: ['Short credit history', 'High utilisation on card ending 4521'] },
        income: { annual: 42000, verified: true },
        dti: 0.38,
        monthlyDebt: 1300,
        monthlyIncome: 3500,
        modelOutput: { decision: 'borderline', pd: 0.042, lgd: 0.55, recommendation: 'Counter-offer or manual approve' },
      });
    }

    return HttpResponse.json({ error: 'Review not found' }, { status: 404 });
  }),

  // --- HITL Review Decision ---
  http.post('/workflow/wf-current/review/:reviewId/decision', async ({ request }) => {
    const body = await request.json() as any;
    return HttpResponse.json({
      reviewId: body.counterOffer ? 'counter-offer' : 'rev',
      outcome: body.decision,
      recordedAt: new Date().toISOString(),
      workflowAdvanced: true,
    });
  }),
];
