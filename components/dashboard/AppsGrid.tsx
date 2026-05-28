'use client';

import Link from 'next/link';
import {
  Bot,
  ArrowUpRight,
  MessageSquare,
  Phone,
  Mail,
  Smartphone,
  TrendingUp,
  TrendingDown,
  Minus,
  type LucideIcon,
} from 'lucide-react';
import { apps, projectAppMap, type AppStatus, type Channel, type App } from '@/lib/mock-data';
import { useActiveProjectId } from '@/lib/persona';
import { cn } from '@/lib/utils';

const statusStyle: Record<AppStatus, { dot: string; label: string; pillBg: string; pillText: string }> = {
  draft: {
    dot: 'bg-foreground-subtle',
    label: 'Draft',
    pillBg: 'bg-background-elevated',
    pillText: 'text-foreground-muted',
  },
  in_review: {
    dot: 'bg-info',
    label: 'In Review',
    pillBg: 'bg-info-subtle',
    pillText: 'text-info',
  },
  changes_requested: {
    dot: 'bg-warning',
    label: 'Changes Requested',
    pillBg: 'bg-warning-subtle',
    pillText: 'text-warning',
  },
  approved: {
    dot: 'bg-success',
    label: 'Approved',
    pillBg: 'bg-success-subtle',
    pillText: 'text-success',
  },
  deployed: {
    dot: 'bg-success',
    label: 'Deployed',
    pillBg: 'bg-success-subtle',
    pillText: 'text-success',
  },
  paused: {
    dot: 'bg-warning',
    label: 'Paused',
    pillBg: 'bg-warning-subtle',
    pillText: 'text-warning',
  },
};

const channelIcon: Record<Channel, LucideIcon> = {
  digital: MessageSquare,
  voice: Phone,
  sms: Smartphone,
  email: Mail,
};

const trendIcon = {
  up: TrendingUp,
  flat: Minus,
  down: TrendingDown,
};

const trendClass = {
  up: 'text-success',
  flat: 'text-foreground-meta',
  down: 'text-error',
};

function scoreClass(score: number): string {
  if (score >= 90) return 'bg-success-subtle text-success';
  if (score >= 75) return 'bg-warning-subtle text-warning';
  return 'bg-error-subtle text-error';
}

export function AppsGrid() {
  const activeProjectId = useActiveProjectId();
  const projectApps = apps.filter((a) => projectAppMap[a.id] === activeProjectId);

  return (
    <section>
      <div className="flex items-end justify-between mb-3">
        <div>
          <h2 className="text-sm font-semibold">Apps in this project</h2>
          <p className="text-xs text-foreground-muted mt-0.5">
            {projectApps.length} apps · {apps.length} across the workspace
          </p>
        </div>
        <Link
          href="/apps"
          className="text-xs text-foreground-muted hover:text-foreground transition-colors flex items-center gap-1"
        >
          View all
          <ArrowUpRight className="size-3" />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {projectApps.length === 0 && (
          <p className="col-span-full text-xs text-foreground-muted text-center py-8 border border-dashed border-border-muted rounded-lg">
            No apps in this project yet. Upload an SOP to generate one.
          </p>
        )}
        {projectApps.map((a) => (
          <AppCard key={a.id} app={a} />
        ))}
      </div>
    </section>
  );
}

function AppCard({ app }: { app: App }) {
  const s = statusStyle[app.status];
  const Trend = trendIcon[app.evaluationTrend];

  return (
    <Link
      href={`/apps/${app.id}`}
      className="group rounded-lg border border-border-muted bg-background-subtle hover:border-border hover:bg-background-muted/50 transition-colors p-4 flex flex-col"
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="size-6 rounded-md bg-background-elevated border border-border-muted flex items-center justify-center shrink-0">
            <Bot className="size-3.5 text-foreground-muted group-hover:text-foreground transition-colors" />
          </div>
          <span className="text-sm font-medium font-mono truncate">{app.name}</span>
        </div>
        <span
          className={cn(
            'shrink-0 inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded uppercase tracking-wide font-medium',
            s.pillBg,
            s.pillText,
          )}
        >
          <span className={cn('size-1.5 rounded-full', s.dot)} />
          {s.label}
        </span>
      </div>

      <p className="text-xs text-foreground-muted leading-relaxed line-clamp-2 mb-3 min-h-[2.2rem]">
        {app.description}
      </p>

      <div className="text-[11px] text-foreground-subtle font-mono mb-3 truncate">
        from <span className="text-foreground-meta">{app.sopFilename}</span>
      </div>

      <div className="grid grid-cols-3 gap-2 pt-3 border-t border-border-muted">
        <Stat label="Score">
          <span className={cn('inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium tabular-nums', scoreClass(app.evaluationScore))}>
            {app.evaluationScore}
            <Trend className={cn('size-3', trendClass[app.evaluationTrend])} />
          </span>
        </Stat>
        <Stat label="Conv · 24h">
          <span className="text-xs font-medium tabular-nums">
            {app.conversations24h.toLocaleString()}
          </span>
        </Stat>
        <Stat label="Channels">
          <span className="flex items-center gap-1">
            {app.channels.map((c) => {
              const Icon = channelIcon[c];
              return (
                <Icon
                  key={c}
                  className="size-3 text-foreground-muted"
                  aria-label={c}
                />
              );
            })}
          </span>
        </Stat>
      </div>

      <div className="mt-3 flex items-center justify-between text-[11px] text-foreground-subtle">
        <span>Last evaluated {app.lastEvaluatedAt}</span>
        <span className="size-4 inline-flex items-center justify-center rounded-full bg-accent-subtle text-[9px] text-foreground-muted">
          {app.ownerInitials}
        </span>
      </div>
    </Link>
  );
}

function Stat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wide text-foreground-meta">{label}</div>
      <div className="mt-0.5">{children}</div>
    </div>
  );
}
