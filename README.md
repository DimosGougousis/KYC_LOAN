# KYC & Loan Onboarding — Demo

A front-end demo of retail KYC and personal-loan onboarding, shown through two lenses over the same six synthetic applications:

- **Applicant lens** (`/apply/new`) — a six-step application with persona pre-fill and a *live case file* beside the form that shows checks resolving, the audit trail growing and the provisional risk changing.
- **Reviewer lens** (`/case/:personaId`) — an analytical case file: KPI row, "What stands out", verification evidence, affordability breakdown, an interactive **scenario lab**, a BIAN-labelled audit trail, generated reviewer questions and, for referred cases, a human decision panel.
- **Compare** (`/compare`) — all six applications side by side, plus requested-versus-counter-offer.

All data is synthetic. Not a credit decision and not financial advice.

## How the numbers are produced

Every figure on screen comes from a pure, tested domain layer in `src/domain/`:

| Module | What it does |
|---|---|
| `loan.ts` | Annuity payment and amortization schedule |
| `affordability.ts` | Gross/net income, DTI before/after, residual income |
| `policy.ts`, `policyConfig.ts` | Demo policy rules, precedence and the counter-offer search |
| `scenarios.ts` | Scenario-lab presets, input parsing and clamping |
| `insights.ts`, `questions.ts`, `audit.ts` | "What stands out", reviewer questions and the audit trail, all templated from computed values |
| `caseFile.ts`, `live.ts`, `portfolio.ts` | Assembled views for the pages |

Persona facts live in one place, `src/data/personas.ts`. A test asserts that each persona's outcome is *produced* by the policy engine:

| Persona | Outcome |
|---|---|
| `happy-path` — Maria Santos | Approved |
| `blurry-docs` — James Chen | Approved after document re-upload |
| `watchlist-hit` — Alex Petrov | Referred to compliance (PEP match) |
| `borderline-credit` — Sarah Miller | Referred to underwriting (DTI in refer band) |
| `declined` — Tom Baker | Declined |
| `counter-offer` — Lisa Wang | Counter-offer €8,000 / 24 months |

Design and rules: [`docs/superpowers/specs/2026-10-08-kyc-loan-v2-design.md`](docs/superpowers/specs/2026-10-08-kyc-loan-v2-design.md).

## Stack

React 19, Vite, TypeScript, Tailwind CSS 4, React Router, TanStack Query, react-hook-form + zod. MSW provides the mock backend in the browser and in tests. Charts are hand-built SVG.

## Scripts

```bash
npm install
npm run dev      # local dev server
npm test         # Vitest + Testing Library (jsdom, MSW node server)
npm run build    # type-check and production build
npm run lint     # oxlint
```
