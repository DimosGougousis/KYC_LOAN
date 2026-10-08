import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { AffordabilitySection, AuditSection, EvidenceSection, PolicyFooter, QuestionsSection } from '../components/case/CaseSections';
import { ReviewerPanel } from '../components/case/ReviewerPanel';
import { ScenarioLab } from '../components/case/ScenarioLab';
import { buildCaseFile, OUTCOME_LABEL, OUTCOME_TONE } from '../domain/caseFile';
import { fmtEur, fmtTime } from '../domain/format';
import { isFinalReview, REVIEW_LABEL, REVIEW_TONE, type ReviewRecord } from '../domain/review';
import { api } from '../lib/api';
import { useDemo } from '../lib/demo';
import { EmptyState, InsightRow, KpiRow, PageHeader, Section, StatusBadge } from '../ui/primitives';

export default function CaseFilePage() {
  const { personaId } = useParams();
  const { personaId: current, setPersonaId } = useDemo();
  const cf = useMemo(() => buildCaseFile(personaId), [personaId]);
  useEffect(() => {
    if (cf && cf.persona.id !== current) setPersonaId(cf.persona.id);
  }, [cf, current, setPersonaId]);
  const reviews = useQuery({
    queryKey: ['reviews', personaId],
    queryFn: () => api<ReviewRecord[]>(`/case/${personaId}/reviews`),
    enabled: !!cf,
  });

  if (!cf) {
    return <EmptyState title="Case not found" body="There is no application with that id in this demo." actionHref="/" actionLabel="Back to all cases" />;
  }

  const p = cf.persona;
  const records = reviews.data ?? [];
  const last = records.at(-1);
  const decided = !!last && isFinalReview(last.action);
  const badge = last
    ? { label: REVIEW_LABEL[last.action], tone: REVIEW_TONE[last.action] }
    : { label: OUTCOME_LABEL[cf.decision.outcome], tone: OUTCOME_TONE[cf.decision.outcome] };
  const role = cf.decision.outcome === 'refer-compliance' ? 'Compliance officer' : 'Underwriter';

  return (
    <main className="mx-auto max-w-[1180px] px-4 pb-16 md:px-8">
      <PageHeader
        eyebrow={<>Case file · {p.applicationId} · submitted {fmtTime(cf.submittedAt)}</>}
        title={`${p.name} — ${fmtEur(cf.terms.amount)} personal loan`}
        lede={`${p.tagline} ${p.form.firstName} asked for ${fmtEur(cf.terms.amount)} over ${cf.terms.termMonths} months for ${p.purpose.toLowerCase()}. Everything below is computed from the application data by the demo policy engine.`}
        aside={<span data-testid="outcome-badge"><StatusBadge tone={badge.tone} size="lg">{badge.label}</StatusBadge></span>}
      />
      <KpiRow kpis={cf.kpis} />
      <Section eyebrow="Summary" title="What stands out">
        <div className="space-y-2">{cf.insights.map((i) => <InsightRow key={i.tag} insight={i} />)}</div>
      </Section>
      <EvidenceSection cf={cf} />
      <AffordabilitySection cf={cf} />
      <Section
        id="scenario-lab"
        eyebrow="Section 3"
        title="Scenario lab: stress the loan"
        lede="A simple affordability model, not a forecast. Pick a preset or edit any number; the outcome, chart and tables rebuild."
      >
        <ScenarioLab key={p.id} persona={p} />
      </Section>
      <AuditSection cf={cf} reviews={records}>
        {cf.needsReviewer && !decided && <ReviewerPanel personaId={p.id} role={role} />}
      </AuditSection>
      <QuestionsSection cf={cf} />
      <PolicyFooter />
    </main>
  );
}
