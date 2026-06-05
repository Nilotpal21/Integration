'use client';

import { create } from 'zustand';

interface AuthState {
  isAuthenticated: boolean;
  signedInAt: string | null;
  authMethod: 'sso' | 'password' | null;
  idleLock: boolean;
  signIn: (method: 'sso' | 'password') => void;
  signOut: () => void;
  triggerIdleLock: () => void;
  resumeSession: () => void;
}

export const useAuth = create<AuthState>((set) => ({
  isAuthenticated: false,
  signedInAt: null,
  authMethod: null,
  idleLock: false,
  signIn: (method) =>
    set({
      isAuthenticated: true,
      signedInAt: new Date().toISOString(),
      authMethod: method,
      idleLock: false,
    }),
  signOut: () =>
    set({
      isAuthenticated: false,
      signedInAt: null,
      authMethod: null,
      idleLock: false,
    }),
  triggerIdleLock: () => set({ idleLock: true }),
  resumeSession: () => set({ idleLock: false }),
}));
