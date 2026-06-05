'use client';

import { create } from 'zustand';
import { modelEndpoints } from '@/lib/mock-data/models';

export type IntegrationModelConfig = {
  id: string;
  provider: string;
  endpointName: string;
  modelLabel: string;
  description: string;
  endpointUrl?: string;
  apiKeyMasked: string;
  enabled: boolean;
  defaultForParsing: boolean;
  defaultForGeneration: boolean;
  status: 'connected' | 'attention' | 'untested';
  lastTested: string;
};

type UpsertModelInput = {
  id?: string;
  provider: string;
  endpointName: string;
  modelLabel: string;
  apiKey: string;
  enabled: boolean;
};

type ModeHubState = {
  models: IntegrationModelConfig[];
  toggleEnabled: (id: string) => void;
  setDefaultParsing: (id: string) => void;
  setDefaultGeneration: (id: string) => void;
  upsertModel: (input: UpsertModelInput) => string;
  deleteModel: (id: string) => void;
  testModel: (id: string) => void;
};

function maskKey(apiKey: string) {
  const normalized = apiKey.trim();
  if (!normalized) return 'Not configured';
  if (normalized.length <= 8) return `${normalized.slice(0, 2)}••••`;
  return `${normalized.slice(0, 4)}••••${normalized.slice(-4)}`;
}

const initialModels: IntegrationModelConfig[] = modelEndpoints
  .filter((endpoint) => endpoint.capabilities.includes('json_mode') && endpoint.purposesAssigned[0] !== 'embedding')
  .map((endpoint, index) => ({
    id: endpoint.id,
    provider: endpoint.provider,
    endpointName: endpoint.name,
    modelLabel: endpoint.modelIdentifier,
    description: `${endpoint.region} · ${endpoint.status}`,
    endpointUrl: endpoint.customUrl,
    apiKeyMasked: endpoint.vaultCredentialRef ? maskKey(endpoint.vaultCredentialRef) : 'Platform managed',
    enabled: index < 5,
    defaultForParsing: index === 0,
    defaultForGeneration: index === 2,
    status: endpoint.status === 'healthy' ? 'connected' : endpoint.status === 'degraded' ? 'attention' : 'untested',
    lastTested: endpoint.lastHealthcheckAgo,
  }));

function normalizeDefaults(models: IntegrationModelConfig[]) {
  const enabled = models.filter((model) => model.enabled);
  const fallbackId = enabled[0]?.id;

  let next = models;
  if (!enabled.some((model) => model.defaultForParsing) && fallbackId) {
    next = next.map((model) => ({ ...model, defaultForParsing: model.id === fallbackId }));
  }
  if (!enabled.some((model) => model.defaultForGeneration) && fallbackId) {
    const generationFallback = enabled.find((model) => model.id !== fallbackId)?.id ?? fallbackId;
    next = next.map((model) => ({ ...model, defaultForGeneration: model.id === generationFallback }));
  }

  return next;
}

export const useModeHubStore = create<ModeHubState>((set) => ({
  models: initialModels,
  toggleEnabled: (id) =>
    set((state) => {
      const currentlyEnabled = state.models.filter((model) => model.enabled);
      const target = state.models.find((model) => model.id === id);
      if (!target) return state;
      if (target.enabled && currentlyEnabled.length === 1) return state;

      const next = state.models.map((model) =>
        model.id === id ? { ...model, enabled: !model.enabled } : model,
      );
      return { models: normalizeDefaults(next) };
    }),
  setDefaultParsing: (id) =>
    set((state) => ({
      models: state.models.map((model) => ({
        ...model,
        defaultForParsing: model.id === id,
      })),
    })),
  setDefaultGeneration: (id) =>
    set((state) => ({
      models: state.models.map((model) => ({
        ...model,
        defaultForGeneration: model.id === id,
      })),
    })),
  upsertModel: (input) => {
    const id = input.id ?? `modehub_${Math.random().toString(36).slice(2, 10)}`;
    set((state) => {
      const existing = state.models.find((model) => model.id === id);
      const nextModel: IntegrationModelConfig = {
        id,
        provider: input.provider,
        endpointName: input.endpointName,
        modelLabel: input.modelLabel,
        description: `${input.provider} · configured via API key`,
        apiKeyMasked: maskKey(input.apiKey),
        enabled: input.enabled,
        defaultForParsing: existing?.defaultForParsing ?? false,
        defaultForGeneration: existing?.defaultForGeneration ?? false,
        status: 'untested',
        lastTested: 'Not tested yet',
      };

      const next = existing
        ? state.models.map((model) => (model.id === id ? nextModel : model))
        : [nextModel, ...state.models];

      return { models: normalizeDefaults(next) };
    });
    return id;
  },
  deleteModel: (id) =>
    set((state) => ({
      models: normalizeDefaults(state.models.filter((model) => model.id !== id)),
    })),
  testModel: (id) =>
    set((state) => ({
      models: state.models.map((model) =>
        model.id === id
          ? {
              ...model,
              status: 'connected',
              lastTested: 'Just now',
            }
          : model,
      ),
    })),
}));
