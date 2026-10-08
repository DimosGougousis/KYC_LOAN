import { useMemo, useState } from 'react';
import type { Persona } from '../../data/personas';
import { OUTCOME_LABEL, OUTCOME_TONE } from '../../domain/caseFile';
import { fmtEur, fmtPct, fmtRate } from '../../domain/format';
import {
  baseInputs, clampInputs, parseInputs, PRESETS, runAllScenarios, runScenario,
  type InputKey, type PresetId, type ScenarioInputs,
} from '../../domain/scenarios';
import { DataTable } from '../../ui/DataTable';
import { LineChart } from '../../ui/LineChart';
import { NumberField } from '../../ui/NumberField';
import { KpiRow, Panel, StatusBadge } from '../../ui/primitives';
import { SegmentedControl } from '../../ui/SegmentedControl';

const FIELDS: { key: InputKey; label: string; suffix: string }[] = [
  { key: 'amount', label: 'Amount', suffix: '€' },
  { key: 'termMonths', label: 'Term', suffix: 'months' },
  { key: 'aprPct', label: 'APR', suffix: '%' },
  { key: 'incomeChangePct', label: 'Income change', suffix: '%' },
  { key: 'expensesChangePct', label: 'Living costs change', suffix: '%' },
  { key: 'shockMonths', label: 'Months with no income', suffix: 'from month 1' },
];

type Choice = PresetId | 'custom';

const toDraft = (i: ScenarioInputs) =>
  Object.fromEntries(FIELDS.map((f) => [f.key, String(Number(i[f.key].toFixed(2)))])) as Record<InputKey, string>;

export function ScenarioLab({ persona }: { persona: Persona }) {
  const base = useMemo(() => baseInputs(persona), [persona]);
  const [preset, setPreset] = useState<Choice>('base');
  const [draft, setDraft] = useState(() => toDraft(base));
  const [valid, setValid] = useState<ScenarioInputs>(base);
  const { errors } = parseInputs(draft);

  function choose(id: Choice) {
    setPreset(id);
    if (id === 'custom') return;
    const next = clampInputs(PRESETS.find((p) => p.id === id)!.apply(base));
    setDraft(toDraft(next));
    setValid(next);
  }

  function edit(key: InputKey, value: string) {
    const d = { ...draft, [key]: value };
    setDraft(d);
    setPreset('custom');
    // Invalid drafts keep the last valid result on screen.
    const parsed = parseInputs(d);
    if (parsed.inputs) setValid(parsed.inputs);
  }

  const r = useMemo(() => runScenario(persona, valid), [persona, valid]);
  const all = useMemo(() => runAllScenarios(persona), [persona]);
  const d = r.decision;
  const offerText = d.outcome === 'counter-offer' && d.offer ? ` · ${fmtEur(d.offer.amount)} over ${d.offer.termMonths} months` : '';
  const fired = d.rules.filter((x) => x.outcome && x.outcome !== 'approved').map((x) => x.text);
  const xLabels = [
    { index: 0, label: 'Start' },
    ...r.years.map((y) => ({ index: Math.min(y.year * 12, valid.termMonths), label: `Yr ${y.year}` })),
  ];
  const options: { id: Choice; label: string }[] = [...PRESETS.map((p) => ({ id: p.id as Choice, label: p.label })), { id: 'custom', label: 'Custom' }];

  return (
    <div className="grid gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
      <Panel className="h-fit space-y-5 p-5">
        <div>
          <p className="mb-2 text-sm font-medium">Scenario</p>
          <SegmentedControl label="Scenario preset" value={preset} onChange={choose} options={options} />
          <p className="mt-2 text-sm text-muted">{preset === 'custom' ? 'Your own inputs.' : PRESETS.find((p) => p.id === preset)!.blurb}</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {FIELDS.map((f) => (
            <NumberField key={f.key} id={`sl-${f.key}`} label={f.label} suffix={f.suffix} value={draft[f.key]} error={errors[f.key]} onChange={(v) => edit(f.key, v)} />
          ))}
        </div>
        <p className="text-xs text-muted">Policy is tested on a normal month. Months with no income affect only the left-over line and the lowest-month figure.</p>
      </Panel>

      <div className="min-w-0 space-y-5">
        <div data-testid="scenario-outcome" className="flex flex-wrap items-center gap-3">
          <StatusBadge tone={OUTCOME_TONE[d.outcome]} size="lg">{OUTCOME_LABEL[d.outcome]}{offerText}</StatusBadge>
          {fired.length > 0 && <p className="text-sm text-muted">{fired.join('; ')}.</p>}
        </div>
        <KpiRow
          cols="sm:grid-cols-3 2xl:grid-cols-5"
          kpis={[
            { label: 'Monthly payment', value: fmtEur(r.payment, { cents: true }), sub: `${fmtRate(valid.aprPct)} APR` },
            { label: 'DTI after loan', value: r.dtiAfter === null ? 'n/a' : fmtPct(r.dtiAfter), sub: 'Auto-approve ≤ 33%' },
            { label: 'Total interest', value: fmtEur(r.totalInterest), sub: `${valid.termMonths} months` },
            { label: 'Lowest month left over', value: fmtEur(r.minResidual), sub: 'after all costs', tone: r.minResidual < 0 ? 'bad' : undefined },
            { label: 'Amount tested', value: fmtEur(valid.amount), sub: preset === 'custom' ? 'custom' : 'preset' },
          ]}
        />
        <Panel className="p-4">
          <LineChart
            ariaLabel="Remaining balance and money left over each month"
            format={(n) => fmtEur(n)}
            xLabels={xLabels}
            series={[
              { id: 'balance', label: 'Remaining balance', color: 'var(--color-p2)', values: r.balance },
              { id: 'residual', label: 'Left over each month', color: 'var(--color-p1)', values: [r.residual[0], ...r.residual], dashed: true },
            ]}
          />
        </Panel>
        <DataTable caption="Year-by-year repayment">
          <thead>
            <tr><th>Year</th><th className="text-right">Opening</th><th className="text-right">Interest</th><th className="text-right">Principal</th><th className="text-right">Closing</th></tr>
          </thead>
          <tbody>
            {r.years.map((y) => (
              <tr key={y.year}>
                <td>Year {y.year}</td>
                {[y.opening, y.interest, y.principal, y.closing].map((v, i) => <td key={i} className="num text-right">{fmtEur(v, { cents: true })}</td>)}
              </tr>
            ))}
          </tbody>
        </DataTable>
        <DataTable caption="Every scenario at a glance">
          <thead>
            <tr><th>Scenario</th><th className="text-right">Payment</th><th className="text-right">DTI</th><th className="text-right">Lowest month</th><th>Outcome</th></tr>
          </thead>
          <tbody>
            {all.map((s) => (
              <tr key={s.id} className={s.id === preset ? 'bg-accent-soft' : undefined}>
                <td>{s.label}</td>
                <td className="num text-right">{fmtEur(s.result.payment, { cents: true })}</td>
                <td className="num text-right">{s.result.dtiAfter === null ? 'n/a' : fmtPct(s.result.dtiAfter)}</td>
                <td className={`num text-right ${s.result.minResidual < 0 ? 'text-bad' : ''}`}>{fmtEur(s.result.minResidual)}</td>
                <td><StatusBadge tone={OUTCOME_TONE[s.result.decision.outcome]}>{OUTCOME_LABEL[s.result.decision.outcome]}</StatusBadge></td>
              </tr>
            ))}
          </tbody>
        </DataTable>
      </div>
    </div>
  );
}
