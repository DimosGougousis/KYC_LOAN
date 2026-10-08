import { isPersonaId, type PersonaId } from '../domain/types';

// Same key the original demo and the MSW handlers use.
export const PERSONA_KEY = 'demoPersona';
let memory: string | null = null;

export function readPersonaId(): PersonaId {
  let v: string | null = memory;
  try {
    v = localStorage.getItem(PERSONA_KEY) ?? memory;
  } catch {
    v = memory;
  }
  return isPersonaId(v) ? v : 'happy-path';
}

export function writePersonaId(id: PersonaId): void {
  memory = id;
  try {
    localStorage.setItem(PERSONA_KEY, id);
  } catch {
    // Storage blocked (private mode); the in-memory copy keeps the demo working.
  }
}
