import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { Kpi } from '../domain/caseFile';
import type { Insight } from '../domain/insights';
import type { Tone } from '../domain/types';
import { TONE_OUTLINE, TONE_SOFT, TONE_TEXT } from './tone';

export function Eyebrow({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <p className={`font-mono text-[11px] tracking-[0.12em] text-muted uppercase ${className}`}>{children}</p>;
}

export function Panel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-lg border border-line bg-surface ${className}`}>{children}</div>;
}

export function PageHeader({ eyebrow, title, lede, aside }: { eyebrow: ReactNode; title: ReactNode; lede?: ReactNode; aside?: ReactNode }) {
  return (
    <header className="pt-8 pb-6">
      <Eyebrow>{eyebrow}</Eyebrow>
      <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
        <h1 className="font-display text-[32px] leading-tight font-semibold text-ink md:text-[42px]">{title}</h1>
        {aside}
      </div>
      {lede && <p className="mt-3 max-w-[68ch] text-ink/90">{lede}</p>}
    </header>
  );
}

export function Section({ id, eyebrow, title, lede, children }: { id?: string; eyebrow: ReactNode; title: ReactNode; lede?: ReactNode; children: ReactNode }) {
  return (
    <section id={id} className="mt-12 border-t-2 border-ink pt-5">
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2 className="mt-1 font-display text-[24px] leading-tight font-semibold md:text-[28px]">{title}</h2>
      {lede && <p className="mt-2 max-w-[72ch] text-sm text-muted">{lede}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}

export function KpiTile({ kpi }: { kpi: Kpi }) {
  return (
    <Panel className="p-4">
      <p className={`num text-[22px] leading-none font-medium ${kpi.tone ? TONE_TEXT[kpi.tone] : 'text-ink'}`}>{kpi.value}</p>
      <p className="mt-2 text-sm text-ink">{kpi.label}</p>
      <p className="text-xs text-muted">{kpi.sub}</p>
    </Panel>
  );
}

export function KpiRow({ kpis, cols = 'md:grid-cols-5' }: { kpis: Kpi[]; cols?: string }) {
  return (
    <div className={`grid grid-cols-2 gap-3 ${cols}`}>
      {kpis.map((k) => <KpiTile key={k.label} kpi={k} />)}
    </div>
  );
}

export function Tag({ tone, children }: { tone: Tone; children: ReactNode }) {
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-0.5 font-mono text-[11px] tracking-wider uppercase ${TONE_OUTLINE[tone]}`}>
      {children}
    </span>
  );
}

export function InsightRow({ insight }: { insight: Insight }) {
  return (
    <Panel className="grid gap-2 p-4 sm:grid-cols-[132px_1fr] sm:gap-4">
      <div><Tag tone={insight.tone}>{insight.tag}</Tag></div>
      <p className="text-[15px]">
        <strong className="font-semibold">{insight.headline}</strong> <span className="text-ink/85">{insight.detail}</span>
      </p>
    </Panel>
  );
}

export function StatusBadge({ tone, children, size = 'sm' }: { tone: Tone; children: ReactNode; size?: 'sm' | 'lg' }) {
  const sz = size === 'lg' ? 'px-3.5 py-1.5 text-sm' : 'px-2 py-0.5 text-xs';
  return <span className={`inline-flex items-center rounded-full border font-medium whitespace-nowrap ${sz} ${TONE_SOFT[tone]}`}>{children}</span>;
}

export function EmptyState({ title, body, actionHref, actionLabel }: { title: string; body: string; actionHref?: string; actionLabel?: string }) {
  return (
    <Panel className="mx-auto my-16 max-w-lg p-8 text-center">
      <h1 className="font-display text-2xl font-semibold">{title}</h1>
      <p className="mt-2 text-muted">{body}</p>
      {actionHref && actionLabel && (
        <Link to={actionHref} className="mt-5 inline-block font-medium text-accent underline underline-offset-4">{actionLabel}</Link>
      )}
    </Panel>
  );
}
