'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Bot, Sparkles, AlertOctagon, AlertTriangle, Inbox } from 'lucide-react';
import {
  submissions,
  decidedSubmissions,
  reviewerStats,
  personas,
  type Submission,
  type SubmissionStatus,
} from '@/lib/mock-data';
import { Footer } from '@/components/shell/Footer';
import { cn } from '@/lib/utils';

type Filter = 'all' | 'pending_me' | 'pending_co' | 'decided';

const statusStyle: Record<SubmissionStatus, { bg: string; text: string; dot: string; label: string }> = {
  pending_you: { bg: 'bg-info-subtle', text: 'text-info', dot: 'bg-info', label: 'Pending you' },
  pending_co_reviewer: {
    bg: 'bg-warning-subtle',
    text: 'text-warning',
    dot: 'bg-warning',
    label: 'Pending co-reviewer',
  },
  awaiting_both: { bg: 'bg-info-subtle', text: 'text-info', dot: 'bg-info', label: 'Awaiting both' },
  approved: { bg: 'bg-success-subtle', text: 'text-success', dot: 'bg-success', label: 'Approved' },
  changes_requested: {
    bg: 'bg-warning-subtle',
    text: 'text-warning',
    dot: 'bg-warning',
    label: 'Changes requested',
  },
  rejected: { bg: 'bg-error-subtle', text: 'text-error', dot: 'bg-error', label: 'Rejected' },
};

export default function QueuePage() {
  const [filter, setFilter] = useState<Filter>('all');

  const filtered = (() => {
    if (filter === 'all') return submissions;
    if (filter === 'pending_me') return submissions.filter((s) => s.status === 'pending_you');
    if (filter === 'pending_co')
      return submissions.filter((s) => s.status === 'pending_co_reviewer');
    return decidedSubmissions;
  })();

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Review queue</h1>
          <p className="text-xs text-foreground-muted mt-1">
            {submissions.length} apps awaiting your review · 1 has dual-approval pending your
            co-reviewer
          </p>
        </div>
        <div className="flex items-center gap-1 p-0.5 rounded-md bg-background-muted/60">
          {(
            [
              ['all', 'All'],
              ['pending_me', 'Pending me'],
              ['pending_co', 'Pending co-reviewer'],
              ['decided', 'Decided'],
            ] as const
          ).map(([k, label]) => (
            <button
              key={k}
              type="button"
              onClick={() => setFilter(k)}
              className={cn(
                'px-2.5 py-1 rounded text-[11px] font-medium transition-colors',
                filter === k
                  ? 'bg-background-elevated text-foreground'
                  : 'text-foreground-muted hover:text-foreground',
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
        <section className="rounded-lg border border-border-muted bg-background-subtle overflow-hidden">
          <div className="grid grid-cols-[1.5fr_1.4fr_0.8fr_0.6fr_0.6fr_1fr] items-center gap-3 px-4 py-2.5 border-b border-border-muted text-[10px] uppercase tracking-wide text-foreground-meta font-medium">
            <div>App</div>
            <div>Submitted</div>
            <div className="text-right">Eval</div>
            <div className="text-center">Flags</div>
            <div className="text-center">Helper</div>
            <div>Status</div>
          </div>

          {filtered.length === 0 && (
            <div className="px-4 py-12 text-center">
              <Inbox className="size-6 text-foreground-subtle mx-auto mb-2" />
              <p className="text-xs text-foreground-muted">Nothing to review right now.</p>
            </div>
          )}

          {filtered.map((s) => (
            <SubmissionRow key={s.appId} submission={s} />
          ))}
        </section>

        <aside className="space-y-3">
          <div className="rounded-lg border border-border-muted bg-background-subtle p-4">
            <div className="text-[10px] uppercase tracking-wide text-foreground-meta font-medium mb-3">
              Your decisions this month
            </div>
            <div className="space-y-2">
              <Stat label="Reviewed" value={reviewerStats.reviewedThisMonth} />
              <Stat label="Approved" value={reviewerStats.approved} tone="success" />
              <Stat label="Changes requested" value={reviewerStats.changesRequested} tone="warning" />
              <Stat label="Rejected" value={reviewerStats.rejected} tone="error" />
              <div className="pt-2 border-t border-border-muted">
                <Stat label="Avg time to decision" value={reviewerStats.avgTimeToDecision} mono />
              </div>
            </div>
          </div>
        </aside>
      </div>

      <Footer />
    </div>
  );
}

function SubmissionRow({ submission: s }: { submission: Submission }) {
  const style = statusStyle[s.status];
  const submitter = personas[s.submittedByPersonaId === 'u_np' ? 'processOwner' : 'admin'];
  const scoreCls =
    s.evaluationScore >= 90
      ? 'bg-success-subtle text-success'
      : s.evaluationScore >= 75
        ? 'bg-warning-subtle text-warning'
        : 'bg-error-subtle text-error';
  const blockerColor = s.blockerFlags > 0 ? 'text-error' : 'text-foreground-subtle';
  const warningColor = s.warningFlags > 0 ? 'text-warning' : 'text-foreground-subtle';

  return (
    <Link
      href={`/queue/${s.appId}`}
      className="grid grid-cols-[1.5fr_1.4fr_0.8fr_0.6fr_0.6fr_1fr] items-center gap-3 px-4 py-3 border-b last:border-b-0 border-border-muted hover:bg-background-muted/40 transition-colors"
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="size-7 rounded-md bg-background-elevated border border-border-muted flex items-center justify-center shrink-0">
          <Bot className="size-3.5 text-foreground-muted" />
        </div>
        <div className="min-w-0">
          <div className="text-sm font-mono truncate">{s.appName}</div>
          <div className="text-[11px] text-foreground-subtle font-mono">v{s.appVersion}</div>
        </div>
      </div>

      <div className="flex items-center gap-2 min-w-0 text-xs">
        <span className="size-5 rounded-full bg-purple/20 text-purple text-[10px] font-medium flex items-center justify-center shrink-0">
          {submitter.initials}
        </span>
        <span className="text-foreground-muted truncate">{submitter.name}</span>
        <span className="text-foreground-subtle whitespace-nowrap">· {s.submittedAgo}</span>
      </div>

      <div className="flex justify-end">
        <span className={cn('inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium tabular-nums', scoreCls)}>
          {s.evaluationScore}
        </span>
      </div>

      <div className="flex items-center justify-center gap-1.5 text-[11px] font-mono tabular-nums">
        <span className={cn('inline-flex items-center gap-0.5', blockerColor)}>
          <AlertOctagon className="size-3" />
          {s.blockerFlags}
        </span>
        <span className={cn('inline-flex items-center gap-0.5', warningColor)}>
          <AlertTriangle className="size-3" />
          {s.warningFlags}
        </span>
      </div>

      <div className="flex items-center justify-center gap-1 text-[11px] font-mono text-foreground-muted tabular-nums">
        <Sparkles className="size-3 text-purple" />
        {s.helperEditsCount}
      </div>

      <div>
        <span
          className={cn(
            'inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded uppercase tracking-wide font-medium whitespace-nowrap',
            style.bg,
            style.text,
          )}
        >
          <span className={cn('size-1.5 rounded-full', style.dot)} />
          {style.label}
        </span>
      </div>
    </Link>
  );
}

function Stat({
  label,
  value,
  tone = 'neutral',
  mono = false,
}: {
  label: string;
  value: string | number;
  tone?: 'neutral' | 'success' | 'warning' | 'error';
  mono?: boolean;
}) {
  const tones = {
    neutral: 'text-foreground',
    success: 'text-success',
    warning: 'text-warning',
    error: 'text-error',
  };
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-foreground-muted">{label}</span>
      <span className={cn('font-medium tabular-nums', tones[tone], mono && 'font-mono text-[11px]')}>
        {value}
      </span>
    </div>
  );
}
