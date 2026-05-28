'use client';

import { Cpu, KeyRound, Plug, FileCode, Sparkles, type LucideIcon } from 'lucide-react';
import {
  purposeMeta,
  type ModelEndpoint,
  type ModelMode,
  type ModelStatus,
} from '@/lib/mock-data';
import { cn } from '@/lib/utils';

const modeIcon: Record<ModelMode, LucideIcon> = {
  api_key: KeyRound,
  openai_compatible: Plug,
  declared_contract: FileCode,
  platform_default: Sparkles,
};

const modeLabel: Record<ModelMode, string> = {
  api_key: 'API key',
  openai_compatible: 'OpenAI-compatible',
  declared_contract: 'Declared contract',
  platform_default: 'Platform default',
};

const statusStyle: Record<ModelStatus, { dot: string; text: string; bg: string; label: string }> = {
  healthy: { dot: 'bg-success', text: 'text-success', bg: 'bg-success-subtle', label: 'Healthy' },
  degraded: { dot: 'bg-warning', text: 'text-warning', bg: 'bg-warning-subtle', label: 'Degraded' },
  down: { dot: 'bg-error', text: 'text-error', bg: 'bg-error-subtle', label: 'Down' },
  fallback_active: {
    dot: 'bg-info',
    text: 'text-info',
    bg: 'bg-info-subtle',
    label: 'Fallback active',
  },
};

export function EndpointCard({
  endpoint,
  onClick,
}: {
  endpoint: ModelEndpoint;
  onClick: () => void;
}) {
  const ModeIcon = modeIcon[endpoint.mode];
  const status = statusStyle[endpoint.status];

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'text-left rounded-lg border bg-background-subtle hover:bg-background-muted/40 transition-colors p-4 flex flex-col gap-3',
        endpoint.status === 'down' ? 'border-error/30' : 'border-border-muted hover:border-border',
        endpoint.isPlatformDefault && 'border-purple/20',
      )}
    >
      <header className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2.5 min-w-0">
          <div
            className={cn(
              'size-9 rounded-md border flex items-center justify-center shrink-0',
              endpoint.isPlatformDefault
                ? 'border-purple/30 bg-purple/10 text-purple'
                : 'border-border-muted bg-background-elevated text-foreground-muted',
            )}
          >
            <ModeIcon className="size-4" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold tracking-tight truncate">{endpoint.name}</div>
            <div className="text-[11px] text-foreground-muted truncate font-mono">
              {endpoint.modelIdentifier}
            </div>
          </div>
        </div>
        <span
          className={cn(
            'inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded uppercase tracking-wide font-medium whitespace-nowrap',
            status.bg,
            status.text,
          )}
        >
          <span className={cn('size-1.5 rounded-full', status.dot)} />
          {status.label}
        </span>
      </header>

      <div className="flex items-center gap-2 text-[10px] flex-wrap">
        <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-background-muted/60 border border-border-muted text-foreground-muted font-mono">
          {modeLabel[endpoint.mode]}
        </span>
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-background-muted/60 border border-border-muted text-foreground-muted font-mono">
          <Cpu className="size-2.5" />
          {endpoint.provider}
        </span>
        <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-background-muted/60 border border-border-muted text-foreground-muted font-mono">
          {endpoint.region}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 text-[11px]">
        <Stat label="Latency p95" value={`${endpoint.latencyMsP95}ms`} />
        <Stat
          label="Cost / 1k"
          value={`$${endpoint.costPer1kTokensUSD.toFixed(4)}`}
        />
        <Stat label="Errors 24h" value={(endpoint.errorsLast24h ?? 0).toString()} />
      </div>

      <div className="mt-auto pt-2 border-t border-border-muted">
        <div className="text-[10px] uppercase tracking-wide text-foreground-meta font-medium mb-1.5">
          Assigned to
        </div>
        <div className="flex items-center flex-wrap gap-1">
          {endpoint.purposesAssigned.length === 0 ? (
            <span className="text-[11px] text-foreground-subtle italic">
              Not assigned to any purpose
            </span>
          ) : (
            endpoint.purposesAssigned.map((p) => (
              <span
                key={p}
                className="inline-flex items-center text-[10px] px-1.5 py-0.5 rounded bg-background-elevated border border-border-muted text-foreground-muted"
              >
                {purposeMeta[p].label}
              </span>
            ))
          )}
        </div>
      </div>
    </button>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wide text-foreground-meta">{label}</div>
      <div className="text-xs font-semibold tabular-nums mt-0.5 font-mono">{value}</div>
    </div>
  );
}
