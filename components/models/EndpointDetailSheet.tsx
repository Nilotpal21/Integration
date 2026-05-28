'use client';

import { type ReactNode } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, RefreshCw, AlertTriangle, Check, CircleSlash, KeyRound } from 'lucide-react';
import { toast } from 'sonner';
import {
  allCapabilities,
  apps,
  purposeMeta,
  purposeOrder,
  endpointSupports,
  getEndpointById,
  type ModelEndpoint,
} from '@/lib/mock-data';
import { cn } from '@/lib/utils';

export function EndpointDetailSheet({
  endpoint,
  open,
  onOpenChange,
}: {
  endpoint: ModelEndpoint | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!endpoint) return null;

  const requiredCapabilities = ['tool_use', 'json_mode'] as const;
  const missingForApps = apps.filter((a) => {
    if (!endpoint.purposesAssigned.includes('response_generation')) return false;
    return requiredCapabilities.some((c) => !endpoint.capabilities.includes(c));
  });

  const fallback = endpoint.fallbackEndpointId
    ? getEndpointById(endpoint.fallbackEndpointId)
    : null;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-background/40 backdrop-blur-[2px] animate-fade-in" />
        <Dialog.Content className="fixed top-0 right-0 z-50 h-screen w-[600px] max-w-[100vw] bg-background-elevated border-l border-border shadow-2xl flex flex-col animate-fade-in">
          <header className="flex items-start justify-between gap-2 px-5 py-4 border-b border-border-muted shrink-0">
            <div className="min-w-0">
              <Dialog.Title className="text-base font-semibold tracking-tight truncate">
                {endpoint.name}
              </Dialog.Title>
              <p className="text-[11px] text-foreground-muted font-mono truncate">
                {endpoint.provider} · {endpoint.modelIdentifier} · {endpoint.region}
              </p>
            </div>
            <Dialog.Close asChild>
              <button
                type="button"
                className="size-7 rounded-md text-foreground-muted hover:text-foreground hover:bg-background-muted transition-colors flex items-center justify-center"
                aria-label="Close"
              >
                <X className="size-4" />
              </button>
            </Dialog.Close>
          </header>

          <div className="flex-1 overflow-y-auto scrollbar-thin px-5 py-4 space-y-5">
            {missingForApps.length > 0 && (
              <div className="rounded-md border border-warning/30 bg-warning-subtle/40 p-3">
                <div className="flex items-start gap-2 text-xs">
                  <AlertTriangle className="size-3.5 text-warning shrink-0 mt-0.5" />
                  <div>
                    <div className="font-medium text-foreground">Capability mismatch</div>
                    <div className="text-foreground-muted mt-0.5">
                      {missingForApps.length} app(s) using this endpoint require capabilities
                      it doesn&apos;t advertise. Either disable those capabilities upstream or
                      assign a capable endpoint.
                    </div>
                  </div>
                </div>
              </div>
            )}

            <Panel title="Identity">
              <dl className="space-y-2 text-xs">
                <Row label="Name">
                  <input
                    defaultValue={endpoint.name}
                    className="w-full bg-background-muted/60 border border-border-muted rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-border-focus/40"
                  />
                </Row>
                <Row label="Mode">
                  {endpoint.mode.replace(/_/g, ' ')}
                </Row>
                <Row label="Provider">{endpoint.provider}</Row>
                <Row label="Region">{endpoint.region}</Row>
                <Row label="Model identifier">
                  <span className="font-mono">{endpoint.modelIdentifier}</span>
                </Row>
                {endpoint.vaultCredentialRef && (
                  <Row label="Credential ref">
                    <div className="flex items-center gap-2 min-w-0">
                      <KeyRound className="size-3 text-foreground-muted shrink-0" />
                      <span className="font-mono text-foreground-muted truncate">
                        vault://{endpoint.vaultCredentialRef}
                      </span>
                      <button
                        type="button"
                        onClick={() => toast.success('Rotation request queued')}
                        className="ml-auto h-6 px-2 rounded text-[11px] font-medium border border-border-muted text-foreground-muted hover:text-foreground hover:bg-background-elevated transition-colors shrink-0"
                      >
                        Rotate
                      </button>
                    </div>
                  </Row>
                )}
                {endpoint.customUrl && (
                  <Row label="Custom URL">
                    <span className="font-mono text-foreground-muted break-all">
                      {endpoint.customUrl}
                    </span>
                  </Row>
                )}
              </dl>
            </Panel>

            <Panel title="Capability matrix">
              <ul className="grid grid-cols-2 gap-1.5">
                {allCapabilities.map((c) => {
                  const supports = endpointSupports(endpoint, c.id);
                  return (
                    <li
                      key={c.id}
                      className="flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-background-muted/40 border border-border-muted text-xs"
                    >
                      {supports ? (
                        <Check className="size-3.5 text-success shrink-0" />
                      ) : (
                        <CircleSlash className="size-3.5 text-foreground-subtle shrink-0" />
                      )}
                      <span className={cn(supports ? 'text-foreground' : 'text-foreground-subtle')}>
                        {c.label}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </Panel>

            <Panel title="Purposes assigned">
              <div className="flex flex-wrap gap-1.5">
                {purposeOrder.map((p) => {
                  const active = endpoint.purposesAssigned.includes(p);
                  return (
                    <span
                      key={p}
                      className={cn(
                        'inline-flex items-center text-[11px] px-2 py-1 rounded border font-medium',
                        active
                          ? 'bg-background-elevated border-border text-foreground'
                          : 'bg-background-muted/40 border-border-muted text-foreground-subtle',
                      )}
                    >
                      {purposeMeta[p].label}
                    </span>
                  );
                })}
              </div>
            </Panel>

            <Panel title="Data residency &amp; compliance">
              <dl className="space-y-1.5 text-xs">
                <Row label="Region declared">{endpoint.region}</Row>
                <Row label="Inference">
                  Shall not occur outside <span className="font-mono">{endpoint.region}</span>.
                </Row>
                {endpoint.baaInheritsFrom && (
                  <Row label="BAA / DPA">
                    Inherits from <span className="font-mono">{endpoint.baaInheritsFrom}</span>.
                  </Row>
                )}
                <Row label="Cost attribution">
                  Billed by the customer&apos;s provider account. Platform fees decouple from
                  token volume.
                </Row>
              </dl>
            </Panel>

            <Panel title="Fallback">
              {fallback ? (
                <div className="rounded-md bg-background-muted/40 border border-border-muted p-3 text-xs">
                  <div className="text-foreground-muted">If this endpoint is unavailable:</div>
                  <div className="mt-1 font-mono text-foreground">{fallback.name}</div>
                  <div className="text-[11px] text-foreground-subtle mt-1">
                    Fallback events are audited.
                  </div>
                </div>
              ) : (
                <p className="text-xs text-foreground-muted">
                  No fallback configured. Configure one in Endpoint settings to avoid hard-fails
                  on outage.
                </p>
              )}
            </Panel>

            <Panel title="Performance · last 24h">
              <div className="grid grid-cols-3 gap-2">
                <PerfStat label="Latency p95" value={`${endpoint.latencyMsP95}ms`} />
                <PerfStat
                  label="Cost / 1k tokens"
                  value={`$${endpoint.costPer1kTokensUSD.toFixed(4)}`}
                />
                <PerfStat label="Errors" value={(endpoint.errorsLast24h ?? 0).toString()} />
              </div>
              <p className="text-[11px] text-foreground-subtle mt-2">
                Last health-check {endpoint.lastHealthcheckAgo}.
              </p>
            </Panel>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => toast.success(`Test connection to ${endpoint.name} succeeded`)}
                className="h-9 px-3 rounded-md text-xs font-medium border border-border-muted text-foreground-muted hover:text-foreground hover:bg-background-elevated transition-colors flex items-center gap-1.5"
              >
                <RefreshCw className="size-3.5" />
                Test connection
              </button>
              {!endpoint.isPlatformDefault && (
                <button
                  type="button"
                  onClick={() => toast.success(`${endpoint.name} disabled`)}
                  className="h-9 px-3 rounded-md text-xs font-medium text-foreground-muted hover:text-foreground hover:bg-background-elevated transition-colors"
                >
                  Disable
                </button>
              )}
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-md border border-border-muted bg-background-subtle p-3">
      <div className="text-[10px] uppercase tracking-wide text-foreground-meta font-medium mb-2">
        {title}
      </div>
      {children}
    </section>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[140px_1fr] gap-3 items-start">
      <dt className="text-[10px] uppercase tracking-wide text-foreground-meta font-medium pt-1">
        {label}
      </dt>
      <dd className="text-foreground text-xs min-w-0">{children}</dd>
    </div>
  );
}

function PerfStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-background-muted/40 border border-border-muted p-2">
      <div className="text-[10px] uppercase tracking-wide text-foreground-meta">{label}</div>
      <div className="text-sm font-semibold tabular-nums mt-0.5 font-mono">{value}</div>
    </div>
  );
}
