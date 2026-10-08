import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { OUTCOME_LABEL, OUTCOME_TONE } from '../domain/caseFile';
import { fmtEur, fmtPct } from '../domain/format';
import { allCases, portfolioKpis } from '../domain/portfolio';
import { useDemo } from '../lib/demo';
import { DataTable } from '../ui/DataTable';
import { Eyebrow, KpiRow, PageHeader, Panel, Section, StatusBadge } from '../ui/primitives';

export default function Home() {
  const cases = useMemo(() => allCases(), []);
  const { setPersonaId } = useDemo();
  const navigate = useNavigate();

  return (
    <main className="mx-auto max-w-[1180px] px-4 pb-16 md:px-8">
      <PageHeader
        eyebrow="KYC & loan onboarding · demo · synthetic data"
        title="Six applications, two ways to look at them"
        lede="Walk through onboarding as the applicant, then open the reviewer's case file to see exactly why the bank decided what it did. Every figure is computed live from the application data by one shared policy engine."
      />
      <KpiRow kpis={portfolioKpis(cases)} />

      <Section eyebrow="Step 1" title="Pick an application" lede="Apply as a persona to see the customer journey, or open the case file to see the reviewer's view.">
        <DataTable caption="Demo applications">
          <thead>
            <tr>
              <th className="sticky-col">Applicant</th><th>Scenario</th><th className="text-right">Request</th>
              <th className="text-right">Score</th><th className="text-right">DTI after</th><th>Outcome</th><th>Explore</th>
            </tr>
          </thead>
          <tbody>
            {cases.map((c) => {
              const p = c.persona;
              const dti = c.decision.affordability.dtiAfter;
              return (
                <tr key={p.id}>
                  <td className="sticky-col">
                    <div className="flex items-center gap-2 whitespace-nowrap">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: p.color }} aria-hidden />
                      <span className="font-medium">{p.name}</span>
                    </div>
                    <span className="text-xs text-muted">{p.label}</span>
                  </td>
                  <td className="min-w-[220px] text-ink/85">{p.tagline}</td>
                  <td className="num text-right whitespace-nowrap">{fmtEur(c.terms.amount)} · {c.terms.termMonths} mo</td>
                  <td className="num text-right">{p.creditScore}</td>
                  <td className="num text-right">{dti === null ? 'n/a' : fmtPct(dti)}</td>
                  <td><StatusBadge tone={OUTCOME_TONE[c.decision.outcome]}>{OUTCOME_LABEL[c.decision.outcome]}</StatusBadge></td>
                  <td>
                    <div className="flex items-center gap-3 whitespace-nowrap">
                      <button
                        type="button"
                        aria-label={`Apply as ${p.name}`}
                        onClick={() => { setPersonaId(p.id); navigate('/apply/new'); }}
                        className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-white hover:bg-accent/90"
                      >
                        Apply
                      </button>
                      <Link to={`/case/${p.id}`} className="text-sm font-medium text-accent underline underline-offset-4">Open case file</Link>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </DataTable>
      </Section>

      <Section eyebrow="Two lenses" title="The same application, seen twice">
        <div className="grid gap-4 md:grid-cols-2">
          <Panel className="p-5">
            <Eyebrow>Applicant lens</Eyebrow>
            <h3 className="mt-1 font-display text-xl font-semibold">What the customer does</h3>
            <p className="mt-2 text-sm text-ink/85">
              A six-step application with pre-filled persona data. A live case file beside the form shows checks resolving, the audit trail growing
              and the provisional risk changing as the applicant moves through each step.
            </p>
            <Link to="/apply/new" className="mt-3 inline-block text-sm font-medium text-accent underline underline-offset-4">Start an application →</Link>
          </Panel>
          <Panel className="p-5">
            <Eyebrow>Reviewer lens</Eyebrow>
            <h3 className="mt-1 font-display text-xl font-semibold">Why the bank decided</h3>
            <p className="mt-2 text-sm text-ink/85">
              A case file in the style of an investment review: what stands out, verification evidence, an affordability breakdown, a scenario lab,
              the audit trail and the questions a reviewer should ask. Referred cases end in a human decision.
            </p>
            <Link to="/compare" className="mt-3 inline-block text-sm font-medium text-accent underline underline-offset-4">Compare all six →</Link>
          </Panel>
        </div>
      </Section>
    </main>
  );
}
