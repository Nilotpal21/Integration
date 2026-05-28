'use client';

import { useState } from 'react';
import {
  Rocket,
  Radio,
  KeyRound,
  Plus,
  ChevronRight,
  ChevronDown,
  MessageSquare,
  Phone,
  Smartphone,
  Mail,
  type LucideIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import { Footer } from '@/components/shell/Footer';
import { cn } from '@/lib/utils';

type Tab = 'environments' | 'channels' | 'api-keys';

const TABS: { id: Tab; label: string; icon: LucideIcon }[] = [
  { id: 'environments', label: 'Environments', icon: Rocket },
  { id: 'channels', label: 'Channels', icon: Radio },
  { id: 'api-keys', label: 'API Keys', icon: KeyRound },
];

export default function DeploymentsPage() {
  const [tab, setTab] = useState<Tab>('environments');

  return (
    <div className="space-y-5">
      <header className="pb-4 border-b border-border-muted">
        <h1 className="text-2xl font-semibold tracking-tight">Deployments</h1>
        <p className="text-xs text-foreground-muted mt-1.5">
          Manage environments, channels, and API keys for the apps in this project.
        </p>
      </header>

      <div className="flex items-center gap-1 border-b border-border-muted">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 -mb-px transition-colors',
              tab === id
                ? 'border-foreground text-foreground'
                : 'border-transparent text-foreground-muted hover:text-foreground',
            )}
          >
            <Icon className="size-3.5" />
            {label}
          </button>
        ))}
      </div>

      {tab === 'environments' && <EnvironmentsTab />}
      {tab === 'channels' && <ChannelsTab />}
      {tab === 'api-keys' && <ApiKeysTab />}

      <Footer />
    </div>
  );
}

/* -------------------- Environments -------------------- */

interface EnvDef {
  id: string;
  name: string;
  badge?: string;
  description?: string;
  tone: 'neutral' | 'info' | 'warning' | 'success';
  deployable: boolean;
}

const ENVIRONMENTS: EnvDef[] = [
  {
    id: 'base',
    name: 'Base (Default)',
    badge: 'fallback',
    description:
      'Variables defined here apply to all environments unless overridden by an environment-specific value.',
    tone: 'neutral',
    deployable: false,
  },
  { id: 'development', name: 'Development', tone: 'info', deployable: true },
  { id: 'staging', name: 'Staging', tone: 'warning', deployable: true },
  { id: 'production', name: 'Production', tone: 'success', deployable: true },
];

const envToneClass: Record<EnvDef['tone'], string> = {
  neutral: 'border-border-muted bg-background-subtle',
  info: 'border-info/30 bg-info-subtle/30',
  warning: 'border-warning/30 bg-warning-subtle/30',
  success: 'border-success/30 bg-success-subtle/30',
};

function EnvironmentsTab() {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-foreground-muted">0 active deployments</p>
        <button
          type="button"
          onClick={() => toast.info('New Deploy is disabled in this prototype.')}
          className="h-8 px-3 rounded-md text-xs font-medium bg-accent text-accent-foreground hover:bg-accent-muted transition-colors flex items-center gap-1.5"
        >
          <Plus className="size-3.5" />
          New Deploy
        </button>
      </div>

      <div className="space-y-3">
        {ENVIRONMENTS.map((env) => (
          <EnvironmentCard key={env.id} env={env} />
        ))}
      </div>
    </section>
  );
}

function EnvironmentCard({ env }: { env: EnvDef }) {
  const [open, setOpen] = useState(false);

  return (
    <div className={cn('rounded-lg border p-4', envToneClass[env.tone])}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold tracking-tight">{env.name}</h3>
            {env.badge && (
              <span className="text-[10px] uppercase tracking-wide bg-background-elevated text-foreground-muted px-1.5 py-0.5 rounded font-medium">
                {env.badge}
              </span>
            )}
          </div>
          {env.description ? (
            <p className="text-[11px] text-foreground-muted mt-1.5 max-w-[640px]">
              {env.description}
            </p>
          ) : (
            <p className="text-[11px] text-foreground-muted mt-1.5">No active deployment</p>
          )}
        </div>
        {env.deployable && (
          <button
            type="button"
            onClick={() => toast.info(`Deploy to ${env.name} is disabled in this prototype.`)}
            className="h-8 px-3 rounded-md text-xs font-medium bg-accent text-accent-foreground hover:bg-accent-muted transition-colors shrink-0"
          >
            Deploy Now
          </button>
        )}
      </div>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="mt-3 inline-flex items-center gap-1 text-[11px] text-foreground-muted hover:text-foreground transition-colors"
      >
        {open ? <ChevronDown className="size-3" /> : <ChevronRight className="size-3" />}
        Variables
      </button>

      {open && (
        <div className="mt-3 rounded-md border border-border-muted bg-background-subtle/60 p-3">
          <p className="text-[11px] text-foreground-muted">
            No variables defined for this environment yet.
          </p>
        </div>
      )}
    </div>
  );
}

/* -------------------- Channels -------------------- */

interface ChannelDef {
  id: string;
  label: string;
  icon: LucideIcon;
  description: string;
  enabled: boolean;
}

const CHANNELS: ChannelDef[] = [
  {
    id: 'digital',
    label: 'Digital',
    icon: MessageSquare,
    description: 'In-app chat surface on the credit union portal and mobile app.',
    enabled: true,
  },
  {
    id: 'voice',
    label: 'Voice',
    icon: Phone,
    description: 'IVR / call-center integration via Eltropy Voice.',
    enabled: false,
  },
  {
    id: 'sms',
    label: 'SMS',
    icon: Smartphone,
    description: 'Outbound and two-way SMS through Eltropy Messaging.',
    enabled: true,
  },
  {
    id: 'email',
    label: 'Email',
    icon: Mail,
    description: 'Templated email through the tenant’s configured sender.',
    enabled: false,
  },
];

function ChannelsTab() {
  return (
    <section className="space-y-3">
      <p className="text-xs text-foreground-muted">
        Channels are surfaces your deployed apps can run on. Per-app channel selection happens in
        each app’s Review Studio; this tab enables them at the project level.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {CHANNELS.map((c) => (
          <ChannelCard key={c.id} channel={c} />
        ))}
      </div>
    </section>
  );
}

function ChannelCard({ channel }: { channel: ChannelDef }) {
  const [enabled, setEnabled] = useState(channel.enabled);
  const Icon = channel.icon;
  return (
    <div className="rounded-lg border border-border-muted bg-background-subtle p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div
            className={cn(
              'size-8 rounded-md flex items-center justify-center shrink-0',
              enabled
                ? 'bg-success-subtle text-success'
                : 'bg-background-elevated text-foreground-muted',
            )}
          >
            <Icon className="size-4" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold tracking-tight">{channel.label}</div>
            <p className="text-[11px] text-foreground-muted mt-1 max-w-[280px]">
              {channel.description}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setEnabled((v) => !v)}
          className={cn(
            'h-6 w-10 rounded-full relative transition-colors shrink-0',
            enabled ? 'bg-success' : 'bg-background-elevated border border-border-muted',
          )}
          aria-pressed={enabled}
          aria-label={`${enabled ? 'Disable' : 'Enable'} ${channel.label}`}
        >
          <span
            className={cn(
              'absolute top-0.5 size-5 rounded-full bg-background transition-transform',
              enabled ? 'translate-x-[18px]' : 'translate-x-0.5',
            )}
          />
        </button>
      </div>
    </div>
  );
}

/* -------------------- API Keys -------------------- */

type ApiKeyKind = 'sdk' | 'platform';

function ApiKeysTab() {
  const [kind, setKind] = useState<ApiKeyKind>('sdk');

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-base font-semibold tracking-tight">API Keys</h2>
        <p className="text-xs text-foreground-muted mt-1">
          Create and manage API keys for external application access.
        </p>
      </div>

      <div className="flex items-center gap-1 border-b border-border-muted">
        {(
          [
            ['sdk', 'SDK Keys'],
            ['platform', 'Platform Keys'],
          ] as const
        ).map(([k, label]) => (
          <button
            key={k}
            type="button"
            onClick={() => setKind(k)}
            className={cn(
              'px-3 py-2 text-xs font-medium border-b-2 -mb-px transition-colors',
              kind === k
                ? 'border-foreground text-foreground'
                : 'border-transparent text-foreground-muted hover:text-foreground',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="rounded-lg border border-border-muted bg-background-subtle py-16 flex flex-col items-center text-center px-4">
        <div className="size-10 rounded-md bg-background-elevated flex items-center justify-center mb-3">
          <KeyRound className="size-5 text-foreground-muted" />
        </div>
        <h3 className="text-sm font-semibold">No API keys</h3>
        <p className="text-[11px] text-foreground-muted mt-1">
          Create an API key to connect external applications.
        </p>
        <button
          type="button"
          onClick={() =>
            toast.info(
              `Create ${kind === 'sdk' ? 'SDK' : 'Platform'} key is disabled in this prototype.`,
            )
          }
          className="mt-4 h-8 px-3 rounded-md text-xs font-medium bg-accent text-accent-foreground hover:bg-accent-muted transition-colors flex items-center gap-1.5"
        >
          <Plus className="size-3.5" />
          Create Key
        </button>
      </div>
    </section>
  );
}
