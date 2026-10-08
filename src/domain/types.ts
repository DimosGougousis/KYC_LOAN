export const PERSONA_IDS = ['happy-path', 'blurry-docs', 'watchlist-hit', 'borderline-credit', 'declined', 'counter-offer'] as const;
export type PersonaId = (typeof PERSONA_IDS)[number];

export function isPersonaId(v: unknown): v is PersonaId {
  return typeof v === 'string' && (PERSONA_IDS as readonly string[]).includes(v);
}

export const STAGES = ['personal-details', 'verification', 'product-selection', 'financial-details', 'review-submit', 'decision'] as const;
export type Stage = (typeof STAGES)[number];

export type Tone = 'good' | 'warn' | 'bad' | 'info';
export type Outcome = 'approved' | 'refer-compliance' | 'refer-underwriting' | 'counter-offer' | 'declined';

export interface LoanTerms { amount: number; aprPct: number; termMonths: number }
export interface Financials { annualIncome: number; monthlyRent: number; existingDebt: number; otherExpenses: number }

export type CheckId = 'liveness' | 'identity-register' | 'sanctions' | 'pep' | 'adverse-media' | 'device-fraud';
export type CheckResult = 'pass' | 'review' | 'fail';
export interface Check {
  id: CheckId;
  label: string;
  result: CheckResult;
  score: number;
  provider: string;
  minutesAfterStart: number;
  detail: string;
}
export interface DocumentAttempt { doc: 'passport' | 'proof-of-address'; name: string; quality: number; minutesAfterStart: number }

export type Actor = 'Applicant' | 'System' | 'Compliance officer' | 'Underwriter';
export interface AuditEvent { at: string; actor: Actor; domain: string; text: string; tone: Tone; stage: Stage }
