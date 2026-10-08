import { useCallback, useMemo, useState, type ReactNode } from 'react';
import type { PersonaId } from '../domain/types';
import { DemoContext } from './demo';
import { readPersonaId, writePersonaId } from './storage';

export function DemoProvider({ children }: { children: ReactNode }) {
  const [personaId, setState] = useState<PersonaId>(() => readPersonaId());
  const setPersonaId = useCallback((id: PersonaId) => {
    writePersonaId(id);
    setState(id);
  }, []);
  const value = useMemo(() => ({ personaId, setPersonaId }), [personaId, setPersonaId]);
  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}
