'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apps, getSOPById, type App, type AppStatus } from '@/lib/mock-data';

export type MemoryMode = 'none' | 'session' | 'long';
export type AudienceMode = 'all_members' | 'segment';

interface AppOverride {
  status?: AppStatus;
  memoryMode?: MemoryMode;
  audience?: AudienceMode;
  customGuardrails?: string[];
  deployedVersion?: number;
  deployedAt?: string;
  lastSubmittedAt?: string;
}

interface AppStateStore {
  overrides: Record<string, AppOverride>;
  submitForApproval: (appId: string) => void;
  approve: (appId: string) => void;
  requestChanges: (appId: string) => void;
  reject: (appId: string) => void;
  deploy: (appId: string) => void;
  setMemoryMode: (appId: string, mode: MemoryMode) => void;
  setAudience: (appId: string, audience: AudienceMode) => void;
  addCustomGuardrail: (appId: string, text: string) => void;
  removeCustomGuardrail: (appId: string, text: string) => void;
}

function patch(s: AppStateStore, appId: string, p: AppOverride): Record<string, AppOverride> {
  return {
    ...s.overrides,
    [appId]: { ...(s.overrides[appId] ?? {}), ...p },
  };
}

// Editing a configured app means it needs re-approval (FR-DEP-05).
function markDraftOnEdit(prev: AppOverride | undefined, mockStatus: AppStatus): AppStatus {
  const current = prev?.status ?? mockStatus;
  if (current === 'deployed' || current === 'approved' || current === 'in_review') {
    return 'draft';
  }
  return current;
}

export const useAppState = create<AppStateStore>()(
  persist(
    (set) => ({
      overrides: {},
      submitForApproval: (appId) =>
        set((s) => ({
          overrides: patch(s, appId, {
            status: 'in_review',
            lastSubmittedAt: new Date().toISOString(),
          }),
        })),
      approve: (appId) =>
        set((s) => ({ overrides: patch(s, appId, { status: 'approved' }) })),
      requestChanges: (appId) =>
        set((s) => ({ overrides: patch(s, appId, { status: 'changes_requested' }) })),
      reject: (appId) => set((s) => ({ overrides: patch(s, appId, { status: 'draft' }) })),
      deploy: (appId) =>
        set((s) => {
          const baseline = apps.find((a) => a.id === appId);
          if (!baseline) return s;
          const current = s.overrides[appId] ?? {};
          const nextVersion = (current.deployedVersion ?? baseline.deployedVersion) + 1;
          return {
            overrides: patch(s, appId, {
              status: 'deployed',
              deployedVersion: nextVersion,
              deployedAt: new Date().toISOString(),
            }),
          };
        }),
      setMemoryMode: (appId, mode) =>
        set((s) => {
          const baseline = apps.find((a) => a.id === appId);
          if (!baseline) return s;
          const prev = s.overrides[appId];
          return {
            overrides: patch(s, appId, {
              memoryMode: mode,
              status: markDraftOnEdit(prev, baseline.status),
            }),
          };
        }),
      setAudience: (appId, audience) =>
        set((s) => {
          const baseline = apps.find((a) => a.id === appId);
          if (!baseline) return s;
          const prev = s.overrides[appId];
          return {
            overrides: patch(s, appId, {
              audience,
              status: markDraftOnEdit(prev, baseline.status),
            }),
          };
        }),
      addCustomGuardrail: (appId, text) =>
        set((s) => {
          const baseline = apps.find((a) => a.id === appId);
          if (!baseline) return s;
          const prev = s.overrides[appId];
          const existing = prev?.customGuardrails ?? [];
          if (existing.includes(text)) return s;
          return {
            overrides: patch(s, appId, {
              customGuardrails: [...existing, text],
              status: markDraftOnEdit(prev, baseline.status),
            }),
          };
        }),
      removeCustomGuardrail: (appId, text) =>
        set((s) => {
          const prev = s.overrides[appId];
          if (!prev?.customGuardrails) return s;
          return {
            overrides: patch(s, appId, {
              customGuardrails: prev.customGuardrails.filter((g) => g !== text),
            }),
          };
        }),
    }),
    { name: 'studio-app-state' },
  ),
);

/* ---------- Read helpers ---------- */

export interface EffectiveApp extends App {
  memoryMode: MemoryMode;
  audience: AudienceMode;
  customGuardrails: string[];
  baselineStatus: AppStatus;
  baselineMemoryMode: MemoryMode;
  baselineAudience: AudienceMode;
  baselineCustomGuardrails: string[];
  baselineDeployedVersion: number;
  baselineDeployedAt: string | null;
}

const BASELINE_MEMORY: MemoryMode = 'session';
const BASELINE_AUDIENCE: AudienceMode = 'all_members';
const BASELINE_CUSTOM_GUARDRAILS: string[] = [];

export function selectEffectiveApp(
  state: AppStateStore,
  appId: string,
): EffectiveApp | null {
  const baseline = apps.find((a) => a.id === appId);
  if (!baseline) return null;
  const o = state.overrides[appId] ?? {};
  return {
    ...baseline,
    status: o.status ?? baseline.status,
    deployedVersion: o.deployedVersion ?? baseline.deployedVersion,
    deployedAt: o.deployedAt ?? baseline.deployedAt,
    memoryMode: o.memoryMode ?? BASELINE_MEMORY,
    audience: o.audience ?? BASELINE_AUDIENCE,
    customGuardrails: o.customGuardrails ?? BASELINE_CUSTOM_GUARDRAILS,
    baselineStatus: baseline.status,
    baselineMemoryMode: BASELINE_MEMORY,
    baselineAudience: BASELINE_AUDIENCE,
    baselineCustomGuardrails: BASELINE_CUSTOM_GUARDRAILS,
    baselineDeployedVersion: baseline.deployedVersion,
    baselineDeployedAt: baseline.deployedAt,
  };
}

/** Hook variant for clients that don't need stable selector identity. */
export function useEffectiveApp(appId: string): EffectiveApp | null {
  return useAppState((s) => selectEffectiveApp(s, appId));
}

export type DiffEntry =
  | { kind: 'changed'; field: string; before: string; after: string }
  | { kind: 'added'; field: string; value: string }
  | { kind: 'removed'; field: string; value: string };

const memoryLabel: Record<MemoryMode, string> = {
  none: 'none',
  session: 'session',
  long: 'long-term',
};
const audienceLabel: Record<AudienceMode, string> = {
  all_members: 'all members',
  segment: 'segment',
};

export function diffDraftAgainstDeployed(eff: EffectiveApp): DiffEntry[] {
  const out: DiffEntry[] = [];
  if (eff.memoryMode !== eff.baselineMemoryMode) {
    out.push({
      kind: 'changed',
      field: 'memory.mode',
      before: memoryLabel[eff.baselineMemoryMode],
      after: memoryLabel[eff.memoryMode],
    });
  }
  if (eff.audience !== eff.baselineAudience) {
    out.push({
      kind: 'changed',
      field: 'audience.segment',
      before: audienceLabel[eff.baselineAudience],
      after: audienceLabel[eff.audience],
    });
  }
  for (const g of eff.customGuardrails) {
    if (!eff.baselineCustomGuardrails.includes(g)) {
      out.push({ kind: 'added', field: 'guardrails.custom', value: g });
    }
  }
  for (const g of eff.baselineCustomGuardrails) {
    if (!eff.customGuardrails.includes(g)) {
      out.push({ kind: 'removed', field: 'guardrails.custom', value: g });
    }
  }
  return out;
}
