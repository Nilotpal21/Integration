export type ModelMode =
  | 'api_key'
  | 'openai_compatible'
  | 'declared_contract'
  | 'platform_default';

export type ModelPurpose =
  | 'routing'
  | 'response_generation'
  | 'helper'
  | 'embedding'
  | 'evaluation_grading';

export type ModelStatus = 'healthy' | 'degraded' | 'down' | 'fallback_active';

export type ModelCapability = 'tool_use' | 'json_mode' | 'vision' | 'long_context';

export interface ModelEndpoint {
  id: string;
  name: string;
  provider: string;
  mode: ModelMode;
  region: string;
  modelIdentifier: string;
  capabilities: ModelCapability[];
  purposesAssigned: ModelPurpose[];
  latencyMsP95: number;
  costPer1kTokensUSD: number;
  status: ModelStatus;
  lastHealthcheckAgo: string;
  isPlatformDefault?: boolean;
  vaultCredentialRef?: string;
  customUrl?: string;
  fallbackEndpointId?: string;
  baaInheritsFrom?: string;
  errorsLast24h?: number;
}

export const modelEndpoints: ModelEndpoint[] = [
  {
    id: 'mep_platform_default_haiku',
    name: 'Platform default · Anthropic Haiku',
    provider: 'Anthropic',
    mode: 'platform_default',
    region: 'us-east',
    modelIdentifier: 'claude-haiku-4-5',
    capabilities: ['tool_use', 'json_mode', 'long_context'],
    purposesAssigned: ['routing'],
    latencyMsP95: 410,
    costPer1kTokensUSD: 0.0025,
    status: 'healthy',
    lastHealthcheckAgo: '1 min ago',
    isPlatformDefault: true,
    errorsLast24h: 0,
  },
  {
    id: 'mep_platform_default_sonnet',
    name: 'Platform default · Anthropic Sonnet',
    provider: 'Anthropic',
    mode: 'platform_default',
    region: 'us-east',
    modelIdentifier: 'claude-sonnet-4-6',
    capabilities: ['tool_use', 'json_mode', 'vision', 'long_context'],
    purposesAssigned: ['evaluation_grading'],
    latencyMsP95: 920,
    costPer1kTokensUSD: 0.015,
    status: 'healthy',
    lastHealthcheckAgo: '1 min ago',
    isPlatformDefault: true,
    errorsLast24h: 1,
  },
  {
    id: 'mep_azure_openai_gpt4o',
    name: 'cornerstone-azure-gpt4o',
    provider: 'Azure OpenAI',
    mode: 'api_key',
    region: 'eastus',
    modelIdentifier: 'gpt-4o (2026-01)',
    capabilities: ['tool_use', 'json_mode', 'vision', 'long_context'],
    purposesAssigned: ['response_generation'],
    latencyMsP95: 1180,
    costPer1kTokensUSD: 0.012,
    status: 'healthy',
    lastHealthcheckAgo: '3 min ago',
    vaultCredentialRef: 'cornerstone-azure-2026',
    baaInheritsFrom: 'Microsoft Azure BAA',
    fallbackEndpointId: 'mep_platform_default_sonnet',
    errorsLast24h: 2,
  },
  {
    id: 'mep_anthropic_sonnet_byok',
    name: 'cornerstone-anthropic-sonnet',
    provider: 'Anthropic',
    mode: 'api_key',
    region: 'us-east',
    modelIdentifier: 'claude-sonnet-4-6',
    capabilities: ['tool_use', 'json_mode', 'vision', 'long_context'],
    purposesAssigned: ['helper'],
    latencyMsP95: 880,
    costPer1kTokensUSD: 0.014,
    status: 'healthy',
    lastHealthcheckAgo: '2 min ago',
    vaultCredentialRef: 'cornerstone-anthropic-2026',
    baaInheritsFrom: 'Anthropic DPA',
    fallbackEndpointId: 'mep_platform_default_sonnet',
    errorsLast24h: 0,
  },
  {
    id: 'mep_azure_embedding',
    name: 'cornerstone-azure-embedding',
    provider: 'Azure OpenAI',
    mode: 'api_key',
    region: 'eastus',
    modelIdentifier: 'text-embedding-3-large',
    capabilities: [],
    purposesAssigned: ['embedding'],
    latencyMsP95: 240,
    costPer1kTokensUSD: 0.00013,
    status: 'healthy',
    lastHealthcheckAgo: '4 min ago',
    vaultCredentialRef: 'cornerstone-azure-2026',
    baaInheritsFrom: 'Microsoft Azure BAA',
    errorsLast24h: 0,
  },
  {
    id: 'mep_bedrock_claude',
    name: 'cornerstone-bedrock-claude',
    provider: 'AWS Bedrock',
    mode: 'api_key',
    region: 'us-east-1',
    modelIdentifier: 'claude-sonnet-4-6 (bedrock)',
    capabilities: ['tool_use', 'json_mode', 'long_context'],
    purposesAssigned: [],
    latencyMsP95: 1020,
    costPer1kTokensUSD: 0.015,
    status: 'degraded',
    lastHealthcheckAgo: '7 min ago',
    vaultCredentialRef: 'cornerstone-aws-2026',
    baaInheritsFrom: 'AWS Bedrock BAA',
    errorsLast24h: 11,
  },
  {
    id: 'mep_vllm_llama',
    name: 'cornerstone-vllm-llama',
    provider: 'Custom · OpenAI-compatible',
    mode: 'openai_compatible',
    region: 'on-prem (datacenter-A)',
    modelIdentifier: 'llama-3.1-70b-instruct',
    capabilities: ['tool_use', 'json_mode'],
    purposesAssigned: [],
    latencyMsP95: 1640,
    costPer1kTokensUSD: 0.0008,
    status: 'healthy',
    lastHealthcheckAgo: '5 min ago',
    customUrl: 'https://llm-gateway.internal.cornerstone.cu/v1',
    errorsLast24h: 0,
  },
];

export const purposeMeta: Record<
  ModelPurpose,
  { label: string; description: string }
> = {
  routing: {
    label: 'Routing',
    description: 'Fast intent classification and conversation routing.',
  },
  response_generation: {
    label: 'Response generation',
    description: 'Member-facing responses and task drafting.',
  },
  helper: {
    label: 'AI Helper',
    description: 'In-platform AI Helper conversations with Process Owners and admins.',
  },
  embedding: {
    label: 'Embedding (Knowledge Library)',
    description: 'Vector embeddings for retrieval over your knowledge sources.',
  },
  evaluation_grading: {
    label: 'Evaluation grading',
    description: 'Scoring evaluation runs against pre-built and SOP-derived tests.',
  },
};

export const purposeOrder: ModelPurpose[] = [
  'routing',
  'response_generation',
  'helper',
  'embedding',
  'evaluation_grading',
];

export const allCapabilities: { id: ModelCapability; label: string }[] = [
  { id: 'tool_use', label: 'Tool use' },
  { id: 'json_mode', label: 'JSON mode' },
  { id: 'vision', label: 'Vision' },
  { id: 'long_context', label: 'Long context (≥128k)' },
];

export const managedProviders = [
  'OpenAI',
  'Anthropic',
  'Azure OpenAI',
  'AWS Bedrock',
  'Google Vertex AI',
  'Cohere',
  'Mistral',
];

export function getEndpointById(id: string): ModelEndpoint | undefined {
  return modelEndpoints.find((m) => m.id === id);
}

export function getEndpointByPurpose(p: ModelPurpose): ModelEndpoint | undefined {
  return modelEndpoints.find((m) => m.purposesAssigned.includes(p));
}

export function endpointSupports(
  endpoint: ModelEndpoint,
  required: ModelCapability,
): boolean {
  return endpoint.capabilities.includes(required);
}
