import type { Persona } from '../data/personas';
import { fmtEur, fmtPct, fmtRate, fmtScore } from './format';
import { amortize, totalInterest } from './loan';
import { POLICY, scoreBand, type Decision } from './policy';
import type { Tone } from './types';

export type InsightTag = 'IDENTITY' | 'DOCUMENTS' | 'AML' | 'CREDIT' | 'AFFORDABILITY' | 'FRAUD' | 'OFFER';
export interface Insight { tag: InsightTag; tone: Tone; headline: string; detail: string }

const RANK: Record<Tone, number> = { bad: 0, warn: 1, good: 2, info: 3 };

export function buildInsights(p: Persona, d: Decision): Insight[] {
  const out: Insight[] = [];
  const check = (id: string) => p.checks.find((c) => c.id === id)!;

  const live = check('liveness');
  const reg = check('identity-register');
  out.push(live.result === 'pass' && reg.result === 'pass'
    ? { tag: 'IDENTITY', tone: 'good', headline: 'Identity confirmed.', detail: `Liveness ${fmtScore(live.score)} and register match ${fmtScore(reg.score)} (${live.provider}, ${reg.provider}).` }
    : { tag: 'IDENTITY', tone: 'bad', headline: 'Identity not confirmed.', detail: `${live.label}: ${live.detail} ${reg.label}: ${reg.detail}` });

  const ordered = [...p.documents].sort((a, b) => a.minutesAfterStart - b.minutesAfterStart);
  const failed = ordered.find((x) => x.quality < POLICY.docQualityMin);
  const latest = new Map(ordered.map((x) => [x.doc, x]));
  const latestMin = Math.min(...[...latest.values()].map((x) => x.quality));
  if (failed && latestMin >= POLICY.docQualityMin) {
    const fix = latest.get(failed.doc)!;
    out.push({
      tag: 'DOCUMENTS', tone: 'warn', headline: `A low-quality ${failed.name.toLowerCase()} scan was caught and fixed.`,
      detail: `The first capture scored ${fmtScore(failed.quality)} against a 0.70 minimum; the re-upload scored ${fmtScore(fix.quality)}.`,
    });
  } else if (latestMin < POLICY.docQualityMin) {
    out.push({ tag: 'DOCUMENTS', tone: 'bad', headline: 'Documents still below quality threshold.', detail: `Lowest current score ${fmtScore(latestMin)} against a 0.70 minimum.` });
  } else {
    out.push({ tag: 'DOCUMENTS', tone: 'good', headline: 'Documents are clear.', detail: `Lowest quality score ${fmtScore(latestMin)} against a 0.70 minimum.` });
  }

  const aml = p.checks.filter((c) => ['sanctions', 'pep', 'adverse-media'].includes(c.id) && c.result !== 'pass');
  if (aml.length) {
    const c = aml[0];
    out.push({ tag: 'AML', tone: 'bad', headline: `${c.label} match needs a human.`, detail: `${c.detail} (${c.provider}).` });
  } else {
    out.push({
      tag: 'AML', tone: 'good', headline: 'No sanctions, PEP or adverse-media hits.',
      detail: `Screened against ${check('sanctions').provider}, ${check('pep').provider} and ${check('adverse-media').provider}.`,
    });
  }

  const s = p.creditScore;
  out.push({
    tag: 'CREDIT', tone: s < POLICY.scoreMin ? 'bad' : s < POLICY.scoreAuto ? 'warn' : 'good',
    headline: `Credit score ${s} (${scoreBand(s)}).`,
    detail: `From ${p.bureau}. Auto-approve needs 640; below 580 declines. Prices at ${fmtRate(d.requested.aprPct)} APR.`,
  });

  const a = d.affordability;
  const dti = a.dtiAfter;
  if (dti === null) {
    out.push({ tag: 'AFFORDABILITY', tone: 'bad', headline: 'No verifiable income.', detail: 'DTI cannot be calculated without income.' });
  } else {
    const tone: Tone = dti > POLICY.dtiMax ? 'bad' : dti > POLICY.dtiAuto ? 'warn' : 'good';
    const headline = tone === 'good' ? 'Repayments fit comfortably.' : tone === 'warn' ? 'Affordability is borderline.' : 'Repayments would take too much of income.';
    out.push({
      tag: 'AFFORDABILITY', tone, headline,
      detail: `DTI after the loan is ${fmtPct(dti)} (auto-approve ≤ 33%, maximum 45%). ${fmtEur(a.residual)} a month is left after rent, debts and living costs.`,
    });
  }

  const fraud = check('device-fraud');
  out.push({
    tag: 'FRAUD', tone: fraud.result === 'pass' ? 'good' : 'bad',
    headline: fraud.result === 'pass' ? 'No device or behavioural fraud signals.' : 'Fraud signals detected.',
    detail: `${fraud.detail} Risk ${fmtScore(fraud.score)}.`,
  });

  if (d.outcome === 'counter-offer') {
    const o = d.offer!;
    const oa = d.offerAffordability!;
    out.push({
      tag: 'OFFER', tone: 'warn', headline: 'A smaller loan fits policy.',
      detail: `${fmtEur(o.amount)} over ${o.termMonths} months at ${fmtRate(o.aprPct)} keeps DTI at ${fmtPct(oa.dtiAfter!)}; the requested ${fmtEur(d.requested.amount)} would be ${fmtPct(dti!)}.`,
    });
  } else if (d.outcome === 'approved') {
    const r = d.requested;
    const interest = totalInterest(amortize(r.amount, r.aprPct, r.termMonths));
    out.push({
      tag: 'OFFER', tone: 'good', headline: 'Full amount approved.',
      detail: `${fmtEur(r.amount)} over ${r.termMonths} months at ${fmtRate(r.aprPct)} APR: ${fmtEur(a.payment, { cents: true })} a month, ${fmtEur(interest, { cents: true })} total interest.`,
    });
  }

  return out
    .map((x, i) => ({ x, i }))
    .sort((m, n) => RANK[m.x.tone] - RANK[n.x.tone] || m.i - n.i)
    .map(({ x }) => x);
}
