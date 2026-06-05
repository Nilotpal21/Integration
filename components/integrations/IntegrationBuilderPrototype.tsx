'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  AlertTriangle,
  BadgeCheck,
  Bot,
  CheckCircle2,
  ChevronRight,
  Clock3,
  KeyRound,
  LayoutTemplate,
  LockKeyhole,
  Play,
  Plus,
  Power,
  RefreshCcw,
  ShieldAlert,
  Sparkles,
  Trash2,
  Workflow,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { cn } from '@/lib/utils';

type CreationMode = 'scratch' | 'template';
type RecordStatus = 'draft' | 'active';
type AvailabilityStatus = 'active' | 'disabled' | 'revoked';

type AppDef = {
  id: string;
  name: string;
  category: string;
  blurb: string;
  authOptions: string[];
};

type TemplateDef = {
  id: string;
  appId: string;
  name: string;
  authType: string;
  summary: string;
};

type Connector = {
  id: string;
  appId: string;
  connectionName: string;
  authType: string;
  source: CreationMode;
  recordStatus: RecordStatus;
  availabilityStatus: AvailabilityStatus;
  docsUrl?: string;
  usesTemplate?: string;
  components: string[];
  parsedSpecLabel: string;
  savedAt: string;
  lastTestAt?: string;
};

type CreateStep =
  | 'entry'
  | 'mode'
  | 'docs'
  | 'spec'
  | 'components'
  | 'generated'
  | 'test';

type ConfirmAction = 'disable' | 'enable' | 'revoke' | 'delete' | 'reauthorize' | null;

const APPS: AppDef[] = [
  {
    id: 'hubspot',
    name: 'HubSpot',
    category: 'CRM',
    blurb: 'Customer, marketing, and usage endpoints with mixed pagination patterns.',
    authOptions: ['PAT', 'OAuth'],
  },
  {
    id: 'salesforce',
    name: 'Salesforce',
    category: 'CRM',
    blurb: 'Enterprise-grade account and activity data with strict rate and object controls.',
    authOptions: ['OAuth', 'API Key'],
  },
  {
    id: 'zendesk',
    name: 'Zendesk',
    category: 'Support',
    blurb: 'Ticket, agent, and satisfaction APIs for support operations analytics.',
    authOptions: ['PAT'],
  },
  {
    id: 'calendly',
    name: 'Calendly',
    category: 'Scheduling',
    blurb: 'Read-only event, invitee, and organization usage data from public REST docs.',
    authOptions: ['PAT'],
  },
];

const TEMPLATES: TemplateDef[] = [
  {
    id: 'hubspot-template',
    appId: 'hubspot',
    name: 'HubSpot CRM Read-only',
    authType: 'PAT',
    summary: 'Customer and activity sync with rate-limit handling and structured usage views.',
  },
  {
    id: 'salesforce-template',
    appId: 'salesforce',
    name: 'Salesforce Accounts Snapshot',
    authType: 'OAuth',
    summary: 'Read-only baseline for account, contact, and pipeline snapshot workloads.',
  },
  {
    id: 'zendesk-template',
    appId: 'zendesk',
    name: 'Zendesk Tickets Usage',
    authType: 'PAT',
    summary: 'Ticket volume, agent handle time, and CSAT usage explorer template.',
  },
];

const COMPONENT_OPTIONS = [
  'API Client',
  'Auth Setup',
  'Users + Usage Data',
  'Error Handling',
  'Pagination',
  'Logging',
];

const CODE_FILES = [
  'connector.config.ts',
  'src/client.ts',
  'src/auth.ts',
  'src/endpoints/users.ts',
  'src/endpoints/usage.ts',
  'src/logging.ts',
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

function formatNow() {
  return new Date().toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

function statusTone(status: AvailabilityStatus | RecordStatus) {
  if (status === 'active') return 'bg-success/15 text-green-200 border-green-900/60';
  if (status === 'disabled') return 'bg-warning/15 text-amber-100 border-amber-900/60';
  if (status === 'revoked') return 'bg-error/15 text-red-100 border-red-900/60';
  return 'bg-background-muted text-foreground-muted border-border';
}

function Card({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn('rounded-[22px] border border-border bg-background-elevated/95', className)}>
      {children}
    </div>
  );
}

function SectionTitle({
  eyebrow,
  title,
  body,
}: {
  eyebrow?: string;
  title: string;
  body?: string;
}) {
  return (
    <div className="space-y-1.5">
      {eyebrow ? <p className="text-[11px] uppercase tracking-[0.28em] text-foreground-subtle">{eyebrow}</p> : null}
      <h2 className="text-xl font-semibold tracking-tight text-foreground">{title}</h2>
      {body ? <p className="max-w-2xl text-sm leading-6 text-foreground-muted">{body}</p> : null}
    </div>
  );
}

export function IntegrationBuilderPrototype() {
  const searchParams = useSearchParams();
  const { authMethod, signedInAt, idleLock, triggerIdleLock, resumeSession, signOut } = useAuth();
  const [connectors, setConnectors] = useState<Connector[]>([]);
  const [selectedAppId, setSelectedAppId] = useState<string>(APPS[0].id);
  const [selectedConnectorId, setSelectedConnectorId] = useState<string | null>(null);
  const [showAppLibrary, setShowAppLibrary] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [createStep, setCreateStep] = useState<CreateStep>('entry');
  const [creationMode, setCreationMode] = useState<CreationMode>('scratch');
  const [connectionName, setConnectionName] = useState('');
  const [draftAppId, setDraftAppId] = useState(APPS[0].id);
  const [docsUrl, setDocsUrl] = useState('https://developers.hubspot.com/docs/api/overview');
  const [modelSelectionOpen, setModelSelectionOpen] = useState(false);
  const [parsingModel, setParsingModel] = useState('Claude Haiku 4.5');
  const [generationModel, setGenerationModel] = useState('Claude Sonnet 4.6');
  const [selectedTemplateId, setSelectedTemplateId] = useState(TEMPLATES[0].id);
  const [selectedComponents, setSelectedComponents] = useState<string[]>([
    'API Client',
    'Auth Setup',
    'Users + Usage Data',
    'Error Handling',
    'Pagination',
  ]);
  const [testPassed, setTestPassed] = useState(false);
  const [testCredential, setTestCredential] = useState('demo_pat_8f4c...');
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);
  const [autoOpenedWizard, setAutoOpenedWizard] = useState(false);

  const appsWithCounts = useMemo(() => {
    return APPS.map((app) => {
      const appConnectors = connectors.filter((connector) => connector.appId === app.id);
      return {
        ...app,
        total: appConnectors.length,
        active: appConnectors.filter((connector) => connector.availabilityStatus === 'active').length,
        disabled: appConnectors.filter((connector) => connector.availabilityStatus === 'disabled').length,
        revoked: appConnectors.filter((connector) => connector.availabilityStatus === 'revoked').length,
      };
    });
  }, [connectors]);

  const selectedApp = APPS.find((app) => app.id === selectedAppId) ?? APPS[0];
  const appConnectors = connectors.filter((connector) => connector.appId === selectedApp.id);
  const selectedConnector =
    connectors.find((connector) => connector.id === selectedConnectorId) ?? appConnectors[0] ?? null;
  const currentTemplate = TEMPLATES.find((template) => template.id === selectedTemplateId) ?? TEMPLATES[0];
  const isFirstRun = connectors.length === 0 && !showAppLibrary;
  const nameTaken = connectors.some(
    (connector) =>
      connector.appId === draftAppId &&
      connector.connectionName.trim().toLowerCase() === connectionName.trim().toLowerCase(),
  );
  const createSteps: Array<[CreateStep, string]> = creationMode === 'scratch'
    ? [
        ['mode', 'Create connector'],
        ['docs', 'Docs input'],
        ['spec', 'Parsed spec'],
        ['components', 'Components'],
        ['generated', 'Generated output'],
        ['test', 'Test and save'],
      ]
    : [
        ['mode', 'Create connector'],
        ['generated', 'Template review'],
        ['test', 'Sandbox test'],
      ];

  useEffect(() => {
    const startMode = searchParams.get('start');
    if (autoOpenedWizard || createOpen) return;
    if (startMode === 'scratch') {
      setShowAppLibrary(true);
      resetCreateFlow('scratch');
      setAutoOpenedWizard(true);
    }
  }, [autoOpenedWizard, createOpen, searchParams]);

  function resetCreateFlow(mode?: CreationMode) {
    const nextMode = mode ?? 'scratch';
    setCreateOpen(true);
    setCreationMode(nextMode);
    setCreateStep(mode ? 'mode' : 'entry');
    setDraftAppId(selectedAppId);
    setConnectionName('');
    setDocsUrl('https://developers.hubspot.com/docs/api/overview');
    setModelSelectionOpen(false);
    setParsingModel('Claude Haiku 4.5');
    setGenerationModel('Claude Sonnet 4.6');
    setSelectedTemplateId(TEMPLATES.find((template) => template.appId === selectedAppId)?.id ?? TEMPLATES[0].id);
    setSelectedComponents(['API Client', 'Auth Setup', 'Users + Usage Data', 'Error Handling', 'Pagination']);
    setTestPassed(false);
    setTestCredential('demo_pat_8f4c...');
  }

  function closeCreateFlow() {
    setCreateOpen(false);
    setCreateStep('entry');
    setTestPassed(false);
  }

  function chooseCreationMode(mode: CreationMode) {
    setCreationMode(mode);
    setCreateStep('mode');
  }

  function continueFromMode() {
    if (!connectionName.trim() || nameTaken) return;
    if (creationMode === 'scratch') {
      setCreateStep('docs');
      return;
    }
    setCreateStep('generated');
  }

  function continueScratchDocs() {
    setCreateStep('spec');
  }

  function continueSpec() {
    setCreateStep('components');
  }

  function continueComponents() {
    setCreateStep('generated');
  }

  function continueGenerated() {
    setCreateStep('test');
  }

  function saveConnector() {
    if (!testPassed) return;
    const now = formatNow();
    const connector: Connector = {
      id: crypto.randomUUID(),
      appId: draftAppId,
      connectionName: connectionName.trim(),
      authType: creationMode === 'template' ? currentTemplate.authType : APPS.find((app) => app.id === draftAppId)?.authOptions[0] ?? 'PAT',
      source: creationMode,
      recordStatus: 'active',
      availabilityStatus: 'active',
      docsUrl: creationMode === 'scratch' ? docsUrl : undefined,
      usesTemplate: creationMode === 'template' ? currentTemplate.name : undefined,
      components: selectedComponents,
      parsedSpecLabel:
        creationMode === 'template'
          ? `Stored Parsed Spec snapshot from ${currentTemplate.name}`
          : 'Fresh docs-derived Parsed Spec confirmed',
      savedAt: now,
      lastTestAt: now,
    };

    setConnectors((current) => [...current, connector]);
    setSelectedAppId(draftAppId);
    setSelectedConnectorId(connector.id);
    setShowAppLibrary(true);
    closeCreateFlow();
  }

  function mutateConnector(action: ConfirmAction) {
    if (!selectedConnector) return;

    setConnectors((current) =>
      current
        .map((connector) => {
          if (connector.id !== selectedConnector.id) return connector;
          if (action === 'disable') return { ...connector, availabilityStatus: 'disabled' as const };
          if (action === 'enable') return { ...connector, availabilityStatus: 'active' as const };
          if (action === 'revoke') return { ...connector, availabilityStatus: 'revoked' as const };
          if (action === 'reauthorize') return { ...connector, availabilityStatus: 'active' as const, lastTestAt: formatNow() };
          return connector;
        })
        .filter((connector) => !(action === 'delete' && connector.id === selectedConnector.id)),
    );

    if (action === 'delete') {
      setSelectedConnectorId(null);
    }
    setConfirmAction(null);
  }

  function toggleComponent(component: string) {
    setSelectedComponents((current) => {
      if (current.includes(component)) {
        return current.filter((entry) => entry !== component);
      }
      return [...current, component];
    });
  }

  return (
    <div className="space-y-6 pb-10">
      <Card className="overflow-hidden border-border/70 bg-[radial-gradient(circle_at_top_left,_rgba(219,176,82,0.18),_transparent_28%),linear-gradient(135deg,rgba(24,25,28,0.98),rgba(14,15,17,0.94))]">
        <div className="grid gap-6 px-6 py-7 lg:grid-cols-[1.35fr_0.9fr] lg:px-8">
          <div className="space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.25em] text-amber-100/80">
              <Workflow className="size-3.5" />
              Integration Builder Prototype
            </div>
            <div className="space-y-3">
              <h1 className="max-w-3xl text-3xl font-semibold tracking-tight text-white lg:text-[2.6rem]">
                Build, test, and activate independent connectors under each app.
              </h1>
              <p className="max-w-2xl text-sm leading-6 text-stone-300">
                This prototype includes project-to-connector navigation, first-run onboarding, docs-driven
                generation, server-side test gating, and connector lifecycle states for active, disabled, and revoked records.
              </p>
            </div>
          </div>

          <Card className="border-white/10 bg-black/20 p-5 backdrop-blur">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.28em] text-stone-400">Session</p>
                <h2 className="mt-2 text-lg font-semibold text-white">Authenticated prototype shell</h2>
              </div>
              <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-stone-300">
                {authMethod === 'sso' ? 'SSO' : authMethod === 'password' ? 'Email' : 'Guest'}
              </div>
            </div>
            <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <dt className="text-xs uppercase tracking-[0.2em] text-stone-500">Signed in</dt>
                <dd className="mt-2 text-stone-100">{signedInAt ? new Date(signedInAt).toLocaleString() : 'Not signed in'}</dd>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <dt className="text-xs uppercase tracking-[0.2em] text-stone-500">Workspace state</dt>
                <dd className="mt-2 text-stone-100">{connectors.length} connectors across {APPS.length} apps</dd>
              </div>
            </dl>
            <div className="mt-5 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={triggerIdleLock}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-stone-200 transition hover:bg-white/10"
              >
                Trigger Idle Lock
              </button>
              <button
                type="button"
                onClick={signOut}
                className="rounded-full border border-red-900/60 bg-red-950/40 px-3 py-2 text-xs font-medium text-red-100 transition hover:bg-red-950/60"
              >
                Sign Out
              </button>
            </div>
          </Card>
        </div>
      </Card>

      {isFirstRun ? (
        <Card className="overflow-hidden border-border/60 bg-[linear-gradient(180deg,rgba(217,176,82,0.10),rgba(18,18,20,0.96))] p-8 lg:p-10">
          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-5">
              <SectionTitle
                eyebrow="First Run"
                title="Build your first connector"
                body="Create a secure connector from API docs, test it before activation, and manage it under the app it belongs to."
              />
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAppLibrary(true);
                    resetCreateFlow('scratch');
                  }}
                  className="inline-flex items-center gap-2 rounded-full bg-[#d9b052] px-4 py-2 text-sm font-medium text-stone-950 transition hover:bg-[#e5bf6e]"
                >
                  <Sparkles className="size-4" />
                  Start From Scratch
                </button>
              </div>
            </div>

            <div className="grid gap-4">
              {[
                ['1. Choose an app', 'Group connectors under the SaaS product they belong to.'],
                ['2. Build from docs', 'Use docs-driven generation to create a new connector.'],
                ['3. Test and activate', 'Save only after a passing server-side sandbox call.'],
              ].map(([title, body]) => (
                <Card key={title} className="bg-background/70 p-4">
                  <p className="text-sm font-medium text-foreground">{title}</p>
                  <p className="mt-1.5 text-sm leading-6 text-foreground-muted">{body}</p>
                </Card>
              ))}
            </div>
          </div>
        </Card>
      ) : null}

      {showAppLibrary ? (
        <div className="grid gap-6 xl:grid-cols-[280px_1.05fr_0.95fr]">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <SectionTitle eyebrow="Apps" title="Browse app groups" />
              <button
                type="button"
                onClick={() => resetCreateFlow('scratch')}
                className="inline-flex items-center gap-1 rounded-full border border-border bg-background-subtle px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-background-muted"
              >
                <Plus className="size-3.5" />
                New
              </button>
            </div>
            <div className="mt-4 space-y-3">
              {appsWithCounts.map((app) => (
                <button
                  key={app.id}
                  type="button"
                  onClick={() => {
                    setSelectedAppId(app.id);
                    const nextConnector = connectors.find((connector) => connector.appId === app.id);
                    setSelectedConnectorId(nextConnector?.id ?? null);
                  }}
                  className={cn(
                    'w-full rounded-2xl border px-4 py-4 text-left transition',
                    selectedAppId === app.id
                      ? 'border-[#d9b052]/40 bg-[#d9b052]/10'
                      : 'border-border bg-background-subtle hover:bg-background-muted',
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">{app.name}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.22em] text-foreground-subtle">{app.category}</p>
                    </div>
                    <div className="rounded-full border border-border bg-background px-2.5 py-1 text-xs text-foreground-muted">
                      {app.total}
                    </div>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-foreground-muted">{app.blurb}</p>
                  <div className="mt-3 flex gap-2 text-[11px] text-foreground-subtle">
                    <span>{app.active} active</span>
                    <span>·</span>
                    <span>{app.disabled} disabled</span>
                    <span>·</span>
                    <span>{app.revoked} revoked</span>
                  </div>
                </button>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.28em] text-foreground-subtle">{selectedApp.category}</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">{selectedApp.name}</h2>
                <p className="mt-2 max-w-xl text-sm leading-6 text-foreground-muted">{selectedApp.blurb}</p>
              </div>
              <button
                type="button"
                onClick={() => resetCreateFlow('scratch')}
                className="inline-flex items-center gap-2 rounded-full bg-[#d9b052] px-4 py-2 text-sm font-medium text-stone-950 transition hover:bg-[#e5bf6e]"
              >
                <Plus className="size-4" />
                New Connector
              </button>
            </div>

            {appConnectors.length === 0 ? (
              <Card className="mt-6 border-dashed bg-background-subtle/70 p-6">
                <p className="text-lg font-medium text-foreground">No connectors for this app</p>
                <p className="mt-2 max-w-lg text-sm leading-6 text-foreground-muted">
                  Create a connector from docs or start from a vetted template. Each connector will carry its own
                  credentials and lifecycle state under {selectedApp.name}.
                </p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => resetCreateFlow('scratch')}
                    className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background transition hover:bg-foreground-muted"
                  >
                    Start From Scratch
                  </button>
                  <button
                    type="button"
                    onClick={() => resetCreateFlow('template')}
                    className="rounded-full border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition hover:bg-background-muted"
                  >
                    Use Existing Template
                  </button>
                </div>
              </Card>
            ) : (
              <div className="mt-6 overflow-hidden rounded-2xl border border-border">
                <div className="grid grid-cols-[1.5fr_0.8fr_0.8fr_1fr] gap-4 border-b border-border bg-background-subtle px-4 py-3 text-[11px] uppercase tracking-[0.24em] text-foreground-subtle">
                  <div>Connection Name</div>
                  <div>Auth</div>
                  <div>Record</div>
                  <div>Availability</div>
                </div>
                <div className="divide-y divide-border">
                  {appConnectors.map((connector) => (
                    <button
                      key={connector.id}
                      type="button"
                      onClick={() => setSelectedConnectorId(connector.id)}
                      className={cn(
                        'grid w-full grid-cols-[1.5fr_0.8fr_0.8fr_1fr] gap-4 px-4 py-4 text-left transition',
                        selectedConnector?.id === connector.id ? 'bg-[#d9b052]/10' : 'bg-background hover:bg-background-subtle',
                      )}
                    >
                      <div>
                        <p className="text-sm font-medium text-foreground">{connector.connectionName}</p>
                        <p className="mt-1 text-xs text-foreground-subtle">
                          {connector.source === 'scratch' ? 'Scratch-built' : `Template · ${connector.usesTemplate}`}
                        </p>
                      </div>
                      <div className="text-sm text-foreground-muted">{connector.authType}</div>
                      <div>
                        <span className={cn('inline-flex rounded-full border px-2.5 py-1 text-xs', statusTone(connector.recordStatus))}>
                          {connector.recordStatus}
                        </span>
                      </div>
                      <div>
                        <span className={cn('inline-flex rounded-full border px-2.5 py-1 text-xs', statusTone(connector.availabilityStatus))}>
                          {connector.availabilityStatus}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </Card>

          <Card className="p-5">
            {selectedConnector ? (
              <>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.28em] text-foreground-subtle">Connector Detail</p>
                    <h2 className="mt-2 text-xl font-semibold text-foreground">{selectedConnector.connectionName}</h2>
                    <p className="mt-2 text-sm leading-6 text-foreground-muted">
                      {selectedConnector.source === 'scratch'
                        ? 'Fresh docs-derived connector with Parsed Spec confirmation.'
                        : 'Independent connector created from a vetted template snapshot.'}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className={cn('rounded-full border px-2.5 py-1 text-xs', statusTone(selectedConnector.recordStatus))}>
                      record: {selectedConnector.recordStatus}
                    </span>
                    <span className={cn('rounded-full border px-2.5 py-1 text-xs', statusTone(selectedConnector.availabilityStatus))}>
                      availability: {selectedConnector.availabilityStatus}
                    </span>
                  </div>
                </div>

                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  {[
                    ['Auth Type', selectedConnector.authType],
                    ['Source', selectedConnector.source === 'scratch' ? 'Start from scratch' : 'Existing template'],
                    ['Parsed Spec', selectedConnector.parsedSpecLabel],
                    ['Last Test', selectedConnector.lastTestAt ?? 'No test recorded'],
                  ].map(([label, value]) => (
                    <Card key={label} className="bg-background-subtle/80 p-4">
                      <p className="text-[11px] uppercase tracking-[0.22em] text-foreground-subtle">{label}</p>
                      <p className="mt-2 text-sm leading-6 text-foreground">{value}</p>
                    </Card>
                  ))}
                </div>

                <Card className="mt-5 bg-background-subtle/80 p-4">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-foreground-subtle">Available actions</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {selectedConnector.availabilityStatus === 'active' ? (
                      <button
                        type="button"
                        onClick={() => setConfirmAction('disable')}
                        className="rounded-full border border-border bg-background px-3 py-2 text-xs font-medium text-foreground transition hover:bg-background-muted"
                      >
                        Disable
                      </button>
                    ) : null}
                    {selectedConnector.availabilityStatus === 'disabled' ? (
                      <button
                        type="button"
                        onClick={() => setConfirmAction('enable')}
                        className="rounded-full border border-border bg-background px-3 py-2 text-xs font-medium text-foreground transition hover:bg-background-muted"
                      >
                        Enable
                      </button>
                    ) : null}
                    {selectedConnector.availabilityStatus !== 'revoked' ? (
                      <button
                        type="button"
                        onClick={() => setConfirmAction('revoke')}
                        className="rounded-full border border-red-900/60 bg-red-950/40 px-3 py-2 text-xs font-medium text-red-100 transition hover:bg-red-950/60"
                      >
                        Revoke
                      </button>
                    ) : null}
                    {selectedConnector.availabilityStatus === 'revoked' ? (
                      <>
                        <button
                          type="button"
                          onClick={() => setConfirmAction('reauthorize')}
                          className="rounded-full border border-emerald-900/60 bg-emerald-950/40 px-3 py-2 text-xs font-medium text-emerald-100 transition hover:bg-emerald-950/60"
                        >
                          Reauthorize
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmAction('delete')}
                          className="rounded-full border border-red-900/60 bg-red-950/40 px-3 py-2 text-xs font-medium text-red-100 transition hover:bg-red-950/60"
                        >
                          Delete
                        </button>
                      </>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => resetCreateFlow(selectedConnector.source)}
                      className="rounded-full border border-border bg-background px-3 py-2 text-xs font-medium text-foreground transition hover:bg-background-muted"
                    >
                      Regenerate
                    </button>
                  </div>
                </Card>
              </>
            ) : (
              <div className="flex h-full min-h-[320px] items-center justify-center rounded-2xl border border-dashed border-border bg-background-subtle/60 p-8 text-center">
                <div className="max-w-sm space-y-3">
                  <p className="text-lg font-medium text-foreground">Connector detail appears here</p>
                  <p className="text-sm leading-6 text-foreground-muted">
                    Select a connector under {selectedApp.name} to inspect auth state, last test, and lifecycle actions.
                  </p>
                </div>
              </div>
            )}
          </Card>
        </div>
      ) : null}

      {createOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm">
          <Card className="max-h-[92vh] w-full max-w-5xl overflow-auto border-border/80 bg-background p-0">
            <div className="border-b border-border bg-background-subtle px-6 py-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.28em] text-foreground-subtle">Create Connector</p>
                  <h2 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
                    {createStep === 'entry'
                      ? 'Choose how to create this connector'
                      : creationMode === 'scratch'
                        ? 'Start from scratch'
                        : 'Use existing template'}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={closeCreateFlow}
                  className="rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground-muted transition hover:text-foreground"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="grid gap-0 lg:grid-cols-[220px_1fr]">
              {createStep !== 'entry' ? (
                <div className="border-r border-border bg-background-subtle/50 p-5">
                  <div className="space-y-3 text-sm">
                    {createSteps.map(([step, label]) => (
                      <div
                        key={`${step}-${label}`}
                        className={cn(
                          'rounded-2xl border px-3 py-3',
                          createStep === step ? 'border-[#d9b052]/40 bg-[#d9b052]/10 text-foreground' : 'border-border bg-background text-foreground-muted',
                        )}
                      >
                        {label}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="p-6">
                {createStep === 'entry' ? (
                  <div className="space-y-6">
                    <SectionTitle
                      eyebrow="Start"
                      title="Select the creation path"
                      body="Choose whether to generate a connector from current API docs or begin from a vetted template baseline."
                    />
                    <div className="grid gap-4 md:grid-cols-2">
                      {[
                        {
                          mode: 'scratch' as const,
                          title: 'Start From Scratch',
                          body: 'Docs-driven parsing, model-aware generation, and parsed-spec confirmation.',
                          icon: Sparkles,
                        },
                        {
                          mode: 'template' as const,
                          title: 'Use Existing Template',
                          body: 'Create a new independent connector from a vetted baseline without exposing model selection.',
                          icon: LayoutTemplate,
                        },
                      ].map((option) => {
                        const Icon = option.icon;
                        return (
                          <button
                            key={option.mode}
                            type="button"
                            onClick={() => chooseCreationMode(option.mode)}
                            className="rounded-[22px] border border-border bg-background-subtle p-5 text-left transition hover:bg-background-muted"
                          >
                            <Icon className="size-5 text-[#d9b052]" />
                            <p className="mt-4 text-lg font-medium text-foreground">{option.title}</p>
                            <p className="mt-2 text-sm leading-6 text-foreground-muted">{option.body}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : null}

                {createStep === 'mode' ? (
                  <div className="space-y-6">
                    <SectionTitle
                      eyebrow="Step 1"
                      title="Choose the connector shape"
                      body="Give this connector a unique name under its app, then continue into the selected creation flow."
                    />
                    <Card className="border-amber-900/40 bg-amber-950/20 p-5">
                      <div className="flex gap-3">
                        <AlertTriangle className="mt-0.5 size-5 text-amber-300" />
                        <div className="space-y-2 text-sm leading-6 text-amber-50/90">
                          <p>
                            {creationMode === 'scratch'
                              ? 'Generated behavior depends on the quality and completeness of the documentation you provide. Parsing and generation choices only appear in this flow.'
                              : 'This template starts from a vetted baseline, but it may not reflect the latest API docs unless you refresh it later from docs.'}
                          </p>
                        </div>
                      </div>
                    </Card>
                    <div className="grid gap-4 md:grid-cols-2">
                      <label className="space-y-2">
                        <span className="text-sm font-medium text-foreground">App</span>
                        <select
                          value={draftAppId}
                          onChange={(event) => setDraftAppId(event.target.value)}
                          className="h-11 w-full rounded-2xl border border-border bg-background-subtle px-4 text-sm text-foreground outline-none transition focus:border-[#d9b052]/40"
                        >
                          {APPS.map((app) => (
                            <option key={app.id} value={app.id}>
                              {app.name}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="space-y-2">
                        <span className="text-sm font-medium text-foreground">Connection Name</span>
                        <input
                          value={connectionName}
                          onChange={(event) => setConnectionName(event.target.value)}
                          placeholder="HubSpot US Prod"
                          className="h-11 w-full rounded-2xl border border-border bg-background-subtle px-4 text-sm text-foreground outline-none transition placeholder:text-foreground-subtle focus:border-[#d9b052]/40"
                        />
                        {nameTaken ? <p className="text-xs text-red-300">This connection name is already used in the selected app.</p> : null}
                      </label>
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => setCreateStep('entry')}
                        className="mr-auto rounded-full border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition hover:bg-background-muted"
                      >
                        Back
                      </button>
                      <button
                        type="button"
                        onClick={continueFromMode}
                        disabled={!connectionName.trim() || nameTaken}
                        className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background transition hover:bg-foreground-muted disabled:cursor-not-allowed disabled:bg-background-muted disabled:text-foreground-subtle"
                      >
                        Continue
                      </button>
                    </div>
                  </div>
                ) : null}

                {createStep === 'docs' ? (
                  <div className="space-y-6">
                    <SectionTitle
                      eyebrow="Docs Input"
                      title="Parse current API documentation"
                      body="Provide a docs URL for the scratch flow. Model selection is available only here and remains hidden unless the user needs advanced control."
                    />
                    <label className="block space-y-2">
                      <span className="text-sm font-medium text-foreground">Documentation URL</span>
                      <input
                        value={docsUrl}
                        onChange={(event) => setDocsUrl(event.target.value)}
                        className="h-11 w-full rounded-2xl border border-border bg-background-subtle px-4 text-sm text-foreground outline-none transition focus:border-[#d9b052]/40"
                      />
                    </label>

                    <Card className="bg-background-subtle/70 p-4">
                      <button
                        type="button"
                        onClick={() => setModelSelectionOpen((current) => !current)}
                        className="flex w-full items-center justify-between text-left"
                      >
                        <div>
                          <p className="text-sm font-medium text-foreground">Advanced: Model Selection</p>
                          <p className="mt-1 text-sm text-foreground-muted">Only shown in Start from Scratch.</p>
                        </div>
                        <Bot className="size-4 text-[#d9b052]" />
                      </button>

                      {modelSelectionOpen ? (
                        <div className="mt-4 grid gap-4 md:grid-cols-2">
                          <label className="space-y-2">
                            <span className="text-sm text-foreground-muted">Parsing Model</span>
                            <select
                              value={parsingModel}
                              onChange={(event) => setParsingModel(event.target.value)}
                              className="h-11 w-full rounded-2xl border border-border bg-background px-4 text-sm text-foreground outline-none"
                            >
                              <option>Claude Haiku 4.5</option>
                              <option>Claude Sonnet 4.6</option>
                            </select>
                          </label>
                          <label className="space-y-2">
                            <span className="text-sm text-foreground-muted">Generation Model</span>
                            <select
                              value={generationModel}
                              onChange={(event) => setGenerationModel(event.target.value)}
                              className="h-11 w-full rounded-2xl border border-border bg-background px-4 text-sm text-foreground outline-none"
                            >
                              <option>Claude Sonnet 4.6</option>
                              <option>Claude Opus 4.8</option>
                            </select>
                          </label>
                        </div>
                      ) : null}
                    </Card>

                    <div className="grid gap-3 md:grid-cols-3">
                      {['Fetching docs', 'Detecting machine-readable spec', 'Normalizing Parsed Spec'].map((label) => (
                        <Card key={label} className="bg-background-subtle/60 p-4">
                          <Clock3 className="size-4 text-[#d9b052]" />
                          <p className="mt-3 text-sm font-medium text-foreground">{label}</p>
                        </Card>
                      ))}
                    </div>

                    <div className="flex justify-between">
                      <button
                        type="button"
                        onClick={() => setCreateStep('mode')}
                        className="rounded-full border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition hover:bg-background-muted"
                      >
                        Back
                      </button>
                      <button
                        type="button"
                        onClick={continueScratchDocs}
                        className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background transition hover:bg-foreground-muted"
                      >
                        Parse Docs
                      </button>
                    </div>
                  </div>
                ) : null}

                {createStep === 'spec' ? (
                  <div className="space-y-6">
                    <SectionTitle
                      eyebrow="Parsed Spec"
                      title="Confirm the highest-leverage gate"
                      body="The Parsed Spec is the single source of truth for the request form, generated code, and response rendering."
                    />
                    <div className="grid gap-4 md:grid-cols-4">
                      {[
                        ['Endpoints', '14'],
                        ['Auth', 'PAT'],
                        ['Pagination', 'Cursor'],
                        ['Rate Limits', '429 + Retry-After'],
                      ].map(([label, value]) => (
                        <Card key={label} className="bg-background-subtle/70 p-4">
                          <p className="text-[11px] uppercase tracking-[0.22em] text-foreground-subtle">{label}</p>
                          <p className="mt-2 text-lg font-semibold text-foreground">{value}</p>
                        </Card>
                      ))}
                    </div>

                    <Card className="overflow-hidden">
                      <div className="border-b border-border bg-background-subtle px-4 py-3 text-[11px] uppercase tracking-[0.24em] text-foreground-subtle">
                        Endpoint preview
                      </div>
                      <div className="divide-y divide-border">
                        {parsedSpecPreview.map((endpoint) => (
                          <div key={endpoint.path} className="grid grid-cols-[90px_1fr_100px] gap-4 px-4 py-3 text-sm">
                            <span className="text-[#d9b052]">{endpoint.method}</span>
                            <span className="text-foreground">{endpoint.path}</span>
                            <span className="text-foreground-muted">{endpoint.operation}</span>
                          </div>
                        ))}
                      </div>
                    </Card>

                    <div className="flex justify-between">
                      <button
                        type="button"
                        onClick={() => setCreateStep('docs')}
                        className="rounded-full border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition hover:bg-background-muted"
                      >
                        Re-crawl
                      </button>
                      <button
                        type="button"
                        onClick={continueSpec}
                        className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background transition hover:bg-foreground-muted"
                      >
                        Confirm Parsed Spec
                      </button>
                    </div>
                  </div>
                ) : null}

                {createStep === 'components' ? (
                  <div className="space-y-6">
                    <SectionTitle
                      eyebrow="Components"
                      title="Select what to generate"
                      body="Dependencies compose into one coherent codebase. Users + Usage Data implies API client and auth setup."
                    />
                    <div className="grid gap-3 md:grid-cols-2">
                      {COMPONENT_OPTIONS.map((component) => (
                        <button
                          key={component}
                          type="button"
                          onClick={() => toggleComponent(component)}
                          className={cn(
                            'rounded-2xl border p-4 text-left transition',
                            selectedComponents.includes(component)
                              ? 'border-[#d9b052]/40 bg-[#d9b052]/10'
                              : 'border-border bg-background-subtle hover:bg-background-muted',
                          )}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-sm font-medium text-foreground">{component}</p>
                            {selectedComponents.includes(component) ? <CheckCircle2 className="size-4 text-[#d9b052]" /> : null}
                          </div>
                        </button>
                      ))}
                    </div>

                    <div className="flex justify-between">
                      <button
                        type="button"
                        onClick={() => setCreateStep('spec')}
                        className="rounded-full border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition hover:bg-background-muted"
                      >
                        Back
                      </button>
                      <button
                        type="button"
                        onClick={continueComponents}
                        className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background transition hover:bg-foreground-muted"
                      >
                        Generate Connector
                      </button>
                    </div>
                  </div>
                ) : null}

                {createStep === 'generated' ? (
                  <div className="space-y-6">
                    <SectionTitle
                      eyebrow="Generated Output"
                      title={creationMode === 'template' ? 'Review template-based baseline' : 'Review generated code and static analysis'}
                      body={
                        creationMode === 'template'
                          ? 'This new connector starts from a vetted template snapshot. It remains independent from the source template after creation.'
                          : 'Static analysis passed. Regeneration stages changes here and does not overwrite the live connector until the user explicitly saves.'
                      }
                    />
                    <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
                      <Card className="bg-background-subtle/70 p-4">
                        <p className="text-[11px] uppercase tracking-[0.22em] text-foreground-subtle">File tree</p>
                        <div className="mt-3 space-y-2">
                          {CODE_FILES.map((file) => (
                            <div key={file} className="rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground-muted">
                              {file}
                            </div>
                          ))}
                        </div>
                      </Card>

                      <Card className="bg-background-subtle/70 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-[11px] uppercase tracking-[0.22em] text-foreground-subtle">Static analysis</p>
                          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-900/60 bg-emerald-950/40 px-2.5 py-1 text-xs text-emerald-100">
                            <BadgeCheck className="size-3.5" />
                            Passed
                          </span>
                        </div>
                        <pre className="mt-4 overflow-auto rounded-2xl border border-border bg-background p-4 text-xs leading-6 text-foreground-muted">{`export const connector = {
  auth: "${creationMode === 'template' ? currentTemplate.authType : 'PAT'}",
  readOnly: true,
  rateLimit: { status: 429, retryAfterHeader: "Retry-After" },
  pagination: { style: "cursor", field: "next_page_token" }
};`}</pre>
                      </Card>
                    </div>

                    <div className="flex justify-between">
                      <button
                        type="button"
                        onClick={() => setCreateStep(creationMode === 'scratch' ? 'components' : 'mode')}
                        className="rounded-full border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition hover:bg-background-muted"
                      >
                        Back
                      </button>
                      <button
                        type="button"
                        onClick={continueGenerated}
                        className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background transition hover:bg-foreground-muted"
                      >
                        Continue to Test
                      </button>
                    </div>
                  </div>
                ) : null}

                {createStep === 'test' ? (
                  <div className="space-y-6">
                    <SectionTitle
                      eyebrow="Sandbox Test"
                      title="Test server-side before activation"
                      body="Credentials are collected here, stored server-side, and never sent to the model. Save activates the connector only after a successful sandbox call."
                    />
                    <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
                      <Card className="bg-background-subtle/70 p-4">
                        <p className="text-[11px] uppercase tracking-[0.22em] text-foreground-subtle">Credential set</p>
                        <label className="mt-3 block space-y-2">
                          <span className="text-sm text-foreground-muted">Primary credential</span>
                          <input
                            value={testCredential}
                            onChange={(event) => setTestCredential(event.target.value)}
                            className="h-11 w-full rounded-2xl border border-border bg-background px-4 text-sm text-foreground outline-none"
                          />
                        </label>
                        <p className="mt-3 text-xs leading-5 text-foreground-subtle">
                          One connector supports one credential set in v1. Revoking deletes it. Reauthorizing overwrites the same binding.
                        </p>
                      </Card>

                      <Card className="bg-background-subtle/70 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-[11px] uppercase tracking-[0.22em] text-foreground-subtle">Response preview</p>
                          <span className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2.5 py-1 text-xs text-foreground-muted">
                            Structured
                          </span>
                        </div>
                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                          {Object.entries(demoResponse).map(([key, value]) => (
                            <Card key={key} className="bg-background p-3">
                              <p className="text-[11px] uppercase tracking-[0.18em] text-foreground-subtle">{key}</p>
                              <p className="mt-2 text-sm text-foreground">{value}</p>
                            </Card>
                          ))}
                        </div>
                      </Card>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setTestPassed(true)}
                        className="inline-flex items-center gap-2 rounded-full bg-[#d9b052] px-4 py-2 text-sm font-medium text-stone-950 transition hover:bg-[#e5bf6e]"
                      >
                        <Play className="size-4" />
                        Run Test
                      </button>
                      <button
                        type="button"
                        onClick={saveConnector}
                        disabled={!testPassed}
                        className="inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background transition hover:bg-foreground-muted disabled:cursor-not-allowed disabled:bg-background-muted disabled:text-foreground-subtle"
                      >
                        <CheckCircle2 className="size-4" />
                        Save and Activate
                      </button>
                      {testPassed ? <span className="text-sm text-emerald-200">Sandbox call succeeded. Save is now unlocked.</span> : null}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </Card>
        </div>
      ) : null}

      {confirmAction && selectedConnector ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-lg border-border/80 bg-background p-6">
            <div className="flex items-start gap-4">
              <div className="rounded-2xl border border-border bg-background-subtle p-3">
                {confirmAction === 'reauthorize' ? (
                  <KeyRound className="size-5 text-[#d9b052]" />
                ) : confirmAction === 'delete' ? (
                  <Trash2 className="size-5 text-red-300" />
                ) : confirmAction === 'revoke' ? (
                  <ShieldAlert className="size-5 text-red-300" />
                ) : (
                  <Power className="size-5 text-[#d9b052]" />
                )}
              </div>
              <div className="space-y-3">
                <h3 className="text-xl font-semibold text-foreground">
                  {confirmAction === 'disable' && 'Disable connector?'}
                  {confirmAction === 'enable' && 'Enable connector?'}
                  {confirmAction === 'revoke' && 'Revoke connector?'}
                  {confirmAction === 'delete' && 'Delete connector?'}
                  {confirmAction === 'reauthorize' && 'Reauthorize connector?'}
                </h3>
                <p className="text-sm leading-6 text-foreground-muted">
                  {confirmAction === 'disable' &&
                    'Disabled connectors remain stored and keep their credentials, but they become unavailable until re-enabled.'}
                  {confirmAction === 'enable' &&
                    'This will make the connector available again using the same stored credential set.'}
                  {confirmAction === 'revoke' &&
                    'Revoking makes the connector unavailable and deletes its stored credential. Reauthorization will be required before reuse.'}
                  {confirmAction === 'delete' &&
                    'Delete is a hard delete from the application database and is only allowed after revoke. Audit events remain, but the connector record is removed.'}
                  {confirmAction === 'reauthorize' &&
                    'Reauthorizing overwrites the same connector credential binding and returns the connector to active availability.'}
                </p>
                <Card className="bg-background-subtle/70 p-4 text-sm text-foreground-muted">
                  <p className="font-medium text-foreground">{selectedConnector.connectionName}</p>
                  <p className="mt-1">No rollback is available in v1. Proceed only if you want this state change to be permanent.</p>
                </Card>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmAction(null)}
                className="rounded-full border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition hover:bg-background-muted"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => mutateConnector(confirmAction)}
                className={cn(
                  'rounded-full px-4 py-2 text-sm font-medium transition',
                  confirmAction === 'delete' || confirmAction === 'revoke'
                    ? 'bg-red-600 text-white hover:bg-red-500'
                    : 'bg-foreground text-background hover:bg-foreground-muted',
                )}
              >
                Confirm
              </button>
            </div>
          </Card>
        </div>
      ) : null}

      {idleLock ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
          <Card className="w-full max-w-md border-border/80 bg-background p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl border border-border bg-background-subtle p-3">
                <LockKeyhole className="size-5 text-[#d9b052]" />
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.28em] text-foreground-subtle">Session Locked</p>
                <h2 className="mt-1 text-xl font-semibold text-foreground">Resume your connector session</h2>
              </div>
            </div>
            <p className="mt-4 text-sm leading-6 text-foreground-muted">
              Your session was locked due to inactivity. Resume to continue exactly where you left off in the integration builder.
            </p>
            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={resumeSession}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background transition hover:bg-foreground-muted"
              >
                <RefreshCcw className="size-4" />
                Resume Session
              </button>
              <button
                type="button"
                onClick={signOut}
                className="inline-flex items-center justify-center rounded-full border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition hover:bg-background-muted"
              >
                Sign Out
              </button>
            </div>
            <p className="mt-4 text-xs text-foreground-subtle">
              Signed in via {authMethod === 'sso' ? 'SSO' : authMethod === 'password' ? 'email + MFA' : 'unknown method'}.
            </p>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
