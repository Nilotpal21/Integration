'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  Bot,
  Check,
  CheckCircle2,
  Circle,
  LayoutTemplate,
  Play,
  Sparkles,
  X,
} from 'lucide-react';
import { PickerSelect } from '@/components/ui/PickerSelect';
import { useModeHubStore } from '@/lib/mode-hub';
import { cn } from '@/lib/utils';

type CreationMode = 'scratch' | 'template';
type CreateStep = 'details' | 'source' | 'spec' | 'components' | 'test' | 'review';

type AppDef = {
  id: string;
  name: string;
};

const APPS: AppDef[] = [
  { id: 'hubspot', name: 'HubSpot' },
  { id: 'salesforce', name: 'Salesforce' },
  { id: 'zendesk', name: 'Zendesk' },
  { id: 'calendly', name: 'Calendly' },
];

const TEMPLATES = [
  {
    id: 'hubspot-crm-readonly',
    appId: 'hubspot',
    label: 'HubSpot CRM Read-only',
    description: 'Read-only customer, company, and engagement coverage.',
  },
  {
    id: 'hubspot-usage-baseline',
    appId: 'hubspot',
    label: 'HubSpot Usage Snapshot',
    description: 'Usage and audit-oriented baseline for platform reporting.',
  },
  {
    id: 'salesforce-accounts-snapshot',
    appId: 'salesforce',
    label: 'Salesforce Accounts Snapshot',
    description: 'Accounts, contacts, and opportunity snapshot baseline.',
  },
  {
    id: 'salesforce-pipeline-readonly',
    appId: 'salesforce',
    label: 'Salesforce Pipeline Read-only',
    description: 'Read-only pipeline and activity coverage for GTM teams.',
  },
  {
    id: 'zendesk-tickets-usage',
    appId: 'zendesk',
    label: 'Zendesk Tickets Usage',
    description: 'Tickets, agents, and support usage metrics.',
  },
  {
    id: 'calendly-events-readonly',
    appId: 'calendly',
    label: 'Calendly Events Read-only',
    description: 'Invitee, host, and event usage baseline.',
  },
] as const;

type ModelProvider = string;

const COMPONENT_OPTIONS = [
  'API Client',
  'Auth Setup',
  'Users + Usage Data',
  'Error Handling',
  'Pagination',
  'Logging',
];

const parsedSpecPreview = [
  { method: 'GET', path: '/users', operation: 'read' },
  { method: 'GET', path: '/usage/daily', operation: 'read' },
  { method: 'GET', path: '/organizations', operation: 'read' },
  { method: 'GET', path: '/audit/events', operation: 'read' },
];

const demoResponse = {
  usersSynced: 1482,
  usageWindow: 'Last 30 days',
  rateLimit: 'Retry-After supported',
  nextCursor: 'cursor_6a8f0',
};

function Panel({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('overflow-hidden rounded-2xl border border-border bg-background-subtle', className)}>
      <div className="border-b border-border-muted bg-background-muted px-5 py-4 text-sm font-semibold text-foreground">
        {title}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function Field({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="text-sm text-foreground-muted">{label}</div>
      <div className="text-[17px] font-medium leading-8 text-foreground">{value}</div>
    </div>
  );
}

export function ConnectorCreationWizard({
  initialMode,
  initialAppId,
  returnTo = '/projects',
}: {
  initialMode?: CreationMode;
  initialAppId?: AppDef['id'];
  returnTo?: string;
}) {
  const router = useRouter();
  const modeHubModels = useModeHubStore((state) => state.models);
  const integrationModels = useMemo(
    () => modeHubModels.filter((model) => model.enabled),
    [modeHubModels],
  );
  const defaultParsingModel =
    integrationModels.find((model) => model.defaultForParsing) ?? integrationModels[0];
  const defaultGenerationModel =
    integrationModels.find((model) => model.defaultForGeneration) ?? integrationModels[0];
  const providerOptions = Array.from(new Set(integrationModels.map((model) => model.provider)));
  const [creationMode, setCreationMode] = useState<CreationMode>(initialMode ?? 'scratch');
  const [createStep, setCreateStep] = useState<CreateStep>(initialMode ? 'details' : 'source');
  const [draftAppId, setDraftAppId] = useState<AppDef['id']>(initialAppId ?? 'hubspot');
  const [connectionName, setConnectionName] = useState('');
  const [docsUrl, setDocsUrl] = useState('https://developers.hubspot.com/docs/api/overview');
  const [parsingProvider, setParsingProvider] = useState<ModelProvider>(defaultParsingModel?.provider ?? '');
  const [parsingModel, setParsingModel] = useState(defaultParsingModel?.modelLabel ?? '');
  const [generationProvider, setGenerationProvider] = useState<ModelProvider>(defaultGenerationModel?.provider ?? '');
  const [generationModel, setGenerationModel] = useState(defaultGenerationModel?.modelLabel ?? '');
  const [selectedTemplate, setSelectedTemplate] = useState('hubspot-crm-readonly');
  const [selectedComponents, setSelectedComponents] = useState<string[]>([
    'API Client',
    'Auth Setup',
    'Users + Usage Data',
    'Error Handling',
    'Pagination',
  ]);
  const [testCredential, setTestCredential] = useState('demo_pat_8f4c...');
  const [testPassed, setTestPassed] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const appLocked = Boolean(initialAppId);

  const steps = useMemo<Array<[CreateStep, string]>>(
    () =>
      creationMode === 'scratch'
        ? [
            ['details', 'General details'],
            ['source', 'Source'],
            ['spec', 'Parsed spec'],
            ['components', 'Components'],
            ['test', 'Sandbox test'],
            ['review', 'Review'],
          ]
        : [
            ['details', 'General details'],
            ['source', 'Source'],
            ['test', 'Sandbox test'],
            ['review', 'Review'],
          ],
    [creationMode],
  );

  const stepIndex = steps.findIndex(([step]) => step === createStep);
  const appName = APPS.find((app) => app.id === draftAppId)?.name ?? 'HubSpot';
  const parsingModels = integrationModels.filter((model) => model.provider === parsingProvider);
  const generationModels = integrationModels.filter((model) => model.provider === generationProvider);
  const availableTemplates = TEMPLATES.filter((template) => template.appId === draftAppId);

  useEffect(() => {
    if (!availableTemplates.some((template) => template.id === selectedTemplate)) {
      setSelectedTemplate(availableTemplates[0]?.id ?? '');
    }
  }, [availableTemplates, selectedTemplate]);

  useEffect(() => {
    if (!providerOptions.includes(parsingProvider) && providerOptions[0]) {
      const nextProvider = providerOptions[0];
      setParsingProvider(nextProvider);
      setParsingModel(integrationModels.find((model) => model.provider === nextProvider)?.modelLabel ?? '');
    }
    if (!providerOptions.includes(generationProvider) && providerOptions[0]) {
      const nextProvider = providerOptions[0];
      setGenerationProvider(nextProvider);
      setGenerationModel(integrationModels.find((model) => model.provider === nextProvider)?.modelLabel ?? '');
    }
  }, [generationProvider, integrationModels, parsingProvider, providerOptions]);

  useEffect(() => {
    if (!parsingModels.some((model) => model.modelLabel === parsingModel)) {
      setParsingModel(parsingModels[0]?.modelLabel ?? '');
    }
  }, [parsingModel, parsingModels]);

  useEffect(() => {
    if (!generationModels.some((model) => model.modelLabel === generationModel)) {
      setGenerationModel(generationModels[0]?.modelLabel ?? '');
    }
  }, [generationModel, generationModels]);

  function nextStep() {
    const next = steps[stepIndex + 1];
    if (next) setCreateStep(next[0]);
  }

  function previousStep() {
    const prev = steps[stepIndex - 1];
    if (prev) setCreateStep(prev[0]);
  }

  function toggleComponent(component: string) {
    setSelectedComponents((current) =>
      current.includes(component) ? current.filter((entry) => entry !== component) : [...current, component],
    );
  }

  function canContinue() {
    if (!initialMode && createStep === 'source') return true;
    if (createStep === 'details') return connectionName.trim().length > 0;
    if (createStep === 'test') return testPassed;
    if (createStep === 'review') return testPassed && acceptedTerms;
    return true;
  }

  function completeFlow() {
    if (!canContinue()) return;
    router.push(returnTo);
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#3e4a63]/84 p-4 backdrop-blur-sm">
      <div className="flex h-[min(700px,88vh)] w-[min(1120px,94vw)] overflow-hidden rounded-[24px] bg-background-subtle shadow-[0_24px_72px_rgba(15,23,42,0.2)]">
        <aside className="w-[250px] shrink-0 border-r border-border-muted bg-[#fbfcfe] px-5 py-6">
          <h2 className="text-[16px] font-semibold text-foreground">Create a connector</h2>
          <div className="mt-6 space-y-0">
            {steps.map(([step, label], index) => {
              const isCurrent = step === createStep;
              const isComplete = index < stepIndex;
              const isLast = index === steps.length - 1;
              return (
                <div key={step} className="relative flex gap-3 pb-6">
                  {!isLast ? (
                    <div className="absolute left-[16px] top-9 h-[34px] w-px bg-accent" />
                  ) : null}
                  <div
                    className={cn(
                      'relative z-10 mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full border-2',
                      isComplete
                        ? 'border-accent bg-accent text-white'
                        : isCurrent
                          ? 'border-accent bg-background-subtle text-accent'
                          : 'border-border bg-background-subtle text-foreground-subtle',
                    )}
                  >
                    {isComplete ? <Check className="size-3.5" /> : <Circle className="size-2.5 fill-current stroke-0" />}
                  </div>
                  <div className="pt-0.5">
                    <div className={cn('text-[14px] font-medium', isCurrent || isComplete ? 'text-accent' : 'text-foreground-muted')}>
                      {label}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </aside>

        <section className="flex min-w-0 flex-1 flex-col bg-background-subtle">
          <div className="flex items-start justify-between border-b border-border-muted px-6 py-5">
            <div>
              <h1 className="text-[15px] font-semibold text-foreground">
                {steps.find(([step]) => step === createStep)?.[1]}
              </h1>
              <p className="mt-1 text-[13px] text-foreground-muted">
                {createStep === 'details' && `Define the connector name${appLocked ? '' : ', app,'} and starting approach.`}
                {createStep === 'source' &&
                  (!initialMode
                    ? 'Choose whether to start from scratch or use an existing template.'
                    : creationMode === 'scratch'
                      ? 'Provide docs and choose parsing/generation sources.'
                      : 'Select the vetted template baseline for this connector.')}
                {createStep === 'spec' && 'Confirm the parsed specification that will drive generation.'}
                {createStep === 'components' && 'Choose which connector modules to generate for v1.'}
                {createStep === 'test' && 'Run the required sandbox test before activation.'}
                {createStep === 'review' && 'Verify the connector details before saving and activating it.'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => router.push(returnTo)}
              className="rounded-full p-1 text-foreground-subtle transition hover:bg-background-muted hover:text-foreground"
              aria-label="Close"
            >
              <X className="size-5" />
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
            {!initialMode && createStep === 'source' ? (
              <div className="space-y-5">
                <div className="grid gap-4 md:grid-cols-2">
                  {[
                    {
                      mode: 'scratch' as const,
                      title: 'Start from scratch',
                      body: 'Use current API docs, parsed spec confirmation, and scratch-only model selection.',
                      icon: Sparkles,
                    },
                    {
                      mode: 'template' as const,
                      title: 'Use existing template',
                      body: 'Start from a vetted baseline. This keeps the connector independent after creation.',
                      icon: LayoutTemplate,
                    },
                  ].map((option) => {
                    const Icon = option.icon;
                    const selected = creationMode === option.mode;
                    return (
                      <button
                        key={option.mode}
                        type="button"
                        onClick={() => {
                          setCreationMode(option.mode);
                          setCreateStep('details');
                        }}
                        className={cn(
                          'rounded-2xl border p-4 text-left transition',
                          selected ? 'border-accent bg-accent-subtle' : 'border-border bg-background-subtle hover:bg-background-muted',
                        )}
                      >
                        <Icon className={cn('size-5', selected ? 'text-accent' : 'text-foreground-subtle')} />
                        <div className="mt-3 text-[17px] font-medium text-foreground">{option.title}</div>
                        <div className="mt-2 text-[13px] leading-6 text-foreground-muted">{option.body}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {createStep === 'details' ? (
              <div className="space-y-5">
                <div className={cn('grid gap-5', appLocked ? 'md:grid-cols-1' : 'md:grid-cols-2')}>
                  <label className="space-y-2">
                    <span className="text-[14px] text-foreground-muted">Connection name</span>
                    <input
                      value={connectionName}
                      onChange={(event) => setConnectionName(event.target.value)}
                      placeholder="HubSpot US Prod"
                      className="h-11 w-full rounded-xl border border-border bg-background-subtle px-4 text-[14px] text-foreground outline-none transition focus:border-accent/50"
                    />
                  </label>
                  {!appLocked ? (
                    <PickerSelect
                      label="App"
                      value={draftAppId}
                      onChange={(value) => setDraftAppId(value as AppDef['id'])}
                      options={APPS.map((app) => ({ value: app.id, label: app.name }))}
                    />
                  ) : null}
                </div>

                <div className="rounded-2xl border border-warning/30 bg-warning-subtle p-4">
                  <div className="flex gap-3">
                    <AlertTriangle className="mt-0.5 size-5 text-warning" />
                    <p className="text-[13px] leading-6 text-foreground">
                      {creationMode === 'scratch'
                        ? 'Generated behavior depends on the quality and completeness of the documentation you provide.'
                        : 'Template-based creation may not reflect the latest API documentation unless refreshed later from docs.'}
                    </p>
                  </div>
                </div>
              </div>
            ) : null}

            {createStep === 'source' ? (
              <div className="space-y-5">
                {creationMode === 'scratch' ? (
                  <>
                    <label className="space-y-2">
                      <span className="text-[14px] text-foreground-muted">Documentation URL</span>
                      <input
                        value={docsUrl}
                        onChange={(event) => setDocsUrl(event.target.value)}
                        className="h-11 w-full rounded-xl border border-border bg-background-subtle px-4 text-[14px] text-foreground outline-none transition focus:border-accent/50"
                      />
                    </label>
                    <div className="grid gap-5 md:grid-cols-2">
                      <div className="space-y-4">
                        <PickerSelect
                          label="Parsing provider"
                          value={parsingProvider}
                          onChange={(value) => {
                            const provider = value as ModelProvider;
                            setParsingProvider(provider);
                            setParsingModel(integrationModels.find((model) => model.provider === provider)?.modelLabel ?? '');
                          }}
                          options={providerOptions.map((provider) => ({
                            value: provider,
                            label: provider,
                          }))}
                        />
                        <PickerSelect
                          label="Parsing model"
                          value={parsingModel}
                          onChange={setParsingModel}
                          options={parsingModels.map((model) => ({
                            value: model.modelLabel,
                            label: model.modelLabel,
                            description: model.endpointName,
                          }))}
                        />
                      </div>
                      <div className="space-y-4">
                        <PickerSelect
                          label="Generation provider"
                          value={generationProvider}
                          onChange={(value) => {
                            const provider = value as ModelProvider;
                            setGenerationProvider(provider);
                            setGenerationModel(integrationModels.find((model) => model.provider === provider)?.modelLabel ?? '');
                          }}
                          options={providerOptions.map((provider) => ({
                            value: provider,
                            label: provider,
                          }))}
                        />
                        <PickerSelect
                          label="Generation model"
                          value={generationModel}
                          onChange={setGenerationModel}
                          options={generationModels.map((model) => ({
                            value: model.modelLabel,
                            label: model.modelLabel,
                            description: model.endpointName,
                          }))}
                        />
                      </div>
                    </div>
                    <Panel title="Source status">
                      <div className="grid gap-3 md:grid-cols-3">
                        {['Fetching docs', 'Detecting machine-readable spec', 'Normalizing parsed spec'].map((label) => (
                          <div key={label} className="rounded-xl border border-border bg-background px-4 py-4">
                            <Bot className="size-4 text-accent" />
                            <div className="mt-2.5 text-[13px] font-medium text-foreground">{label}</div>
                          </div>
                        ))}
                      </div>
                    </Panel>
                  </>
                ) : (
                  <div className="space-y-4">
                    <PickerSelect
                      label="Template baseline"
                      value={selectedTemplate}
                      onChange={setSelectedTemplate}
                      options={availableTemplates.map((template) => ({
                        value: template.id,
                        label: template.label,
                        description: template.description,
                      }))}
                    />
                    <Panel title="Template note">
                      <p className="text-[13px] leading-6 text-foreground-muted">
                        The selected template carries a stored parsed-spec snapshot and becomes a new independent connector after save.
                      </p>
                    </Panel>
                  </div>
                )}
              </div>
            ) : null}

            {createStep === 'spec' ? (
              <div className="space-y-5">
                <div className="grid gap-4 md:grid-cols-4">
                  {[
                    ['Endpoints', '14'],
                    ['Auth', 'PAT'],
                    ['Pagination', 'Cursor'],
                    ['Rate limits', '429 + Retry-After'],
                  ].map(([label, value]) => (
                    <Panel key={label} title={label}>
                      <div className="text-[22px] font-semibold text-foreground">{value}</div>
                    </Panel>
                  ))}
                </div>
                <Panel title="Endpoint preview">
                  <div className="divide-y divide-border-muted">
                    {parsedSpecPreview.map((endpoint) => (
                      <div key={endpoint.path} className="grid grid-cols-[90px_1fr_100px] gap-4 py-2.5 text-[13px]">
                        <span className="font-medium text-accent">{endpoint.method}</span>
                        <span className="text-foreground">{endpoint.path}</span>
                        <span className="text-foreground-muted">{endpoint.operation}</span>
                      </div>
                    ))}
                  </div>
                </Panel>
              </div>
            ) : null}

            {createStep === 'components' ? (
              <div className="grid gap-3 md:grid-cols-2">
                {COMPONENT_OPTIONS.map((component) => (
                  <button
                    key={component}
                    type="button"
                    onClick={() => toggleComponent(component)}
                    className={cn(
                      'rounded-2xl border p-3.5 text-left transition',
                      selectedComponents.includes(component)
                        ? 'border-accent bg-accent-subtle'
                        : 'border-border bg-background-subtle hover:bg-background-muted',
                    )}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-[13px] font-medium text-foreground">{component}</div>
                      {selectedComponents.includes(component) ? <CheckCircle2 className="size-4 text-accent" /> : null}
                    </div>
                  </button>
                ))}
              </div>
            ) : null}

            {createStep === 'test' ? (
              <div className="space-y-5">
                <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
                  <Panel title="Credential set">
                    <label className="space-y-2">
                      <span className="text-[14px] text-foreground-muted">Primary credential</span>
                      <input
                        value={testCredential}
                        onChange={(event) => setTestCredential(event.target.value)}
                        className="h-11 w-full rounded-xl border border-border bg-background px-4 text-[14px] text-foreground outline-none transition focus:border-accent/50"
                      />
                    </label>
                    <p className="mt-3 text-[13px] leading-6 text-foreground-muted">
                      One connector supports one credential set in v1. Revoking deletes it. Reauthorizing overwrites the same binding.
                    </p>
                  </Panel>

                  <Panel title="Response preview">
                    <div className="grid gap-3 sm:grid-cols-2">
                      {Object.entries(demoResponse).map(([key, value]) => (
                        <div key={key} className="rounded-xl border border-border bg-background px-4 py-4">
                          <div className="text-[11px] uppercase tracking-[0.18em] text-foreground-subtle">{key}</div>
                          <div className="mt-2.5 text-[13px] text-foreground">{value}</div>
                        </div>
                      ))}
                    </div>
                  </Panel>
                </div>

                <button
                  type="button"
                  onClick={() => setTestPassed(true)}
                  className="inline-flex items-center gap-2 rounded-xl bg-foreground px-4 py-2.5 text-[14px] font-medium text-background transition hover:bg-foreground-muted"
                >
                  <Play className="size-4" />
                  Run sandbox test
                </button>
                {testPassed ? <p className="text-[13px] text-success">Sandbox call succeeded. Review is now unlocked.</p> : null}
              </div>
            ) : null}

            {createStep === 'review' ? (
              <div className="space-y-5">
                <Panel title="Connector details">
                  <div className="grid gap-8 md:grid-cols-2">
                    <Field label="Connection name" value={connectionName || 'Untitled connector'} />
                    <Field label="App" value={appName} />
                  </div>
                  <div className="mt-8">
                    <Field
                      label="Description"
                      value={`${appName} connector configured via ${creationMode === 'scratch' ? 'docs-driven generation' : 'template baseline'} with sandbox validation required before activation.`}
                    />
                  </div>
                </Panel>

                <Panel title="Creation source">
                  <div className="grid gap-8 md:grid-cols-2">
                    <Field label="Creation mode" value={creationMode === 'scratch' ? 'Start from scratch' : 'Use existing template'} />
                    <Field
                      label={creationMode === 'scratch' ? 'Documentation source' : 'Template baseline'}
                      value={
                        creationMode === 'scratch'
                          ? docsUrl
                          : availableTemplates.find((template) => template.id === selectedTemplate)?.label ?? 'Template baseline'
                      }
                    />
                  </div>
                </Panel>

                <Panel title="Connector generation">
                  <div className="grid gap-8 md:grid-cols-2">
                    <Field
                      label="Selected components"
                      value={
                        <div className="flex flex-wrap gap-2">
                          {selectedComponents.map((component) => (
                            <span key={component} className="rounded-xl border border-border px-3 py-1 text-sm">
                              {component}
                            </span>
                          ))}
                        </div>
                      }
                    />
                    <Field
                      label="Primary auth strategy"
                      value={creationMode === 'scratch' ? 'Derived from parsed spec' : 'Inherited from template baseline'}
                    />
                    <Field
                      label="Parsing model"
                      value={creationMode === 'scratch' ? `${parsingProvider} · ${parsingModel}` : 'Not exposed'}
                    />
                    <Field
                      label="Generation model"
                      value={creationMode === 'scratch' ? `${generationProvider} · ${generationModel}` : 'Template baseline'}
                    />
                  </div>
                </Panel>

                <Panel title="Spec and test gates">
                  <div className="grid gap-8 md:grid-cols-2">
                    <Field
                      label="Parsed spec"
                      value={creationMode === 'scratch' ? 'Confirmed as source of truth' : 'Stored template snapshot source of truth'}
                    />
                    <Field label="Sandbox test" value={testPassed ? 'Passed' : 'Pending'} />
                  </div>
                </Panel>

                <div className="grid gap-6 md:grid-cols-2">
                  <Panel title="Credential policy">
                    <div className="space-y-4">
                      <Field label="Credential set" value="One connector supports one credential set in v1" />
                      <Field label="Test credential" value={testCredential} />
                    </div>
                  </Panel>
                  <Panel title="Lifecycle rules">
                    <div className="space-y-4">
                      <Field label="Save result" value="recordStatus: active, availabilityStatus: active" />
                      <Field label="Revoke behavior" value="Deletes stored credential and requires reauthorization" />
                    </div>
                  </Panel>
                </div>

                <Panel title="Activation rule">
                  <Field label="Activation rule" value="Save only after a passing server-side sandbox call" />
                </Panel>

                <label className="flex items-center gap-3 text-[14px] text-foreground">
                  <input
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={(event) => setAcceptedTerms(event.target.checked)}
                    className="size-5 rounded border-border text-accent focus:ring-accent"
                  />
                  I accept all the terms and condition
                </label>
              </div>
            ) : null}
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-border-muted px-6 py-4">
            {stepIndex > 0 ? (
              <button
                type="button"
                onClick={previousStep}
                className="rounded-xl border border-border bg-background-subtle px-4 py-2.5 text-[14px] font-medium text-foreground transition hover:bg-background-muted"
              >
                Back
              </button>
            ) : null}

            {createStep !== 'review' ? (
              <button
                type="button"
                onClick={nextStep}
                disabled={!canContinue()}
                className="rounded-xl bg-[#0f172a] px-5 py-2.5 text-[14px] font-medium text-white transition hover:bg-[#1e293b] disabled:cursor-not-allowed disabled:bg-background-elevated disabled:text-foreground-subtle"
              >
                Next
              </button>
            ) : (
              <button
                type="button"
                onClick={completeFlow}
                disabled={!canContinue()}
                className="rounded-xl bg-[#0f172a] px-5 py-2.5 text-[14px] font-medium text-white transition hover:bg-[#1e293b] disabled:cursor-not-allowed disabled:bg-background-elevated disabled:text-foreground-subtle"
              >
                Save and Activate
              </button>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
