import { createContext, useContext } from 'react';
import type { PersonaId } from '../domain/types';

export interface DemoValue { personaId: PersonaId; setPersonaId: (id: PersonaId) => void }

export const DemoContext = createContext<DemoValue | null>(null);

export function useDemo(): DemoValue {
  const v = useContext(DemoContext);
  if (!v) throw new Error('useDemo must be used inside DemoProvider');
  return v;
}
