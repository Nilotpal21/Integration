'use client';

import Link from 'next/link';
import {
  Bot,
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
  Minus,
  MessageSquare,
  Phone,
  Mail,
  Smartphone,
  type LucideIcon,
} from 'lucide-react';
import {
  apps,
  projectAppMap,
  getProjectById,
  type AppStatus,
  type Channel,
} from '@/lib/mock-data';
import { useActiveProjectId } from '@/lib/persona';
import { Footer } from '@/components/shell/Footer';
import { cn } from '@/lib/utils';

const channelIcon: Record<Channel, LucideIcon> = {
  digital: MessageSquare,
  voice: Phone,
  sms: Smartphone,
  email: Mail,
};

const statusStyle: Record<AppStatus, { dot: string; label: string; bg: string; text: string }> = {
  draft: { dot: 'bg-foreground-subtle', label: 'Draft', bg: 'bg-background-elevated', text: 'text-foreground-muted' },
  in_review: { dot: 'bg-info', label: 'In review', bg: 'bg-info-subtle', text: 'text-info' },
  changes_requested: { dot: 'bg-warning', label: 'Changes requested', bg: 'bg-warning-subtle', text: 'text-warning' },
  approved: { dot: 'bg-success', label: 'Approved', bg: 'bg-success-subtle', text: 'text-success' },
  deployed: { dot: 'bg-success', label: 'Deployed', bg: 'bg-success-subtle', text: 'text-success' },
  paused: { dot: 'bg-warning', label: 'Paused', bg: 'bg-warning-subtle', text: 'text-warning' },
};

export default function AppsPage() {
  const activeProjectId = useActiveProjectId();
  const project = getProjectById(activeProjectId);
  const projectApps = apps.filter((a) => projectAppMap[a.id] === activeProjectId);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold tracking-tight">Apps</h1>
        <p className="text-xs text-foreground-muted mt-1">
          {projectApps.length} apps in {project?.name ?? 'this project'} · open any app to review,
          edit, and submit for approval.
        </p>
      </header>

      <div className="rounded-lg border border-border-muted bg-background-subtle overflow-hidden">
        <div className="grid grid-cols-[2fr_1fr_1fr_1fr_auto] items-center gap-4 px-4 py-2.5 border-b border-border-muted text-[10px] uppercase tracking-wide text-foreground-meta font-medium">
          <div>App</div>
          <div>Status</div>
          <div className="text-right">Score</div>
          <div>Channels</div>
          <div className="text-right">Last eval</div>
        </div>

        {projectApps.length === 0 && (
          <p className="px-4 py-12 text-xs text-foreground-muted text-center">
            No apps in this project yet. Upload an SOP to generate one.
          </p>
        )}

        {projectApps.map((a) => {
          const s = statusStyle[a.status];
          const TrendIco =
            a.evaluationTrend === 'up' ? TrendingUp : a.evaluationTrend === 'down' ? TrendingDown : Minus;
          const trendCls =
            a.evaluationTrend === 'up'
              ? 'text-success'
              : a.evaluationTrend === 'down'
                ? 'text-error'
                : 'text-foreground-meta';

          const scoreCls =
            a.evaluationScore >= 90
              ? 'bg-success-subtle text-success'
              : a.evaluationScore >= 75
                ? 'bg-warning-subtle text-warning'
                : 'bg-error-subtle text-error';

          return (
            <Link
              key={a.id}
              href={`/apps/${a.id}`}
              className="grid grid-cols-[2fr_1fr_1fr_1fr_auto] items-center gap-4 px-4 py-3 border-b last:border-b-0 border-border-muted hover:bg-background-muted/40 transition-colors group"
            >
              <div className="flex items-start gap-2.5 min-w-0">
                <div className="size-7 rounded-md bg-background-elevated border border-border-muted flex items-center justify-center shrink-0">
                  <Bot className="size-3.5 text-foreground-muted group-hover:text-foreground transition-colors" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-mono truncate">{a.name}</div>
                  <div className="text-[11px] text-foreground-subtle truncate mt-0.5">
                    {a.description}
                  </div>
                </div>
              </div>

              <div>
                <span
                  className={cn(
                    'inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded uppercase tracking-wide font-medium',
                    s.bg,
                    s.text,
                  )}
                >
                  <span className={cn('size-1.5 rounded-full', s.dot)} />
                  {s.label}
                </span>
              </div>

              <div className="text-right">
                <span
                  className={cn(
                    'inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium tabular-nums',
                    scoreCls,
                  )}
                >
                  {a.evaluationScore}
                  <TrendIco className={cn('size-3', trendCls)} />
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                {a.channels.map((c) => {
                  const Icon = channelIcon[c];
                  return <Icon key={c} className="size-3.5 text-foreground-muted" aria-label={c} />;
                })}
              </div>

              <div className="text-[11px] text-foreground-subtle whitespace-nowrap text-right flex items-center justify-end gap-2">
                {a.lastEvaluatedAt}
                <ArrowUpRight className="size-3 text-foreground-subtle group-hover:text-foreground-muted transition-colors" />
              </div>
            </Link>
          );
        })}
      </div>

      <Footer />
    </div>
  );
}
