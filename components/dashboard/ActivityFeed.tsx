'use client';

import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Sparkles,
  ShieldAlert,
  ListChecks,
  GitPullRequestArrow,
  FileText,
  Rocket,
  Bot,
  Inbox,
  type LucideIcon,
} from 'lucide-react';
import { activity, projectAppMap, type EventKind, type ActivitySeverity } from '@/lib/mock-data';
import { useActiveProjectId } from '@/lib/persona';
import { cn } from '@/lib/utils';

const iconForKind: Record<EventKind, LucideIcon> = {
  conversation_completed: CheckCircle2,
  conversation_failed: XCircle,
  conversation_escalated: AlertTriangle,
  task_created: ListChecks,
  task_completed: ListChecks,
  guardrail_triggered: ShieldAlert,
  evaluation_run: GitPullRequestArrow,
  sop_uploaded: FileText,
  helper_action: Sparkles,
  approval_event: Inbox,
  deployment_event: Rocket,
};

const severityClass: Record<ActivitySeverity, string> = {
  success: 'text-success',
  warning: 'text-warning',
  error: 'text-error',
  info: 'text-info',
  purple: 'text-purple',
};

export function ActivityFeed() {
  const activeProjectId = useActiveProjectId();
  const filtered = activity.filter((a) => projectAppMap[a.appId] === activeProjectId);

  return (
    <section className="rounded-lg border border-border-muted bg-background-subtle overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border-muted">
        <div>
          <h2 className="text-sm font-semibold">Recent activity</h2>
          <p className="text-xs text-foreground-muted mt-0.5">
            {filtered.length === 0
              ? 'No recent events in this project'
              : `${filtered.length} recent events in this project`}
          </p>
        </div>
        <button
          type="button"
          className="text-xs text-foreground-muted hover:text-foreground transition-colors"
        >
          Open audit →
        </button>
      </div>

      <div className="divide-y divide-border-muted">
        {filtered.length === 0 && (
          <p className="px-4 py-8 text-xs text-foreground-muted text-center">
            Switch to a project with deployed apps to see recent activity.
          </p>
        )}
        {filtered.map((a) => {
          const Icon = iconForKind[a.kind] ?? Bot;
          return (
            <div
              key={a.id}
              className="px-4 py-2.5 grid grid-cols-[auto_1fr_auto] items-start gap-3 hover:bg-background-muted/40 transition-colors"
            >
              <Icon className={cn('size-3.5 shrink-0 mt-0.5', severityClass[a.severity])} />
              <div className="min-w-0">
                <div className="text-xs text-foreground leading-snug">{a.summary}</div>
                <div className="text-[11px] text-foreground-subtle mt-0.5">
                  <span className="font-mono text-foreground-muted">{a.appName}</span>
                  {a.detail && (
                    <>
                      {' · '}
                      <span className="text-foreground-subtle">{a.detail}</span>
                    </>
                  )}
                </div>
              </div>
              <span className="text-foreground-subtle text-[11px] whitespace-nowrap">
                {a.ago}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
