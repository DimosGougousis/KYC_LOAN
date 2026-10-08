import type { Check, DocumentAttempt, PersonaId } from '../domain/types';

export interface PersonaForm {
  firstName: string; lastName: string; dob: string; nationality: string; email: string; phone: string;
  addressLine1: string; addressLine2: string; city: string; postcode: string; country: string;
  loanAmount: number; loanTerm: string; employmentType: string;
  annualIncome: number; monthlyRent: number; existingDebt: number; otherExpenses: number;
}

export interface Persona {
  id: PersonaId; name: string; label: string; tagline: string; color: string;
  applicationId: string; startedAt: string; decisionMinutes: number;
  purpose: string; employer: string; yearsEmployed: number;
  creditScore: number; bureau: string;
  form: PersonaForm; documents: DocumentAttempt[]; checks: Check[];
}

const PROVIDER = {
  liveness: 'FaceTec (mock)',
  register: 'National ID register (mock)',
  sanctions: 'Consolidated sanctions list (mock)',
  pep: 'World-Check (mock)',
  media: 'LexisNexis (mock)',
  device: 'Device intelligence (mock)',
};

function cleanChecks(at: number, overrides: Partial<Record<Check['id'], Partial<Check>>> = {}): Check[] {
  const base: Check[] = [
    { id: 'liveness', label: 'Liveness', result: 'pass', score: 0.98, provider: PROVIDER.liveness, minutesAfterStart: at, detail: 'Selfie video matches the passport photo.' },
    { id: 'identity-register', label: 'Identity register', result: 'pass', score: 0.99, provider: PROVIDER.register, minutesAfterStart: at, detail: 'Name, date of birth and nationality confirmed.' },
    { id: 'sanctions', label: 'Sanctions', result: 'pass', score: 0, provider: PROVIDER.sanctions, minutesAfterStart: at + 1, detail: 'No match on UN, EU, OFAC or UK lists.' },
    { id: 'pep', label: 'PEP', result: 'pass', score: 0.08, provider: PROVIDER.pep, minutesAfterStart: at + 1, detail: 'No politically exposed person match.' },
    { id: 'adverse-media', label: 'Adverse media', result: 'pass', score: 0.02, provider: PROVIDER.media, minutesAfterStart: at + 1, detail: 'No relevant adverse media.' },
    { id: 'device-fraud', label: 'Device & behaviour', result: 'pass', score: 0.04, provider: PROVIDER.device, minutesAfterStart: at + 1, detail: 'Known device, consistent typing and location.' },
  ];
  return base.map((c) => ({ ...c, ...overrides[c.id] }));
}

export const PERSONAS: Persona[] = [
  {
    id: 'happy-path', name: 'Maria Santos', label: 'Happy Path', tagline: 'Clean file, strong credit: approved in minutes.',
    color: 'var(--color-p1)', applicationId: 'APP-2026-00142', startedAt: '2026-10-06T10:00:00Z', decisionMinutes: 8,
    purpose: 'Home improvement', employer: 'Atlantic Logistics', yearsEmployed: 6, creditScore: 742, bureau: 'Experian (mock)',
    form: {
      firstName: 'Maria', lastName: 'Santos', dob: '1988-04-12', nationality: 'PT', email: 'maria.santos@example.com', phone: '+351912345678',
      addressLine1: 'Rua Augusta 10', addressLine2: 'Apartment 5', city: 'Lisbon', postcode: '1100-053', country: 'PT',
      loanAmount: 15000, loanTerm: '36', employmentType: 'employed', annualIncome: 52000, monthlyRent: 1200, existingDebt: 200, otherExpenses: 400,
    },
    documents: [
      { doc: 'passport', name: 'Passport', quality: 0.96, minutesAfterStart: 1 },
      { doc: 'proof-of-address', name: 'Proof of address', quality: 0.93, minutesAfterStart: 1 },
    ],
    checks: cleanChecks(2),
  },
  {
    id: 'blurry-docs', name: 'James Chen', label: 'Document Resubmit', tagline: 'A blurry passport scan is caught, re-uploaded and approved.',
    color: 'var(--color-p2)', applicationId: 'APP-2026-00157', startedAt: '2026-10-06T11:00:00Z', decisionMinutes: 23,
    purpose: 'Vehicle purchase', employer: 'Hudson Analytics', yearsEmployed: 3, creditScore: 698, bureau: 'Experian (mock)',
    form: {
      firstName: 'James', lastName: 'Chen', dob: '1992-09-05', nationality: 'US', email: 'james.chen@example.com', phone: '+15551234567',
      addressLine1: '123 Main St', addressLine2: 'Suite 2', city: 'New York', postcode: '10001', country: 'US',
      loanAmount: 10000, loanTerm: '24', employmentType: 'employed', annualIncome: 85000, monthlyRent: 2500, existingDebt: 500, otherExpenses: 800,
    },
    documents: [
      { doc: 'passport', name: 'Passport', quality: 0.62, minutesAfterStart: 2 },
      { doc: 'proof-of-address', name: 'Proof of address', quality: 0.91, minutesAfterStart: 2 },
      { doc: 'passport', name: 'Passport (re-upload)', quality: 0.94, minutesAfterStart: 9 },
    ],
    checks: cleanChecks(10),
  },
  {
    id: 'watchlist-hit', name: 'Alex Petrov', label: 'Compliance HITL', tagline: 'PEP register match: a compliance officer must decide.',
    color: 'var(--color-p3)', applicationId: 'APP-2026-00163', startedAt: '2026-10-07T13:00:00Z', decisionMinutes: 6,
    purpose: 'Business equipment', employer: 'Petrov Consulting (self-employed)', yearsEmployed: 9, creditScore: 711, bureau: 'Experian (mock)',
    form: {
      firstName: 'Alex', lastName: 'Petrov', dob: '1980-02-20', nationality: 'RU', email: 'alex.petrov@example.com', phone: '+79005550101',
      addressLine1: 'Tverskaya St 7', addressLine2: 'Floor 3', city: 'Moscow', postcode: '125009', country: 'RU',
      loanAmount: 20000, loanTerm: '48', employmentType: 'self-employed', annualIncome: 120000, monthlyRent: 800, existingDebt: 1500, otherExpenses: 1500,
    },
    documents: [
      { doc: 'passport', name: 'Passport', quality: 0.95, minutesAfterStart: 1 },
      { doc: 'proof-of-address', name: 'Proof of address', quality: 0.9, minutesAfterStart: 1 },
    ],
    checks: cleanChecks(2, {
      pep: { result: 'review', score: 0.87, detail: "Name and date of birth match 'Alexei Petrov', former regional official (RU), similarity 0.87." },
      'adverse-media': { score: 0.15, detail: 'One 2023 local news mention; not material on its own.' },
    }),
  },
  {
    id: 'borderline-credit', name: 'Sarah Miller', label: 'Underwriter HITL', tagline: 'Affordability is borderline: an underwriter must decide.',
    color: 'var(--color-p4)', applicationId: 'APP-2026-00171', startedAt: '2026-10-07T09:00:00Z', decisionMinutes: 11,
    purpose: 'Home improvement', employer: 'Baker Street Dental', yearsEmployed: 4, creditScore: 650, bureau: 'Experian (mock)',
    form: {
      firstName: 'Sarah', lastName: 'Miller', dob: '1985-07-14', nationality: 'GB', email: 'sarah.miller@example.com', phone: '+447700900124',
      addressLine1: '12 Baker Street', addressLine2: 'Apt B', city: 'London', postcode: 'NW1 6XE', country: 'GB',
      loanAmount: 15000, loanTerm: '36', employmentType: 'employed', annualIncome: 30000, monthlyRent: 550, existingDebt: 500, otherExpenses: 150,
    },
    documents: [
      { doc: 'passport', name: 'Passport', quality: 0.92, minutesAfterStart: 1 },
      { doc: 'proof-of-address', name: 'Proof of address', quality: 0.88, minutesAfterStart: 1 },
    ],
    checks: cleanChecks(2),
  },
  {
    id: 'declined', name: 'Tom Baker', label: 'Respectful Decline', tagline: 'Score and affordability both fail: a clear, respectful no.',
    color: 'var(--color-p5)', applicationId: 'APP-2026-00178', startedAt: '2026-10-07T15:00:00Z', decisionMinutes: 7,
    purpose: 'Debt consolidation', employer: 'Not currently employed', yearsEmployed: 0, creditScore: 540, bureau: 'Experian (mock)',
    form: {
      firstName: 'Tom', lastName: 'Baker', dob: '1975-11-02', nationality: 'GB', email: 'tom.baker@example.com', phone: '+447700900125',
      addressLine1: '45 High Street', addressLine2: '', city: 'Bristol', postcode: 'BS1 4ST', country: 'GB',
      loanAmount: 25000, loanTerm: '60', employmentType: 'unemployed', annualIncome: 18000, monthlyRent: 600, existingDebt: 450, otherExpenses: 400,
    },
    documents: [
      { doc: 'passport', name: 'Passport', quality: 0.9, minutesAfterStart: 1 },
      { doc: 'proof-of-address', name: 'Proof of address', quality: 0.86, minutesAfterStart: 1 },
    ],
    checks: cleanChecks(2),
  },
  {
    id: 'counter-offer', name: 'Lisa Wang', label: 'Counter-Offer', tagline: 'The full amount does not fit; a smaller loan does.',
    color: 'var(--color-p6)', applicationId: 'APP-2026-00186', startedAt: '2026-10-08T09:30:00Z', decisionMinutes: 9,
    purpose: 'Education', employer: 'Bund Design Studio', yearsEmployed: 2, creditScore: 660, bureau: 'Experian (mock)',
    form: {
      firstName: 'Lisa', lastName: 'Wang', dob: '1990-03-30', nationality: 'CN', email: 'lisa.wang@example.com', phone: '+8613812345678',
      addressLine1: 'No. 88 Nanjing Rd', addressLine2: 'Unit 1201', city: 'Shanghai', postcode: '200001', country: 'CN',
      loanAmount: 15000, loanTerm: '24', employmentType: 'employed', annualIncome: 21600, monthlyRent: 350, existingDebt: 200, otherExpenses: 200,
    },
    documents: [
      { doc: 'passport', name: 'Passport', quality: 0.93, minutesAfterStart: 1 },
      { doc: 'proof-of-address', name: 'Proof of address', quality: 0.89, minutesAfterStart: 1 },
    ],
    checks: cleanChecks(2),
  },
];

export function getPersona(id: string | undefined): Persona | undefined {
  return PERSONAS.find((p) => p.id === id);
}
