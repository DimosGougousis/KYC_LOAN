import { useQueryClient } from '@tanstack/react-query';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { PERSONAS } from '../data/personas';
import { isPersonaId } from '../domain/types';
import { api } from '../lib/api';
import { useDemo } from '../lib/demo';

export function TopBar() {
  const { personaId, setPersonaId } = useDemo();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const lens = pathname.startsWith('/apply') ? 'applicant'
    : pathname.startsWith('/case') || pathname.startsWith('/compare') ? 'reviewer' : null;

  function switchPersona(id: string) {
    if (!isPersonaId(id)) return;
    setPersonaId(id);
    // A wizard in progress belongs to the old persona, so start a fresh one.
    if (lens === 'applicant') navigate('/apply/new', { state: { restart: Date.now() } });
    else if (pathname.startsWith('/case')) navigate(`/case/${id}`);
  }

  async function reset() {
    await api('/demo/reset', { method: 'POST' });
    await qc.invalidateQueries();
    if (lens === 'applicant') navigate('/apply/new', { state: { restart: Date.now() } });
  }

  const tab = (active: boolean) => `rounded-full px-3 py-1.5 text-sm ${active ? 'bg-ink text-white' : 'text-ink hover:bg-wash'}`;

  return (
    <div className="sticky top-0 z-20 border-b border-line bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-[1180px] flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2.5 md:px-8">
        <Link to="/" className="mr-auto font-display text-lg font-semibold whitespace-nowrap">
          KYC &amp; Loan <span className="text-accent">Onboarding</span>
        </Link>
        <nav aria-label="Lens" className="flex rounded-full border border-line p-0.5">
          <Link to="/apply/new" className={tab(lens === 'applicant')}>Applicant</Link>
          <Link to={`/case/${personaId}`} className={tab(lens === 'reviewer')}>Reviewer</Link>
        </nav>
        <Link to="/compare" className="text-sm text-muted hover:text-ink">Compare</Link>
        <select
          aria-label="Persona"
          value={personaId}
          onChange={(e) => switchPersona(e.target.value)}
          className="max-w-full rounded-md border border-line bg-white px-2 py-1.5 text-sm"
        >
          {PERSONAS.map((p) => <option key={p.id} value={p.id}>{p.name} · {p.label}</option>)}
        </select>
        <button type="button" onClick={reset} className="text-sm text-muted underline-offset-4 hover:text-ink hover:underline">
          Reset demo
        </button>
      </div>
    </div>
  );
}
