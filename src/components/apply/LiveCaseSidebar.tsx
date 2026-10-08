import { Link } from 'react-router-dom';
import type { CaseFile } from '../../domain/caseFile';
import { fmtTime } from '../../domain/format';
import { liveSnapshot, type LiveCheck } from '../../domain/live';
import type { Stage, Tone } from '../../domain/types';
import { Eyebrow, Panel, StatusBadge, Tag } from '../../ui/primitives';
import { TONE_DOT } from '../../ui/tone';

const STATUS_TONE: Record<LiveCheck['status'], Tone> = { pending: 'info', pass: 'good', review: 'warn', fail: 'bad' };
const STATUS_TEXT: Record<LiveCheck['status'], string> = { pending: 'Pending', pass: 'Pass', review: 'Review', fail: 'Fail' };

export function LiveCaseSidebar({ cf, stage, sub }: { cf: CaseFile; stage: Stage; sub?: string }) {
  const s = liveSnapshot(cf, stage, sub);
  return (
    <aside aria-label="Live case file" className="lg:sticky lg:top-20 lg:self-start">
      <Panel className="p-5">
        <Eyebrow>Live case file · {cf.persona.applicationId}</Eyebrow>
        <div className="mt-3 flex items-center justify-between gap-3">
          <span className="text-sm text-muted">Provisional risk</span>
          <StatusBadge tone={s.risk.tone}>{s.risk.label}</StatusBadge>
        </div>
        <p className="mt-3 text-sm">{s.narrative}</p>
        <ul className="mt-4 space-y-1.5 border-t border-line pt-4">
          {s.checks.map((c) => (
            <li key={c.label} className="flex items-center justify-between text-sm">
              <span>{c.label}</span>
              <StatusBadge tone={STATUS_TONE[c.status]}>{STATUS_TEXT[c.status]}</StatusBadge>
            </li>
          ))}
        </ul>
        <ol className="mt-4 space-y-3 border-t border-line pt-4">
          {s.events.map((e) => (
            <li key={`${e.at}-${e.text}`} className="fade-in flex gap-2.5 text-sm">
              <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${TONE_DOT[e.tone]}`} aria-hidden />
              <div className="min-w-0">
                <p className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted">
                  <span className="num">{fmtTime(e.at)}</span>
                  <Tag tone="info">{e.actor}</Tag>
                </p>
                <p className="mt-0.5">{e.text}</p>
              </div>
            </li>
          ))}
        </ol>
        <Link to={`/case/${cf.persona.id}`} className="mt-5 inline-block text-sm font-medium text-accent underline underline-offset-4">
          Open full case file →
        </Link>
      </Panel>
    </aside>
  );
}
