export type OutcomeColor = 'green' | 'red' | 'blue' | 'amber';

export type AuditOutcome = 'pass' | 'fail' | 'escalated' | 'approved' | 'declined' | 'info';

export interface AuditEvent {
  timestamp: string;
  actor: 'System' | 'Applicant' | 'Compliance Officer' | 'Underwriter';
  event: string;
  outcome: AuditOutcome;
}

export interface PassportDocument {
  id: string;
  name: string;
  status: 'verified' | 'rejected' | 'resubmitted' | 'generated' | 'pending';
}

export interface DecisionSummary {
  outcome: 'approved' | 'declined' | 'counter-offer' | 'under-review';
  decidedAt: string;
  decidedBy: string;
  amount?: number;
  offeredAmount?: number;
  rate?: number;
  termMonths?: number;
  monthlyPayment?: number;
  reasons?: string[];
  conditions?: string[];
}

export interface ApplicationPassportData {
  applicationId: string;
  submittedAt: string;
  applicantName: string;
  product: string;
  requestedAmount: number;
  status: 'approved' | 'declined' | 'counter-offer' | 'under-review';
  auditTrail: AuditEvent[];
  documents: PassportDocument[];
  decision: DecisionSummary;
}

export interface Moment {
  context: string;
  trigger: string;
  decision: string;
  action: string;
  outcome: string;
}

export interface StepScript {
  stepId: string;
  stepLabel: string;
  exception?: string;
  exceptionColor?: 'amber' | 'red';
  moment: Moment;
}

export interface PersonaScript {
  personaId: string;
  personaName: string;
  personaLabel: string;
  outcomeColor: OutcomeColor;
  outcomeLabel: string;
  steps: StepScript[];
  passport: ApplicationPassportData;
}

const COMMON_PERSONAL: StepScript = {
  stepId: 'personal-details',
  stepLabel: 'Personal Details',
  moment: {
    context: 'Customer wants a personal loan and has landed on the application portal.',
    trigger: 'Customer fills in name, date of birth, address, and nationality and submits the form.',
    decision: 'All required fields are present and pass format validation.',
    action: 'Workflow advances to identity verification. Passport scan and proof-of-address upload are requested.',
    outcome: 'Customer record created. Verification checks queued.',
  },
};

const COMMON_PRODUCT: StepScript = {
  stepId: 'product-selection',
  stepLabel: 'Product Selection',
  moment: {
    context: 'Identity checks have passed. Customer is now presented with eligible loan products.',
    trigger: 'Customer selects loan type, requested amount (€15,000), and preferred currency.',
    decision: 'Selected product matches the customer\'s verified profile.',
    action: 'Product reservation confirmed. Workflow advances to income and expenditure capture.',
    outcome: 'Loan product locked. Customer moves to affordability assessment.',
  },
};

const COMMON_FINANCIAL: StepScript = {
  stepId: 'financial-details',
  stepLabel: 'Financial Details',
  moment: {
    context: 'Product selected. Customer must now declare income, employment status, and monthly outgoings.',
    trigger: 'Customer submits financial declaration.',
    decision: 'Debt-to-income (DTI) ratio is within acceptable lending limits.',
    action: 'Financial data saved. Workflow advances to application review.',
    outcome: 'Affordability confirmed. Customer cleared for credit decision.',
  },
};

const COMMON_REVIEW: StepScript = {
  stepId: 'review-submit',
  stepLabel: 'Review & Submit',
  moment: {
    context: 'Customer is shown a full summary of their application before final submission.',
    trigger: 'Customer confirms all details are correct and clicks Submit.',
    decision: 'No changes requested. Application data is complete.',
    action: 'Application submitted to the decision engine for credit assessment.',
    outcome: 'Application locked. Credit engine begins underwriting evaluation.',
  },
};

export const storyScripts: PersonaScript[] = [
  {
    personaId: 'happy-path',
    personaName: 'Maria Santos',
    personaLabel: 'Happy Path',
    outcomeColor: 'green',
    outcomeLabel: 'Approved — €15,000 at 6.9%',
    steps: [
      COMMON_PERSONAL,
      {
        stepId: 'verification',
        stepLabel: 'Verification',
        moment: {
          context: 'Passport and proof-of-address documents submitted. Three checks run in parallel: document quality, identity, and compliance screening.',
          trigger: 'AI document-quality engine scores each image. Identity engine cross-references against authoritative records. Compliance engine checks watchlists.',
          decision: 'All three checks pass. Quality scores above threshold, identity confirmed, no watchlist flags.',
          action: 'Verification status set to complete. Workflow unblocks to product selection.',
          outcome: 'Identity established with confidence. Clean compliance record. No human intervention required.',
        },
      },
      COMMON_PRODUCT,
      COMMON_FINANCIAL,
      COMMON_REVIEW,
      {
        stepId: 'decision',
        stepLabel: 'Decision',
        moment: {
          context: 'Application in credit engine queue. Score calculated from credit history, DTI, and employment stability.',
          trigger: 'Credit engine returns result: score well above minimum threshold.',
          decision: 'Full loan amount approved at best available rate.',
          action: 'Offer presented to customer: €15,000, 6.9% APR, 36 months, €463/month.',
          outcome: 'Customer accepts. Account set up. Fast, fully automated approval — zero manual touchpoints.',
        },
      },
    ],
    passport: {
      applicationId: 'APP-2024-00142',
      submittedAt: '15 Jan 2024, 10:07',
      applicantName: 'Maria Santos',
      product: 'Personal Loan',
      requestedAmount: 15000,
      status: 'approved',
      auditTrail: [
        { timestamp: '15 Jan 2024, 10:00', actor: 'Applicant', event: 'Application started. Personal details submitted.', outcome: 'info' },
        { timestamp: '15 Jan 2024, 10:01', actor: 'System',    event: 'Identity verification initiated. Passport scan and proof-of-address queued for assessment.', outcome: 'info' },
        { timestamp: '15 Jan 2024, 10:02', actor: 'System',    event: 'Document quality check: PASS (confidence 0.96). Both documents accepted.', outcome: 'pass' },
        { timestamp: '15 Jan 2024, 10:03', actor: 'System',    event: 'Identity verification: PASS. Name, DOB, and nationality confirmed against register.', outcome: 'pass' },
        { timestamp: '15 Jan 2024, 10:04', actor: 'System',    event: 'Compliance screening: PASS. No watchlist matches. Risk score: 2/100.', outcome: 'pass' },
        { timestamp: '15 Jan 2024, 10:05', actor: 'Applicant', event: 'Product selected: Personal Loan, €15,000, EUR. Financial details submitted.', outcome: 'info' },
        { timestamp: '15 Jan 2024, 10:06', actor: 'System',    event: 'Affordability check: PASS. DTI 22% — within automated approval limit of 33%.', outcome: 'pass' },
        { timestamp: '15 Jan 2024, 10:07', actor: 'Applicant', event: 'Application reviewed and submitted for credit decision.', outcome: 'info' },
        { timestamp: '15 Jan 2024, 10:08', actor: 'System',    event: 'Credit assessment completed. Score 742 — above threshold. Approved at full amount.', outcome: 'approved' },
      ],
      documents: [
        { id: 'doc-001', name: 'Passport scan',    status: 'verified' },
        { id: 'doc-002', name: 'Proof of address', status: 'verified' },
        { id: 'doc-003', name: 'Loan agreement',   status: 'generated' },
      ],
      decision: {
        outcome: 'approved',
        decidedAt: '15 Jan 2024, 10:08',
        decidedBy: 'System (automated credit engine)',
        amount: 15000,
        rate: 6.9,
        termMonths: 36,
        monthlyPayment: 463,
      },
    },
  },
  {
    personaId: 'blurry-docs',
    personaName: 'James Chen',
    personaLabel: 'Document Resubmit',
    outcomeColor: 'green',
    outcomeLabel: 'Approved after re-upload',
    steps: [
      COMMON_PERSONAL,
      {
        stepId: 'verification',
        stepLabel: 'Verification',
        exception: 'Doc Resubmit',
        exceptionColor: 'amber',
        moment: {
          context: 'Passport scan submitted but captured under poor lighting. Document quality check runs.',
          trigger: 'Quality engine scores confidence at 0.62 — below the 0.70 minimum threshold.',
          decision: 'Document quality is too low to proceed. Resubmission required before identity check can continue.',
          action: 'Specific document flagged. Customer shown a clear resubmit prompt with the reason. Clean re-upload rescores at 0.94.',
          outcome: 'Verification completes after one resubmit. Application continues with no further delay. Self-service recovery — no human needed.',
        },
      },
      COMMON_PRODUCT,
      COMMON_FINANCIAL,
      COMMON_REVIEW,
      {
        stepId: 'decision',
        stepLabel: 'Decision',
        moment: {
          context: 'Application submitted after successful re-verification. Credit engine evaluates the full profile.',
          trigger: 'Credit score and DTI meet approval criteria.',
          decision: 'Approved at full amount.',
          action: 'Offer: €15,000, 6.9% APR, 36 months.',
          outcome: 'Customer accepts. Resubmit friction resolved through self-service — zero escalation cost.',
        },
      },
    ],
    passport: {
      applicationId: 'APP-2024-00143',
      submittedAt: '16 Jan 2024, 11:22',
      applicantName: 'James Chen',
      product: 'Personal Loan',
      requestedAmount: 15000,
      status: 'approved',
      auditTrail: [
        { timestamp: '16 Jan 2024, 11:00', actor: 'Applicant', event: 'Application started. Personal details submitted.', outcome: 'info' },
        { timestamp: '16 Jan 2024, 11:01', actor: 'System',    event: 'Identity verification initiated.', outcome: 'info' },
        { timestamp: '16 Jan 2024, 11:02', actor: 'System',    event: 'Document quality check: FAIL. Passport confidence score 0.62 — below 0.70 threshold. Low-quality scan detected.', outcome: 'fail' },
        { timestamp: '16 Jan 2024, 11:03', actor: 'System',    event: 'Resubmission requested. Applicant notified with specific reason and guidance.', outcome: 'info' },
        { timestamp: '16 Jan 2024, 11:09', actor: 'Applicant', event: 'Passport re-uploaded with improved lighting.', outcome: 'info' },
        { timestamp: '16 Jan 2024, 11:10', actor: 'System',    event: 'Document quality check: PASS (confidence 0.94). Re-uploaded document accepted.', outcome: 'pass' },
        { timestamp: '16 Jan 2024, 11:11', actor: 'System',    event: 'Identity verification: PASS. Compliance screening: PASS. Risk score: 4/100.', outcome: 'pass' },
        { timestamp: '16 Jan 2024, 11:15', actor: 'Applicant', event: 'Product and financial details submitted.', outcome: 'info' },
        { timestamp: '16 Jan 2024, 11:22', actor: 'Applicant', event: 'Application submitted for credit decision.', outcome: 'info' },
        { timestamp: '16 Jan 2024, 11:23', actor: 'System',    event: 'Credit assessment: PASS. Score 698. Approved at full amount.', outcome: 'approved' },
      ],
      documents: [
        { id: 'doc-001', name: 'Passport scan (original — rejected)', status: 'rejected' },
        { id: 'doc-002', name: 'Passport scan (resubmitted)',          status: 'verified' },
        { id: 'doc-003', name: 'Proof of address',                     status: 'verified' },
        { id: 'doc-004', name: 'Loan agreement',                       status: 'generated' },
      ],
      decision: {
        outcome: 'approved',
        decidedAt: '16 Jan 2024, 11:23',
        decidedBy: 'System (automated credit engine)',
        amount: 15000,
        rate: 6.9,
        termMonths: 36,
        monthlyPayment: 463,
      },
    },
  },
  {
    personaId: 'watchlist-hit',
    personaName: 'Alex Petrov',
    personaLabel: 'Compliance HITL',
    outcomeColor: 'amber',
    outcomeLabel: 'Approved after manual compliance review',
    steps: [
      COMMON_PERSONAL,
      {
        stepId: 'verification',
        stepLabel: 'Verification',
        exception: 'HITL: Compliance',
        exceptionColor: 'red',
        moment: {
          context: 'Documents pass quality check. Compliance screening runs against global PEP and sanctions lists.',
          trigger: 'Name match detected on EU PEP register at 87% similarity. Risk score: 72/100 (High).',
          decision: 'Score exceeds the automatic-approval ceiling. Mandatory manual compliance review triggered per AML policy.',
          action: 'Case routed to Compliance Officer queue with SLA deadline. Applicant sees an "Under review" holding screen.',
          outcome: 'Compliance officer reviews risk breakdown, watchlist evidence, and applicant context. Approves with written justification recorded for audit trail.',
        },
      },
      COMMON_PRODUCT,
      COMMON_FINANCIAL,
      COMMON_REVIEW,
      {
        stepId: 'decision',
        stepLabel: 'Decision',
        moment: {
          context: 'Compliance gate cleared by officer. Application re-enters the automated pipeline.',
          trigger: 'Credit engine processes a clean profile post-compliance approval.',
          decision: 'Approved at full amount.',
          action: 'Offer: €15,000, 6.9% APR, 36 months.',
          outcome: 'Customer approved. Every decision step is logged with the reviewer ID and justification — audit-ready from day one.',
        },
      },
    ],
    passport: {
      applicationId: 'APP-2024-00144',
      submittedAt: '17 Jan 2024, 14:05',
      applicantName: 'Alex Petrov',
      product: 'Personal Loan',
      requestedAmount: 15000,
      status: 'approved',
      auditTrail: [
        { timestamp: '17 Jan 2024, 13:00', actor: 'Applicant',          event: 'Application started. Personal details submitted.', outcome: 'info' },
        { timestamp: '17 Jan 2024, 13:01', actor: 'System',             event: 'Identity verification initiated.', outcome: 'info' },
        { timestamp: '17 Jan 2024, 13:02', actor: 'System',             event: 'Document quality check: PASS (confidence 0.91).', outcome: 'pass' },
        { timestamp: '17 Jan 2024, 13:03', actor: 'System',             event: 'Identity verification: PASS.', outcome: 'pass' },
        { timestamp: '17 Jan 2024, 13:04', actor: 'System',             event: 'Compliance screening: ALERT. PEP match detected on EU Political Persons Register — 87% name similarity. Risk score: 72/100 (High). Mandatory manual review triggered.', outcome: 'escalated' },
        { timestamp: '17 Jan 2024, 13:05', actor: 'System',             event: 'Case assigned to Compliance Officer queue. SLA deadline: 17 Jan 2024, 17:05 (4-hour window).', outcome: 'info' },
        { timestamp: '17 Jan 2024, 14:48', actor: 'Compliance Officer', event: 'Case opened. Watchlist evidence reviewed. Applicant profile assessed against match context.', outcome: 'info' },
        { timestamp: '17 Jan 2024, 15:12', actor: 'Compliance Officer', event: 'Decision: APPROVED. Justification: name similarity is phonetic, not a verified match. Applicant nationality and DOB do not align with PEP record. No further action required.', outcome: 'approved' },
        { timestamp: '17 Jan 2024, 15:13', actor: 'System',             event: 'Compliance gate cleared. Application re-enters automated pipeline.', outcome: 'info' },
        { timestamp: '17 Jan 2024, 15:20', actor: 'Applicant',          event: 'Product and financial details submitted.', outcome: 'info' },
        { timestamp: '17 Jan 2024, 15:28', actor: 'Applicant',          event: 'Application submitted for credit decision.', outcome: 'info' },
        { timestamp: '17 Jan 2024, 15:29', actor: 'System',             event: 'Credit assessment: PASS. Score 711. Approved at full amount.', outcome: 'approved' },
      ],
      documents: [
        { id: 'doc-001', name: 'Passport scan',            status: 'verified' },
        { id: 'doc-002', name: 'Proof of address',         status: 'verified' },
        { id: 'doc-003', name: 'Compliance review report', status: 'generated' },
        { id: 'doc-004', name: 'Loan agreement',           status: 'generated' },
      ],
      decision: {
        outcome: 'approved',
        decidedAt: '17 Jan 2024, 15:29',
        decidedBy: 'System (automated credit engine, post compliance clearance)',
        amount: 15000,
        rate: 6.9,
        termMonths: 36,
        monthlyPayment: 463,
      },
    },
  },
  {
    personaId: 'borderline-credit',
    personaName: 'Sarah Miller',
    personaLabel: 'Underwriter HITL',
    outcomeColor: 'amber',
    outcomeLabel: 'Approved with conditions after underwriter review',
    steps: [
      COMMON_PERSONAL,
      {
        stepId: 'verification',
        stepLabel: 'Verification',
        moment: {
          context: 'Documents submitted. Three checks run in parallel.',
          trigger: 'All checks pass: quality score high, identity confirmed, no compliance flags.',
          decision: 'Clean verification. No exceptions.',
          action: 'Workflow advances to product selection.',
          outcome: 'Identity and compliance confirmed. No human intervention needed.',
        },
      },
      COMMON_PRODUCT,
      {
        stepId: 'financial-details',
        stepLabel: 'Financial Details',
        moment: {
          context: 'Income declared at €2,800/month. Monthly commitments declared at €980.',
          trigger: 'DTI calculated: 35% — marginally above the 33% auto-approve ceiling.',
          decision: 'Outside automated approval band. Not high enough to auto-decline. Requires human judgement.',
          action: 'Financial details saved. Case flagged for underwriter review at the decision stage.',
          outcome: 'Application continues to review and submission. Underwriter case queued in parallel.',
        },
      },
      COMMON_REVIEW,
      {
        stepId: 'decision',
        stepLabel: 'Decision',
        exception: 'HITL: Underwriter',
        exceptionColor: 'amber',
        moment: {
          context: 'Application submitted. Credit engine flags DTI as borderline — cannot auto-decide.',
          trigger: 'Case routed to underwriter queue. Applicant informed of 1–2 business day review.',
          decision: 'Underwriter reviews income documentation, employment history, and spending pattern. Judges overall profile as acceptable.',
          action: 'Underwriter approves with conditions: loan granted with 12-month review clause.',
          outcome: 'Customer approved. Human judgment applied only where the rule engine is genuinely uncertain — capacity used efficiently.',
        },
      },
    ],
    passport: {
      applicationId: 'APP-2024-00145',
      submittedAt: '18 Jan 2024, 09:42',
      applicantName: 'Sarah Miller',
      product: 'Personal Loan',
      requestedAmount: 15000,
      status: 'approved',
      auditTrail: [
        { timestamp: '18 Jan 2024, 09:00', actor: 'Applicant',   event: 'Application started. Personal details submitted.', outcome: 'info' },
        { timestamp: '18 Jan 2024, 09:01', actor: 'System',      event: 'Identity verification: all checks PASS. Risk score: 6/100.', outcome: 'pass' },
        { timestamp: '18 Jan 2024, 09:10', actor: 'Applicant',   event: 'Product selected: Personal Loan, €15,000. Financial details submitted. Income: €2,800/mo. Commitments: €980/mo.', outcome: 'info' },
        { timestamp: '18 Jan 2024, 09:11', actor: 'System',      event: 'Affordability assessment: BORDERLINE. DTI 35% — exceeds 33% automated approval ceiling. Outside auto-decline threshold of 45%. Flagged for underwriter review.', outcome: 'escalated' },
        { timestamp: '18 Jan 2024, 09:42', actor: 'Applicant',   event: 'Application reviewed and submitted.', outcome: 'info' },
        { timestamp: '18 Jan 2024, 09:43', actor: 'System',      event: 'Case routed to Underwriter queue. Applicant notified of 1–2 business day review window.', outcome: 'info' },
        { timestamp: '19 Jan 2024, 10:15', actor: 'Underwriter', event: 'Case opened. Income documentation, employment contract, and spending history reviewed.', outcome: 'info' },
        { timestamp: '19 Jan 2024, 11:30', actor: 'Underwriter', event: 'Decision: APPROVED WITH CONDITIONS. Profile assessed as acceptable. Stable employment of 4 years offsets DTI margin. Condition: 12-month review clause applied.', outcome: 'approved' },
      ],
      documents: [
        { id: 'doc-001', name: 'Passport scan',               status: 'verified' },
        { id: 'doc-002', name: 'Proof of address',            status: 'verified' },
        { id: 'doc-003', name: 'Underwriter assessment',      status: 'generated' },
        { id: 'doc-004', name: 'Loan agreement (conditional)', status: 'generated' },
      ],
      decision: {
        outcome: 'approved',
        decidedAt: '19 Jan 2024, 11:30',
        decidedBy: 'Underwriter (UW-012)',
        amount: 15000,
        rate: 6.9,
        termMonths: 36,
        monthlyPayment: 463,
        conditions: ['12-month account review clause', 'No further credit applications within 6 months'],
      },
    },
  },
  {
    personaId: 'declined',
    personaName: 'Tom Baker',
    personaLabel: 'Respectful Decline',
    outcomeColor: 'red',
    outcomeLabel: 'Declined — credit below threshold',
    steps: [
      COMMON_PERSONAL,
      {
        stepId: 'verification',
        stepLabel: 'Verification',
        moment: {
          context: 'Documents submitted. Standard checks run.',
          trigger: 'All checks pass. No quality or compliance issues.',
          decision: 'Verification complete.',
          action: 'Workflow advances to product selection.',
          outcome: 'Clean identity record. Application continues.',
        },
      },
      COMMON_PRODUCT,
      COMMON_FINANCIAL,
      COMMON_REVIEW,
      {
        stepId: 'decision',
        stepLabel: 'Decision',
        moment: {
          context: 'Application evaluated by credit engine. Credit score, DTI, and credit history all assessed.',
          trigger: 'Credit score below minimum threshold. DTI also exceeds lending criteria. Insufficient credit history for amount requested.',
          decision: 'All three factors independently trigger decline conditions. No counter-offer band available.',
          action: 'Decline issued with three explicit reasons. Customer offered a downloadable decline letter. Re-apply eligibility date provided: 90 days.',
          outcome: 'Transparent, respectful decline. Customer understands why and knows when they can reapply. Regulatory disclosure obligations met.',
        },
      },
    ],
    passport: {
      applicationId: 'APP-2024-00146',
      submittedAt: '19 Jan 2024, 15:10',
      applicantName: 'Tom Baker',
      product: 'Personal Loan',
      requestedAmount: 15000,
      status: 'declined',
      auditTrail: [
        { timestamp: '19 Jan 2024, 15:00', actor: 'Applicant', event: 'Application started. Personal details submitted.', outcome: 'info' },
        { timestamp: '19 Jan 2024, 15:01', actor: 'System',    event: 'Identity verification: all checks PASS. Risk score: 8/100.', outcome: 'pass' },
        { timestamp: '19 Jan 2024, 15:05', actor: 'Applicant', event: 'Product selected: Personal Loan, €15,000. Financial details submitted.', outcome: 'info' },
        { timestamp: '19 Jan 2024, 15:06', actor: 'System',    event: 'Affordability check: DTI 42% — above automated approval ceiling.', outcome: 'fail' },
        { timestamp: '19 Jan 2024, 15:10', actor: 'Applicant', event: 'Application submitted for credit decision.', outcome: 'info' },
        { timestamp: '19 Jan 2024, 15:11', actor: 'System',    event: 'Credit score assessed: 498 — below minimum threshold of 580.', outcome: 'fail' },
        { timestamp: '19 Jan 2024, 15:11', actor: 'System',    event: 'Credit history: 8 months — below 12-month minimum for requested amount.', outcome: 'fail' },
        { timestamp: '19 Jan 2024, 15:11', actor: 'System',    event: 'Three independent decline conditions triggered. No counter-offer band applicable. Decision: DECLINED.', outcome: 'declined' },
        { timestamp: '19 Jan 2024, 15:12', actor: 'System',    event: 'Decline letter generated with three stated reasons and re-apply eligibility date.', outcome: 'info' },
      ],
      documents: [
        { id: 'doc-001', name: 'Passport scan',    status: 'verified' },
        { id: 'doc-002', name: 'Proof of address', status: 'verified' },
        { id: 'doc-003', name: 'Decline letter',   status: 'generated' },
      ],
      decision: {
        outcome: 'declined',
        decidedAt: '19 Jan 2024, 15:11',
        decidedBy: 'System (automated credit engine)',
        reasons: [
          'Credit score (498) below minimum threshold of 580',
          'Debt-to-income ratio (42%) exceeds lending criteria of 33%',
          'Insufficient credit history (8 months) for the requested amount',
        ],
      },
    },
  },
  {
    personaId: 'counter-offer',
    personaName: 'Lisa Wang',
    personaLabel: 'Counter-Offer',
    outcomeColor: 'blue',
    outcomeLabel: 'Counter-offer accepted — €8,000 at 8.9%',
    steps: [
      COMMON_PERSONAL,
      {
        stepId: 'verification',
        stepLabel: 'Verification',
        moment: {
          context: 'Documents submitted. Standard checks run.',
          trigger: 'All checks pass.',
          decision: 'Verification complete.',
          action: 'Workflow advances to product selection.',
          outcome: 'Clean record. Application continues.',
        },
      },
      COMMON_PRODUCT,
      COMMON_FINANCIAL,
      COMMON_REVIEW,
      {
        stepId: 'decision',
        stepLabel: 'Decision',
        moment: {
          context: 'Customer requested €15,000. Credit engine calculates risk-adjusted lending capacity.',
          trigger: 'Full requested amount exceeds safe lending threshold given the credit profile. Counter-offer band applies: €6,000–€10,000.',
          decision: 'Offer €8,000 at a higher risk-adjusted rate (8.9%) over a shorter term (24 months) rather than declining outright.',
          action: 'Counter-offer presented: €8,000, 8.9% APR, 24 months, €367/month. Customer can accept or decline.',
          outcome: 'Customer accepts. Revenue retained on a deal that would otherwise have been a full decline. Risk appropriately priced.',
        },
      },
    ],
    passport: {
      applicationId: 'APP-2024-00147',
      submittedAt: '20 Jan 2024, 13:55',
      applicantName: 'Lisa Wang',
      product: 'Personal Loan',
      requestedAmount: 15000,
      status: 'counter-offer',
      auditTrail: [
        { timestamp: '20 Jan 2024, 13:30', actor: 'Applicant', event: 'Application started. Personal details submitted.', outcome: 'info' },
        { timestamp: '20 Jan 2024, 13:31', actor: 'System',    event: 'Identity verification: all checks PASS. Risk score: 14/100.', outcome: 'pass' },
        { timestamp: '20 Jan 2024, 13:40', actor: 'Applicant', event: 'Product selected: Personal Loan, €15,000. Financial details submitted.', outcome: 'info' },
        { timestamp: '20 Jan 2024, 13:41', actor: 'System',    event: 'Affordability check: PASS. DTI 28%.', outcome: 'pass' },
        { timestamp: '20 Jan 2024, 13:55', actor: 'Applicant', event: 'Application submitted for credit decision.', outcome: 'info' },
        { timestamp: '20 Jan 2024, 13:56', actor: 'System',    event: 'Credit assessment: score adequate but risk-adjusted lending capacity capped at €8,000 for this profile. Full €15,000 exceeds safe exposure limit.', outcome: 'info' },
        { timestamp: '20 Jan 2024, 13:56', actor: 'System',    event: 'Counter-offer band triggered (€6,000–€10,000 available). Optimal counter-offer calculated: €8,000 at 8.9% over 24 months.', outcome: 'info' },
        { timestamp: '20 Jan 2024, 13:57', actor: 'Applicant', event: 'Counter-offer presented. Customer reviewed and ACCEPTED: €8,000, 8.9% APR, 24 months, €367/month.', outcome: 'approved' },
      ],
      documents: [
        { id: 'doc-001', name: 'Passport scan',        status: 'verified' },
        { id: 'doc-002', name: 'Proof of address',     status: 'verified' },
        { id: 'doc-003', name: 'Counter-offer letter', status: 'generated' },
        { id: 'doc-004', name: 'Loan agreement',       status: 'generated' },
      ],
      decision: {
        outcome: 'counter-offer',
        decidedAt: '20 Jan 2024, 13:57',
        decidedBy: 'System (automated credit engine)',
        offeredAmount: 8000,
        rate: 8.9,
        termMonths: 24,
        monthlyPayment: 367,
      },
    },
  },
];
