import type { ReactNode } from 'react';
import { BIAN } from '../../domain/audit';
import { OUTCOME_LABEL, OUTCOME_TONE, type CaseFile } from '../../domain/caseFile';
import { fmtEur, fmtPct, fmtRate, fmtScore, fmtTime } from '../../domain/format';
import { POLICY } from '../../domain/policy';
import { REVIEW_LABEL, REVIEW_TONE, type ReviewRecord } from '../../domain/review';
import type { CheckResult, Tone } from '../../domain/types';
import { DataTable } from '../../ui/DataTable';
import { Panel, Section, StatusBadge, Tag } from '../../ui/primitives';
import { StackedBar } from '../../ui/StackedBar';
import { TONE_DOT, TONE_TEXT } from '../../ui/tone';

const RESULT_TONE: Record<CheckResult, Tone> = { pass: 'good', review: 'warn', fail: 'bad' };
const RESULT_WORD: Record<CheckResult, string> = { pass: 'PASS', review: 'REVIEW', fail: 'FAIL' };

function at(cf: CaseFile, minutes: number) {
  return fmtTime(new Date(Date.parse(cf.persona.startedAt) + minutes * 60_000).toISOString());
}

export function EvidenceSection({ cf }: { cf: CaseFile }) {
  const p = cf.persona;
  const docs = [...p.documents].sort((a, b) => a.minutesAfterStart - b.minutesAfterStart);
  return (
    <Section eyebrow="Section 1" title="Verification evidence" lede="Every identity, document and screening check run on this application, with the score each provider returned.">
      <DataTable caption="Verification evidence">
        <thead>
          <tr><th className="sticky-col">Check</th><th>Result</th><th className="text-right">Score</th><th>Provider</th><th>Time</th><th>Detail</th></tr>
        </thead>
        <tbody>
          {docs.map((d) => {
            const result: CheckResult = d.quality >= POLICY.docQualityMin ? 'pass' : 'fail';
            return (
              <tr key={`${d.name}-${d.minutesAfterStart}`}>
                <td className="sticky-col font-medium">{d.name}</td>
                <td><StatusBadge tone={RESULT_TONE[result]}>{RESULT_WORD[result]}</StatusBadge></td>
                <td className="num text-right">{fmtScore(d.quality)}</td>
                <td className="text-muted">Document AI (mock)</td>
                <td className="num whitespace-nowrap text-muted">{at(cf, d.minutesAfterStart)}</td>
                <td>Quality threshold 0.70</td>
              </tr>
            );
          })}
          {p.checks.map((c) => (
            <tr key={c.id}>
              <td className="sticky-col font-medium">{c.label}</td>
              <td><StatusBadge tone={RESULT_TONE[c.result]}>{RESULT_WORD[c.result]}</StatusBadge></td>
              <td className="num text-right">{fmtScore(c.score)}</td>
              <td className="text-muted">{c.provider}</td>
              <td className="num whitespace-nowrap text-muted">{at(cf, c.minutesAfterStart)}</td>
              <td className="min-w-[240px]">{c.detail}</td>
            </tr>
          ))}
        </tbody>
      </DataTable>
    </Section>
  );
}

export function AffordabilitySection({ cf }: { cf: CaseFile }) {
  const a = cf.decision.affordability;
  const f = cf.persona.form;
  const dtiTone = (v: number | null): Tone => (v === null || v > POLICY.dtiMax ? 'bad' : v > POLICY.dtiAuto ? 'warn' : 'good');
  return (
    <Section eyebrow="Section 2" title="Affordability" lede="Net income is estimated at 72% of gross. DTI counts debt repayments only; rent and living costs show up in what is left over.">
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <Panel className="p-5">
          <p className="mb-3 text-sm font-medium">Monthly net income of {fmtEur(a.netMonthlyIncome)}, after the new loan</p>
          <StackedBar
            ariaLabel="Monthly budget after the loan"
            format={(n) => fmtEur(n)}
            segments={[
              { label: 'Rent', value: f.monthlyRent, color: 'var(--color-p1)' },
              { label: 'Existing repayments', value: f.existingDebt, color: 'var(--color-p2)' },
              { label: 'Other expenses', value: f.otherExpenses, color: 'var(--color-p5)' },
              { label: 'New loan payment', value: a.payment, color: 'var(--color-p4)' },
              { label: 'Left over', value: Math.max(0, a.residual), color: 'var(--color-p3)' },
            ]}
          />
          {a.residual < 0 && <p className="mt-3 text-sm text-bad">Shortfall of {fmtEur(-a.residual)} a month.</p>}
        </Panel>
        <DataTable caption="Affordability">
          <tbody>
            <tr><td>Gross monthly income</td><td className="num text-right">{fmtEur(a.grossMonthlyIncome)}</td></tr>
            <tr><td>Net monthly income (× 0.72)</td><td className="num text-right">{fmtEur(a.netMonthlyIncome)}</td></tr>
            <tr><td>DTI before the loan</td><td className="num text-right">{a.dtiBefore === null ? 'n/a' : fmtPct(a.dtiBefore)}</td></tr>
            <tr><td>DTI after the loan</td><td className={`num text-right font-medium ${TONE_TEXT[dtiTone(a.dtiAfter)]}`}>{a.dtiAfter === null ? 'n/a' : fmtPct(a.dtiAfter)}</td></tr>
            <tr><td>Auto-approve limit</td><td className="num text-right">{fmtPct(POLICY.dtiAuto, 0)}</td></tr>
            <tr><td>Maximum</td><td className="num text-right">{fmtPct(POLICY.dtiMax, 0)}</td></tr>
          </tbody>
        </DataTable>
      </div>
    </Section>
  );
}

function DecisionBox({ cf, review }: { cf: CaseFile; review?: ReviewRecord }) {
  const d = cf.decision;
  const failing = d.rules.filter((r) => r.outcome && r.outcome !== 'approved');
  const terms = d.offer;
  const latest = new Map(cf.persona.documents.map((x) => [x.doc, x]));
  return (
    <div className="space-y-4">
      <Panel className="p-5" data-testid="decision-box">
        <p className="font-mono text-[11px] tracking-[0.12em] text-muted uppercase">Decision</p>
        {review ? (
          <>
            <p className={`mt-1 font-display text-xl font-semibold ${TONE_TEXT[REVIEW_TONE[review.action]]}`}>{REVIEW_LABEL[review.action]}</p>
            <p className="mt-1 text-sm text-muted">{review.event.actor}, after: {OUTCOME_LABEL[d.outcome].toLowerCase()}.</p>
            <p className="mt-2 text-sm">{review.rationale}</p>
            {review.conditions && <p className="mt-1 text-sm">Conditions: {review.conditions}</p>}
          </>
        ) : (
          <p className={`mt-1 font-display text-xl font-semibold ${TONE_TEXT[OUTCOME_TONE[d.outcome]]}`}>{OUTCOME_LABEL[d.outcome]}</p>
        )}
        {terms && d.offerAffordability && (
          <dl className="mt-3 grid grid-cols-2 gap-y-1 text-sm">
            <dt className="text-muted">Amount</dt>
            <dd className="num text-right">
              {d.outcome === 'counter-offer' && <s className="mr-2 text-muted">{fmtEur(d.requested.amount)}</s>}
              {fmtEur(terms.amount)}
            </dd>
            <dt className="text-muted">Rate</dt><dd className="num text-right">{fmtRate(terms.aprPct)} APR</dd>
            <dt className="text-muted">Term</dt><dd className="num text-right">{terms.termMonths} months</dd>
            <dt className="text-muted">Monthly</dt><dd className="num text-right">{fmtEur(d.offerAffordability.payment, { cents: true })}</dd>
          </dl>
        )}
        {!terms && failing.length > 0 && (
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">{failing.map((r) => <li key={r.text}>{r.text}</li>)}</ul>
        )}
      </Panel>
      <Panel className="p-5">
        <p className="font-mono text-[11px] tracking-[0.12em] text-muted uppercase">Documents</p>
        <ul className="mt-2 space-y-2 text-sm">
          {[...latest.values()].map((doc) => (
            <li key={doc.doc} className="flex items-center justify-between gap-2">
              <span>{doc.name}</span>
              <StatusBadge tone={doc.quality >= POLICY.docQualityMin ? 'good' : 'bad'}>{doc.quality >= POLICY.docQualityMin ? 'Verified' : 'Rejected'}</StatusBadge>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}

export function AuditSection({ cf, reviews, children }: { cf: CaseFile; reviews: ReviewRecord[]; children?: ReactNode }) {
  const events = [...cf.audit, ...reviews.map((r) => r.event)];
  const final = [...reviews].reverse().find((r) => r.action !== 'request-info');
  return (
    <Section eyebrow="Section 4" title="Audit trail and decision" lede="Every event is labelled with the BIAN service domain that produced it.">
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <ol className="space-y-4">
          {events.map((e, i) => (
            <li key={`${e.at}-${i}`} className="grid grid-cols-[12px_1fr] gap-3">
              <span className={`mt-1.5 h-2.5 w-2.5 rounded-full ${TONE_DOT[e.tone]}`} aria-hidden />
              <div>
                <p className="flex flex-wrap items-center gap-2 text-xs text-muted">
                  <span className="num">{fmtTime(e.at)}</span>
                  <Tag tone="info">{e.actor}</Tag>
                  <span className="font-mono">{e.domain}</span>
                </p>
                <p className="mt-0.5 text-[15px]">{e.text}</p>
              </div>
            </li>
          ))}
        </ol>
        <DecisionBox cf={cf} review={final} />
      </div>
      {children}
    </Section>
  );
}

export function QuestionsSection({ cf }: { cf: CaseFile }) {
  return (
    <Section eyebrow="Next step" title="Questions to put to the applicant">
      <ol className="list-decimal space-y-2 pl-6 marker:font-mono marker:text-muted">
        {cf.questions.map((q) => <li key={q} className="pl-1">{q}</li>)}
      </ol>
    </Section>
  );
}

export function PolicyFooter() {
  return (
    <footer className="mt-12 border-t border-line pt-6 text-sm text-muted">
      <p className="max-w-[80ch]">
        Synthetic data. Not a credit decision and not financial advice. The thresholds below are demo policy, applied identically to every
        application; every number on this page is computed from the application data.
      </p>
      <div className="mt-5 grid gap-6 lg:grid-cols-2">
        <DataTable caption="Policy thresholds">
          <thead><tr><th>Rule</th><th>Auto-approve</th><th>Refer</th><th>Decline</th></tr></thead>
          <tbody>
            <tr><td>DTI after loan</td><td className="num">≤ {fmtPct(POLICY.dtiAuto, 0)}</td><td className="num">to {fmtPct(POLICY.dtiMax, 0)}</td><td className="num">&gt; {fmtPct(POLICY.dtiMax, 0)}</td></tr>
            <tr><td>Credit score</td><td className="num">≥ {POLICY.scoreAuto}</td><td className="num">{POLICY.scoreMin}–{POLICY.scoreAuto - 1}</td><td className="num">&lt; {POLICY.scoreMin}</td></tr>
            <tr><td>Document quality</td><td className="num">≥ {POLICY.docQualityMin.toFixed(2)}</td><td>Re-upload below</td><td>—</td></tr>
            <tr><td>PEP / adverse media</td><td>No match</td><td>Compliance</td><td>—</td></tr>
            <tr><td>Sanctions</td><td>No match</td><td>—</td><td>Confirmed hit</td></tr>
            <tr><td>APR by score</td><td colSpan={3} className="num">{POLICY.rates.map((r) => `${r.minScore ? `≥ ${r.minScore}` : 'below'}: ${fmtRate(r.aprPct)}`).join(' · ')}</td></tr>
          </tbody>
        </DataTable>
        <div>
          <p className="font-mono text-[11px] tracking-[0.12em] uppercase">BIAN service domains referenced</p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {Object.values(BIAN).map((d) => <li key={d}><Tag tone="info">{d}</Tag></li>)}
          </ul>
        </div>
      </div>
    </footer>
  );
}
