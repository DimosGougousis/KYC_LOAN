import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { isPersonaId } from '../domain/types';
import { useDemo } from '../lib/demo';
import { PageHeader } from '../ui/primitives';

export default function CaseFilePage() {
  const { personaId } = useParams();
  const { personaId: current, setPersonaId } = useDemo();
  useEffect(() => {
    if (isPersonaId(personaId) && personaId !== current) setPersonaId(personaId);
  }, [personaId, current, setPersonaId]);
  return (
    <main className="mx-auto max-w-[1180px] px-4 md:px-8">
      <PageHeader eyebrow="Case file" title="Case file" />
    </main>
  );
}
