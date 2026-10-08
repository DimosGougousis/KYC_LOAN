import { useMemo, useState, type ReactNode } from 'react';
import { buildCaseFile, OUTCOME_LABEL, OUTCOME_TONE, type CaseFile } from '../domain/caseFile';
import { fmtEur, fmtPct, fmtRate } from '../domain/format';
import { allCases } from '../domain/portfolio';
import type { LoanTerms } from '../domain/types';
import { DataTable } from '../ui/DataTable';
import { PageHeader, Section, StatusBadge } from '../ui/primitives';
import { SegmentedControl } from '../ui/SegmentedControl';

type Filter = 'all' | 'auto' | 'human';

const pct = (v: number | null) => (v === null ? 'n/a' : fmtPct(v));

const ROWS: { label: string; cell: (c: CaseFile) => ReactNode }[] = [
  { label: 'Credit score', cell: (c) => <span className="num">{c.persona.creditScore}</span> },
  { label: 'DTI before', cell: (c) => <span className="num">{pct(c.decision.affordability.dtiBefore)}</span> },
  { label: 'DTI after', cell: (c) => <span className="num">{pct(c.decision.affordability.dtiAfter)}</span> },
  {
    label: 'Checks',
    cell: (c) => {
      const review = c.persona.checks.filter((x) => x.result !== 'pass').length;
      return <span className="num">{c.persona.checks.length - review} passed{review ? ` · ${review} review` : ''}</span>;
    },
  },
  { label: 'Outcome', cell: (c) => <StatusBadge tone={OUTCOME_TONE[c.decision.outcome]}>{OUTCOME_LABEL[c.decision.outcome]}</StatusBadge> },
  { label: 'APR', cell: (c) => <span className="num">{fmtRate((c.decision.offer ?? c.terms).aprPct)}</span> },
  {
    label: 'Monthly payment',
    cell: (c) => {
      const d = c.decision;
      if (d.outcome === 'declined') return <span className="text-muted">—</span>;
      const payment = d.offerAffordability?.payment ?? d.affordability.payment;
      return <span className={`num ${d.offer ? '' : 'text-muted'}`}>{fmtEur(payment, { cents: true })}</span>;
    },
  },
  { label: 'Time to decision', cell: (c) => <span className="num">{c.persona.decisionMinutes} min</span> },
  { label: 'Human in the loop', cell: (c) => (c.needsReviewer ? 'Yes' : 'No') },
];

function TermsRow({ label, req, offer }: { label: string; req: ReactNode; offer: ReactNode }) {
  return <tr><td>{label}</td><td className="num text-right">{req}</td><td className="num text-right">{offer}</td></tr>;
}

export default function ComparePage() {
  const cases = useMemo(() => allCases(), []);
  const [filter, setFilter] = useState<Filter>('all');
  const shown = cases.filter((c) => filter === 'all' || (filter === 'human') === c.needsReviewer);

  const lisa = useMemo(() => buildCaseFile('counter-offer')!, []);
  const d = lisa.decision;
  const offer = d.offer as LoanTerms;

  return (
    <main className="mx-auto max-w-[1180px] px-4 pb-16 md:px-8">
      <PageHeader
        eyebrow="Compare"
        title="Six applications side by side"
        lede="The same policy applied to six different people. Filter to the cases the engine decided on its own, or the ones it handed to a person."
      />
      <SegmentedControl<Filter>
        label="Filter"
        value={filter}
        onChange={setFilter}
        options={[{ id: 'all', label: 'All' }, { id: 'auto', label: 'Auto-decided' }, { id: 'human', label: 'Needed a human' }]}
      />
      <div className="mt-5">
        <DataTable caption="Applications compared">
          <thead>
            <tr>
              <th className="sticky-col">Measure</th>
              {shown.map((c) => (
                <th key={c.persona.id} style={{ borderTop: `3px solid ${c.persona.color}` }}>
                  <span className="block text-ink">{c.persona.name}</span>
                  <span className="text-xs font-normal">{c.persona.label}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row) => (
              <tr key={row.label}>
                <td className="sticky-col font-medium whitespace-nowrap">{row.label}</td>
                {shown.map((c) => <td key={c.persona.id} className="whitespace-nowrap">{row.cell(c)}</td>)}
              </tr>
            ))}
          </tbody>
        </DataTable>
      </div>

      <Section
        eyebrow="Counter-offer"
        title="Requested versus counter-offer"
        lede={`${lisa.persona.name}'s full request fails on DTI alone, so the engine searches for the largest amount at the same term and rate that fits the 33% auto-approve limit.`}
      >
        <div className="max-w-xl">
          <DataTable caption="Requested versus counter-offer">
            <thead><tr><th></th><th className="text-right">Requested</th><th className="text-right">Counter-offer</th></tr></thead>
            <tbody>
              <TermsRow label="Amount" req={fmtEur(d.requested.amount)} offer={fmtEur(offer.amount)} />
              <TermsRow label="Term" req={`${d.requested.termMonths} months`} offer={`${offer.termMonths} months`} />
              <TermsRow label="APR" req={fmtRate(d.requested.aprPct)} offer={fmtRate(offer.aprPct)} />
              <TermsRow label="Monthly payment" req={fmtEur(d.affordability.payment, { cents: true })} offer={fmtEur(d.offerAffordability!.payment, { cents: true })} />
              <TermsRow label="DTI after" req={pct(d.affordability.dtiAfter)} offer={pct(d.offerAffordability!.dtiAfter)} />
              <TermsRow
                label="Outcome"
                req={<StatusBadge tone="bad">Declined on DTI</StatusBadge>}
                offer={<StatusBadge tone="good">Auto-approves</StatusBadge>}
              />
            </tbody>
          </DataTable>
        </div>
      </Section>
    </main>
  );
}
