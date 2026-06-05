'use client';

import { create } from 'zustand';
import { personas, type Persona } from './mock-data/tenant';
import { defaultProjectId } from './mock-data/projects';

interface PersonaState {
  activeProjectId: string;
  setActiveProject: (projectId: string) => void;
}

export const usePersona = create<PersonaState>((set) => ({
  activeProjectId: defaultProjectId,
  setActiveProject: (projectId) => set({ activeProjectId: projectId }),
}));

export function useActivePersona(): Persona {
  return personas.processOwner;
}

export function useActiveProjectId(): string {
  return usePersona((s) => s.activeProjectId);
}
