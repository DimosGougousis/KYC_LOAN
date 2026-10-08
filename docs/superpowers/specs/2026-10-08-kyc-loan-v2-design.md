# KYC & Loan Demo v2 — Design Spec

- **Date:** 2026-10-08
- **Status:** Approved in brainstorming, pending written-spec review
- **Repo:** `DimosGougousis/KYC_LOAN` (deployed at https://kyc-loan.vercel.app/)
- **Design reference:** https://fund-proposal-review.vercel.app/ (light theme only)

## 1. Intent

### What the user asked for
Upgrade the existing KYC & Loan demo into a state-of-the-art demo, adopting more of the design language **and concepts** of the Fund Proposal Review site, while keeping the background white.

### Agreed understanding
- **Audience:** both bank stakeholders and ops/risk reviewers, served by **two lenses over the same persona data**:
  - **Applicant lens** — the onboarding journey a customer experiences.
  - **Reviewer lens** — an analytical "case file" in the style of Fund Proposal Review.
- **Concepts carried over from Fund Proposal Review:** KPI tile row + "What stands out" tagged insights; interactive scenario lab; side-by-side comparison tables; generated "questions to ask" + disclaimers/sources footer.
- **Applicant wizard:** keep the six steps and the mock API, restyle, and add a live case-file sidebar that bridges to the reviewer lens.
- **Approach chosen:** evolve in place (Approach A) — shared design system, pure tested domain layer, new Case File and Compare pages.

### Assumptions (confirmed by approval of the design)
- Front-end-only demo; all data synthetic; MSW remains the mock backend.
- Same Vercel project; same six personas and BIAN framing.

### Success criteria
1. Every page uses the new light visual system (Section 3); no blue SaaS header, no grey page background.
2. Each persona has a Case File whose outcome is **derived** from its facts by the policy engine (not hard-coded) — enforced by a test.
3. The scenario lab changes the policy outcome live, verified by tests: Sarah Miller (`borderline-credit`) is *referred* in the base case, *approved* under "Longer term (60 mo)", and under "Income −20%" fails on DTI alone so the engine returns a *counter-offer* of €5,000 / 36 mo; Lisa Wang's requested terms yield *counter-offer* and the counter-offer terms entered via Custom yield *approved*.
4. A viewer can move between Applicant and Reviewer lenses for the same persona in one click.
5. `npm test`, `npm run build`, `npm run lint` pass; pages verified visually at desktop and 375px width with no horizontal page scroll.

## 2. Current state (baseline)

- React 19, Vite 8, TypeScript 6, Tailwind 4 (`@tailwindcss/vite`), React Router 6, TanStack Query 5, react-hook-form + zod, MSW 2.
- Routes: `/` (persona picker), `/workflow/:workflowId` (6-step wizard), `/hitl/compliance/:reviewId`, `/hitl/underwriting/:reviewId`, `/dashboard` (Workflow Story with FlowDiagram, ApplicationPassport, NarrativeCard).
- Persona data split across `src/data/personaDefaults.ts` (form values) and `src/data/storyScripts.ts` (narrative, passport, audit trail). Persona selection stored in `localStorage['demoPersona']` and read by MSW handlers.
- No test runner installed.

### Personas (unchanged identities)

| id | Name | Label | Target outcome |
|---|---|---|---|
| `happy-path` | Maria Santos | Happy Path | Approved €15,000 / 36 mo @ 6.9% |
| `blurry-docs` | James Chen | Document Resubmit | Approved after document re-upload |
| `watchlist-hit` | Alex Petrov | Compliance HITL | Referred to compliance (PEP match) |
| `borderline-credit` | Sarah Miller | Underwriter HITL | Referred to underwriting (DTI in refer band) |
| `declined` | Tom Baker | Respectful Decline | Declined (score below threshold) |
| `counter-offer` | Lisa Wang | Counter-Offer | Counter-offer €8,000 / 24 mo @ 8.9% |

Persona ids above are the ids already used in `personaDefaults.ts`, `storyScripts.ts` and the MSW handlers (verified 2026-10-08); they are not renamed.

## 3. Visual system

### Tokens — `src/index.css` via Tailwind 4 `@theme`
Light only. No `prefers-color-scheme` dark override.

| Token | Value | Use |
|---|---|---|
| `--color-bg` | `#ffffff` | Page background |
| `--color-surface` | `#ffffff` | Panels (with hairline border) |
| `--color-wash` | `#f6f7f4` | Subtle fills, table header, shaded rows |
| `--color-line` | `#d9ddd6` | Borders, rules |
| `--color-ink` | `#1b2430` | Primary text |
| `--color-muted` | `#5d6672` | Secondary text |
| `--color-accent` | `#0f6e6a` | Teal accent, active states, links |
| `--color-accent-soft` | `#e2efed` | Selected pills, highlighted rows |
| `--color-good` / `-soft` | `#2f7d4f` / `#e5f1e9` | Pass / approved |
| `--color-warn` / `-soft` | `#b07a12` / `#f7eedb` | Refer / attention |
| `--color-bad` / `-soft` | `#b23b2e` / `#f6e3e0` | Fail / declined |
| `--color-p1`…`--color-p6` | `#c7633b`, `#2e5eaa`, `#3c8c5a`, `#8a5bb0`, `#b8912f`, `#b0456e` | One per persona, in persona-table order |

Typography (Google Fonts, loaded in `index.html`):
- **Display:** Newsreader 600 — h1 42px / h2 28px / h3 20px.
- **Body:** IBM Plex Sans 400/500/600 — 15px base, 14px tables.
- **Mono:** IBM Plex Mono 400/500 — all numbers, IDs, timestamps, eyebrows; `font-variant-numeric: tabular-nums`.

Rhythm: mono uppercase eyebrow above every h1/h2 (e.g. `STEP 2 · VERIFICATION`, `SECTION 3`); 1px section rules; 8px radius; no drop shadows; 16px minimum side gutter on mobile.

### Shared primitives — `src/ui/`
`PageHeader`, `Eyebrow`, `Section`, `KpiTile`, `KpiRow`, `Tag`, `InsightRow`, `StatusBadge`, `DataTable` (sticky first column, horizontal scroll inside panel), `SegmentedControl`, `NumberField`, `StackedBar` (SVG), `LineChart` (SVG, multi-series, optional shaded band and point markers), `EmptyState`, `TopBar`.

No new chart dependency; charts are hand-built SVG.

## 4. Information architecture

| Route | Lens | Content |
|---|---|---|
| `/` | Entry | Hero (eyebrow, serif h1, lede), KPI row across all six cases, persona compare table with per-row actions "Apply as…" and "Open case file". |
| `/apply/:workflowId` | Applicant | Restyled 6-step wizard + sticky Live Case File sidebar. |
| `/case/:personaId` | Reviewer | Analytical case file (Section 5); HITL personas include the Reviewer Decision panel. |
| `/compare` | Reviewer | Personas side by side + requested-vs-counter-offer table. |

Redirects:
- `/workflow/:workflowId` → `/apply/:workflowId`
- `/dashboard` → `/case/happy-path`
- `/hitl/compliance/:id` → `/case/watchlist-hit`
- `/hitl/underwriting/:id` → `/case/borderline-credit`
- `*` → `/`

**TopBar** (all pages): wordmark, **Applicant / Reviewer** lens toggle (preserves current persona), persona switcher, "Reset demo".

**Responsive:** ≤1024px the Live Case File sidebar becomes a bottom drawer; tables scroll inside their panel; the page never scrolls horizontally.

## 5. Case File page — `/case/:personaId`

All content derives from one `CaseFile` object produced by `buildCaseFile(personaId)`.

1. **Header** — eyebrow `CASE FILE · <appId> · SUBMITTED <date time>`; serif h1 `<Name> — <€amount> personal loan`; one-paragraph lede; large outcome `StatusBadge` (Approved / Referred to compliance / Referred to underwriting / Counter-offer / Declined).
2. **KPI row** — Amount & term · Monthly payment · DTI after loan (vs. 33% auto-approve limit) · Credit score + band · Time to decision.
3. **What stands out** — 4–7 `InsightRow`s; tags from `IDENTITY | DOCUMENTS | AML | CREDIT | AFFORDABILITY | FRAUD | OFFER`; tag colour = severity (`good | warn | bad`); bold headline sentence + 1–2 evidence lines.
4. **Section 1 · Verification evidence** — table of checks: document quality, liveness, identity register, sanctions, PEP, adverse media, device/fraud. Columns: check, result, score, provider (mock), timestamp. Document cards with quality score. Document Resubmit shows the failed attempt and the passing re-upload as separate rows.
5. **Section 2 · Affordability** — `StackedBar` of monthly net income split into rent, existing debt, other expenses, new loan payment, residual. Table: gross annual income, net monthly income, DTI before, DTI after, policy limits.
6. **Section 3 · Scenario lab**
   - Presets (`SegmentedControl`): Base case, Rate +2pp, Rate +4pp, Income −20%, Job loss (3 mo), Living costs +15%, Longer term (60 mo), Custom.
   - Inputs (`NumberField`): rate %, term months, amount €, net-income change %, expenses change %, one-off shock month (income → 0 for N months, N = 0 disables).
   - Editing any input switches the preset to Custom.
   - Outputs: scenario outcome badge + fired rule text; KPIs (payment, DTI, total interest, min residual income); `LineChart` of remaining balance and monthly residual income; year-by-year amortization table (year, opening balance, interest, principal, closing balance); "Every scenario at a glance" table (preset → payment, DTI, outcome).
7. **Section 4 · Audit trail & decision** — timeline with mono timestamp, actor tag (Applicant / System / Reviewer), BIAN service-domain label, message, outcome colour. Decision box (terms, or decline reasons). Documents list.
   - **Reviewer Decision panel** (HITL personas only, while undecided): actions Approve · Approve with conditions · Decline · Request more information; rationale required (min 10 chars); conditions text required for "with conditions". Submit → `POST /case/:personaId/review` → appended audit event → outcome badge updates. A "Reset demo" restores the undecided state.
8. **Next step · Questions** — list from `buildQuestions(caseFile)`.
9. **Footer** — disclaimer (synthetic data, not a credit decision); policy thresholds table rendered from `POLICY`; BIAN service domains referenced.

## 6. Domain layer — `src/domain/`

Pure TypeScript, no React imports, 100% of exported functions unit-tested. UI never computes finance or policy itself.

| Module | Exports | Notes |
|---|---|---|
| `money.ts` | `fmtEur(n, {cents?})`, `fmtPct(n, dp?)`, `round2(n)` | `Intl.NumberFormat('en-IE', EUR)`. |
| `loan.ts` | `monthlyPayment(principal, aprPct, months)`, `amortize(principal, aprPct, months)`, `yearlySummary(rows)`, `totalInterest(rows)` | Annuity formula; zero-rate branch = principal / months. Final row absorbs rounding so closing balance = 0.00. |
| `affordability.ts` | `assessAffordability(facts, loan, adjustments?)` → `{ grossMonthlyIncome, netMonthlyIncome, dtiBefore, dtiAfter, residual }` | See definitions below. Zero income → `dtiBefore = dtiAfter = null`. |
| `policy.ts` | `POLICY`, `evaluatePolicy(input)` → `{ outcome, rules: FiredRule[] }` | See thresholds below. |
| `scenarios.ts` | `PRESETS`, `applyScenario(base, scenario)`, `runAllScenarios(base)` | Inputs clamped (Section 8). |
| `insights.ts` | `buildInsights(caseFile)` → `Insight[]` | Ordered bad → warn → good. |
| `questions.ts` | `buildQuestions(caseFile)` → `string[]` | Derived from insights and facts. |
| `caseFile.ts` | `buildCaseFile(personaId)` → `CaseFile \| null` | Null for unknown id. |

### Definitions
- **Gross monthly income** = `annualIncome / 12`.
- **DTI before** = existing monthly debt repayments / gross monthly income. **DTI after** = (existing monthly debt repayments + new loan payment) / gross monthly income. Rent and other expenses are *not* in DTI (they affect residual income).
- **Net monthly income** = gross monthly income × `POLICY.netIncomeFactor` (0.72, a flat effective-deduction assumption shown in the footer).
- **Residual income** = net monthly income − rent − existing debt repayments − other expenses − new loan payment. Display and scenario KPI only; not a policy rule.
- Policy is evaluated on the steady-state month. The scenario "one-off shock" (income → 0 for N months) affects the residual-income series and the *minimum residual* KPI only.
- **APR** comes from a score-banded rate table in `POLICY.rates`: score ≥ 720 → 6.9%; 680–719 → 7.9%; 640–679 → 8.9%. Scenario rate presets add percentage points on top.

### Policy thresholds (`POLICY`)
Thresholds are the ones the existing demo narrative already uses.

| Rule | Auto-approve | Refer | Decline |
|---|---|---|---|
| DTI after loan | ≤ 33% | > 33% and ≤ 45% → underwriting | > 45% |
| Credit score | ≥ 640 | 580–639 → underwriting | < 580 |
| Sanctions hit | — | — | any confirmed hit |
| PEP / adverse-media match | — | any unresolved match → compliance | — |
| Document quality | all ≥ 0.70 | any < 0.70 → request re-upload (not a final outcome) | — |
| Verifiable income | > 0 | — | 0 → decline "No verifiable income" |

Precedence: decline > refer-compliance > refer-underwriting > approve.

**Counter-offer:** applies only when the *sole* failing rule is DTI > 45% (a DTI-only decline). The engine keeps the requested term and score-banded APR and searches amounts from (requested − €1,000) down to €5,000 in €1,000 steps for the largest amount whose DTI after loan is ≤ 33%. If one exists the outcome is `counter-offer` with those terms; otherwise it stays `declined`. A DTI in the refer band never produces a counter-offer.

### Persona consistency
Each persona's facts in `data/personas.ts` must yield its target outcome (Section 2 table) through `evaluatePolicy`. A Vitest test asserts this for all six. Facts (income, debt repayments, rent, expenses, score) may be adjusted to satisfy the rules; the rules may not be special-cased per persona. Known required adjustments, checked for feasibility:
- `borderline-credit` (Sarah Miller): base DTI after loan must lie in (36%, 45%] with score ≥ 640, so that "Income −20%" pushes it above 45% (DTI-only decline → €5,000 counter-offer) while "Longer term (60 mo)" brings it to ≤ 33% (approve). Example that works: gross €2,500/mo, existing repayments €500/mo, score 650 → €15,000 / 36 mo @ 8.9%.
- `counter-offer` (Lisa Wang): score 640–679 (→ 8.9%), requested €15,000 / 24 mo must give DTI > 45%, €8,000 / 24 mo must give DTI ≤ 33% and €9,000 / 24 mo must not. This needs existing repayments < €513/mo; example that works: gross €1,800/mo, existing repayments €200/mo.
- `declined` (Tom Baker): score < 580.
- `happy-path` (Maria Santos): score ≥ 720 so APR is 6.9%.

**Narrative numbers:** any audit event or story text that quotes a computed figure (DTI, payment, score, threshold) is produced by a template function from computed values, never a hard-coded string, so text and numbers cannot disagree.

### Reference values (test fixtures)
- `monthlyPayment(15000, 6.9, 36)` = **462.47**
- `monthlyPayment(8000, 8.9, 24)` = **365.11**
- `monthlyPayment(15000, 8.9, 24)` = **684.58**

## 7. Data & state

- `src/data/personas.ts` — single source of truth per persona: identity & contact (from `personaDefaults`), loan request, income/expenses, credit score, verification checks with scores/providers/timestamps, documents, BIAN-labelled audit events, story-step narrative (from `storyScripts`), persona colour index. `personaDefaults.ts` and `storyScripts.ts` are removed once their consumers migrate.
- `DemoContext` — current persona + lens; persisted to `localStorage` inside try/catch with in-memory fallback. MSW handlers read the persona from the same storage key.
- **MSW** keeps all existing wizard endpoints; the decision endpoint now derives its result from `buildCaseFile`. New endpoints: `GET /case/:personaId/reviews`, `POST /case/:personaId/review`, `POST /demo/reset`.
- Every generated audit event carries the wizard `stage` it belongs to. `liveSnapshot(caseFile, stage)` (pure, in `domain/live.ts`) returns the events, check statuses, provisional risk and narrative visible at that stage; the sidebar renders it.
- Scenario lab state is local `useState`; derived results via `useMemo`.

## 8. Applicant lens & Compare page

### `/apply/:workflowId`
- Two columns: form (~640px) + sticky 360px Live Case File sidebar.
- Step indicator: mono eyebrow `STEP n OF 6 · <NAME>` + thin teal progress rule.
- Forms keep react-hook-form + zod and persona pre-fill; restyled fields (label above, muted hint, mono numeric inputs).
- Product step: live repayment preview via `monthlyPayment`.
- Verification step: checks resolve one by one with `StatusBadge` + score (existing polling).
- Decision step: reuses Case File outcome badge, KPI tiles and decision box; link "See how the bank decided →" to `/case/:personaId`.
- Sidebar: provisional risk meter, checks checklist, last five audit events (fade/slide in; respects `prefers-reduced-motion`), "What's happening now" narrative.

### `/compare`
- Table: one column per persona (persona colour header). Rows: credit score, DTI before, DTI after, checks summary, outcome, APR, monthly payment, time to decision, human in the loop.
- Second table: Lisa Wang requested vs counter-offer (amount, term, APR, payment, DTI, outcome).
- Filter pills: All / Auto-decided / Needed a human.

## 9. Error handling

- Unknown persona/workflow id → `EmptyState` with links to `/`.
- MSW startup: keep "start worker, then render" in `main.tsx`.
- Scenario input clamps: rate 0–30%, term 6–120 mo, amount €1,000–€100,000, income/expenses change −100% to +100%, shock months 0–12. Invalid input shows an inline message and the last valid result stays displayed.
- Zero income → DTI shown as "n/a", outcome decline with rule "No verifiable income".
- Zero rate → linear repayment branch.
- `localStorage` failures → in-memory fallback, no crash.

## 10. Testing

- Add dev deps: `vitest`, `@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom`, `jsdom`. Script `"test": "vitest run"`.
- **Domain unit tests:** every exported function; exact reference values (Section 6); each policy threshold boundary (e.g. DTI 33.00% approve, 33.01% refer, 45.00% refer, 45.01% decline; score 640/639/580/579; doc quality 0.70/0.69); precedence; counter-offer search; zero-income and zero-rate branches; clamping.
- **Persona consistency test:** all six target outcomes.
- **Component tests:** each primitive renders; selecting a scenario preset changes the outcome badge; reviewer decision appends an audit event and updates badge; lens toggle preserves persona; redirect routes resolve.
- **Completion gate:** `npm test`, `npm run build`, `npm run lint` all pass; visual check of `/`, `/apply/*`, `/case/*` (all six), `/compare` at desktop and 375px in the built-in browser.

## 11. Amendments (2026-10-08, during planning)

1. The scenario lab and "every scenario at a glance" use the full decision (`decide`, including the counter-offer search), so Sarah under "Income −20%" yields a €5,000 counter-offer rather than a plain decline (success criterion 3 updated).
2. The live sidebar is derived from stage-tagged audit events (`liveSnapshot`) instead of `caseEvents` on every MSW response.
3. Preset "Rent +15%" renamed "Living costs +15%" because the expenses input scales rent and other expenses together.
4. `policy.ts` exposes `evaluatePolicy(input)` (rules only, never `counter-offer`) and `decide(facts, terms)` (affordability + rules + counter-offer search).
5. (Final review) The wizard's loan and financial steps show the persona file read-only, with a link to the scenario lab for "what if" — the decision is always made on the persona file, so editable fields would be silently ignored.
6. (Final review) "Time to decision" is derived from the decision event in the audit trail, not stored separately.
7. (Final review) The live sidebar stacks below the form under `lg` instead of becoming a bottom drawer.
8. (Final review) The decision step keeps its own presentation of the same computed terms instead of reusing the case-file KPI tiles and decision box, and the verification step keeps its three-stage progression; per-check results and scores appear in the live sidebar and the case file.

## 12. Out of scope

Real KYC/credit/open-banking providers, authentication, server persistence, dark mode, i18n, PDF export, new chart libraries.
