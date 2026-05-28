'use client';

import { create } from 'zustand';
import { personas, type Persona } from './mock-data/tenant';
import { defaultProjectId } from './mock-data/projects';

type PersonaKey = 'processOwner' | 'reviewer' | 'admin';

interface PersonaState {
  activeKey: PersonaKey;
  activeProjectId: string;
  setActive: (key: PersonaKey) => void;
  setActiveProject: (projectId: string) => void;
}

export const usePersona = create<PersonaState>((set) => ({
  activeKey: 'processOwner',
  activeProjectId: defaultProjectId,
  setActive: (key) => set({ activeKey: key }),
  setActiveProject: (projectId) => set({ activeProjectId: projectId }),
}));

export function useActivePersona(): Persona {
  const key = usePersona((s) => s.activeKey);
  return personas[key];
}

export function useActiveProjectId(): string {
  return usePersona((s) => s.activeProjectId);
}

export const personaKeys: PersonaKey[] = ['processOwner', 'reviewer', 'admin'];
