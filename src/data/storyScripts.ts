export type OutcomeColor = 'green' | 'red' | 'blue' | 'amber';

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
  },
];
