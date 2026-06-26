import type { ApplicationPassportData, AuditOutcome, OutcomeColor } from '../../data/storyScripts';

interface ApplicationPassportProps {
  passport: ApplicationPassportData;
  outcomeColor: OutcomeColor;
}

const AUDIT_DOT: Record<AuditOutcome, string> = {
  pass:      'bg-green-500',
  fail:      'bg-red-500',
  escalated: 'bg-amber-500',
  approved:  'bg-green-600',
  declined:  'bg-red-600',
  info:      'bg-slate-300',
};

const AUDIT_TEXT: Record<AuditOutcome, string> = {
  pass:      'text-green-700',
  fail:      'text-red-700',
  escalated: 'text-amber-700',
  approved:  'text-green-700',
  declined:  'text-red-700',
  info:      'text-slate-700',
};

const DOC_STATUS_ICON: Record<string, string> = {
  verified:    '✓',
  rejected:    '✗',
  resubmitted: '↩',
  generated:   '⬇',
  pending:     '…',
};

const DOC_STATUS_COLOR: Record<string, string> = {
  verified:    'bg-green-50 border-green-200 text-green-700',
  rejected:    'bg-red-50 border-red-200 text-red-700',
  resubmitted: 'bg-blue-50 border-blue-200 text-blue-700',
  generated:   'bg-slate-50 border-slate-200 text-slate-600',
  pending:     'bg-amber-50 border-amber-200 text-amber-700',
};

const HEADER_BG: Record<OutcomeColor, string> = {
  green: 'from-green-700 to-green-800',
  red:   'from-red-700 to-red-800',
  blue:  'from-blue-700 to-blue-800',
  amber: 'from-amber-600 to-amber-700',
};

const STATUS_BADGE: Record<string, string> = {
  approved:      'bg-green-100 text-green-800 border-green-200',
  declined:      'bg-red-100 text-red-800 border-red-200',
  'counter-offer': 'bg-blue-100 text-blue-800 border-blue-200',
  'under-review':  'bg-amber-100 text-amber-800 border-amber-200',
};

const STATUS_LABEL: Record<string, string> = {
  approved:        'Approved',
  declined:        'Declined',
  'counter-offer': 'Counter-Offer',
  'under-review':  'Under Review',
};

const DECISION_OUTCOME_LABEL: Record<string, string> = {
  approved:        'Approved',
  declined:        'Declined',
  'counter-offer': 'Counter-Offer Accepted',
  'under-review':  'Under Review',
};

const DECISION_COLOR: Record<string, string> = {
  approved:        'bg-green-50 border-green-200 text-green-800',
  declined:        'bg-red-50 border-red-200 text-red-800',
  'counter-offer': 'bg-blue-50 border-blue-200 text-blue-800',
  'under-review':  'bg-amber-50 border-amber-200 text-amber-800',
};

const ACTOR_BADGE: Record<string, string> = {
  'System':             'bg-slate-100 text-slate-500',
  'Applicant':          'bg-blue-100 text-blue-600',
  'Compliance Officer': 'bg-amber-100 text-amber-700',
  'Underwriter':        'bg-purple-100 text-purple-700',
};

export default function ApplicationPassport({ passport, outcomeColor }: ApplicationPassportProps) {
  const { decision } = passport;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">

      {/* Header */}
      <div className={`bg-gradient-to-r ${HEADER_BG[outcomeColor]} px-6 py-5`}>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-white/60 mb-1">Application Passport</p>
            <p className="font-mono text-2xl font-bold text-white tracking-wider">{passport.applicationId}</p>
            <p className="text-sm text-white/80 mt-1">{passport.applicantName} · {passport.product} · €{passport.requestedAmount.toLocaleString()} requested</p>
          </div>
          <div className="text-right">
            <span className={`inline-block px-3 py-1 rounded-full border text-xs font-bold uppercase tracking-wide ${STATUS_BADGE[passport.status]}`}>
              {STATUS_LABEL[passport.status]}
            </span>
            <p className="text-xs text-white/50 mt-2">Submitted {passport.submittedAt}</p>
          </div>
        </div>
      </div>

      <div className="p-6 grid grid-cols-1 gap-6 lg:grid-cols-3">

        {/* Audit Trail — spans 2 columns on large screens */}
        <div className="lg:col-span-2 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wide text-slate-400">Audit Trail</h3>
          <div className="relative">
            {/* Connecting line */}
            <div className="absolute left-[7px] top-2 bottom-2 w-px bg-slate-100" aria-hidden="true" />
            <ol className="space-y-3">
              {passport.auditTrail.map((ev, i) => (
                <li key={i} className="flex gap-3">
                  <span className={`mt-1.5 w-3.5 h-3.5 shrink-0 rounded-full border-2 border-white ring-1 ring-slate-200 ${AUDIT_DOT[ev.outcome]}`} />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] text-slate-400 font-mono">{ev.timestamp}</span>
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${ACTOR_BADGE[ev.actor]}`}>{ev.actor}</span>
                    </div>
                    <p className={`text-xs leading-relaxed mt-0.5 ${AUDIT_TEXT[ev.outcome]}`}>{ev.event}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>

        {/* Right column: Decision + Documents */}
        <div className="space-y-6">

          {/* Decision */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wide text-slate-400">Decision</h3>
            <div className={`rounded-lg border px-4 py-3 space-y-2 ${DECISION_COLOR[decision.outcome]}`}>
              <p className="font-bold text-sm">{DECISION_OUTCOME_LABEL[decision.outcome]}</p>

              {(decision.amount || decision.offeredAmount) && (
                <div className="text-xs space-y-0.5">
                  <p><span className="opacity-60">Amount</span> <strong>€{(decision.amount ?? decision.offeredAmount)!.toLocaleString()}</strong></p>
                  {decision.rate && <p><span className="opacity-60">Rate</span> <strong>{decision.rate}% APR</strong></p>}
                  {decision.termMonths && <p><span className="opacity-60">Term</span> <strong>{decision.termMonths} months</strong></p>}
                  {decision.monthlyPayment && <p><span className="opacity-60">Monthly</span> <strong>€{decision.monthlyPayment}</strong></p>}
                </div>
              )}

              {decision.reasons && (
                <ul className="text-xs space-y-0.5 list-disc list-inside opacity-80">
                  {decision.reasons.map((r) => <li key={r}>{r}</li>)}
                </ul>
              )}

              {decision.conditions && (
                <div className="text-xs">
                  <p className="font-semibold opacity-70 mb-0.5">Conditions</p>
                  <ul className="list-disc list-inside space-y-0.5 opacity-80">
                    {decision.conditions.map((c) => <li key={c}>{c}</li>)}
                  </ul>
                </div>
              )}

              <div className="pt-1 border-t border-current border-opacity-10 text-[10px] opacity-60 space-y-0.5">
                <p>Decided by: {decision.decidedBy}</p>
                <p>{decision.decidedAt}</p>
              </div>
            </div>
          </div>

          {/* Documents */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wide text-slate-400">Documents</h3>
            <div className="space-y-1.5">
              {passport.documents.map((doc) => (
                <div key={doc.id} className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium ${DOC_STATUS_COLOR[doc.status]}`}>
                  <span className="font-bold text-sm leading-none">{DOC_STATUS_ICON[doc.status]}</span>
                  <span className="flex-1">{doc.name}</span>
                  <span className="opacity-60 capitalize text-[10px]">{doc.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
