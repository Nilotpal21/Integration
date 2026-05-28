'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { CheckCircle2, MessagesSquare, Rocket } from 'lucide-react';
import { toast } from 'sonner';
import { useAppState, useEffectiveApp } from '@/lib/app-state';
import { cn } from '@/lib/utils';
import { SubmitForApprovalButton } from './SubmitForApprovalButton';

interface Props {
  appId: string;
  appName: string;
  sopFilename: string;
  evaluationScore: number;
  approvalsRequired: number;
  guardrailsCount: number;
  knowledgeCount: number;
  blockers: number;
  warnings: number;
}

const STATUS_STYLE: Record<
  string,
  { bg: string; text: string; dot: string; label: string }
> = {
  draft: {
    bg: 'bg-background-elevated',
    text: 'text-foreground-muted',
    dot: 'bg-foreground-subtle',
    label: 'Draft',
  },
  in_review: {
    bg: 'bg-info-subtle',
    text: 'text-info',
    dot: 'bg-info',
    label: 'In review',
  },
  changes_requested: {
    bg: 'bg-warning-subtle',
    text: 'text-warning',
    dot: 'bg-warning',
    label: 'Changes requested',
  },
  approved: {
    bg: 'bg-success-subtle',
    text: 'text-success',
    dot: 'bg-success',
    label: 'Approved',
  },
  deployed: {
    bg: 'bg-success-subtle',
    text: 'text-success',
    dot: 'bg-success',
    label: 'Deployed',
  },
  paused: {
    bg: 'bg-warning-subtle',
    text: 'text-warning',
    dot: 'bg-warning',
    label: 'Paused',
  },
};

export function AppStatusBadge({ appId, fallback }: { appId: string; fallback: string }) {
  const eff = useEffectiveApp(appId);
  const status = eff?.status ?? fallback;
  const s = STATUS_STYLE[status] ?? STATUS_STYLE.draft;
  return (
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
  );
}

export function AppVersionTag({ appId, fallbackVersion }: { appId: string; fallbackVersion: number }) {
  const eff = useEffectiveApp(appId);
  const v = (eff?.deployedVersion ?? fallbackVersion) + (eff?.status === 'deployed' ? 0 : 1);
  return (
    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-background-elevated text-foreground-muted">
      v{v}
    </span>
  );
}

export function AppHeaderActions({
  appId,
  appName,
  sopFilename,
  evaluationScore,
  approvalsRequired,
  guardrailsCount,
  knowledgeCount,
  blockers,
  warnings,
}: Props) {
  const router = useRouter();
  const eff = useEffectiveApp(appId);
  const deploy = useAppState((s) => s.deploy);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Until the persist hydration completes, render the SSR-safe default (Submit).
  const status = mounted ? eff?.status ?? 'draft' : 'draft';
  const canSubmit = blockers === 0;

  const handleDeploy = () => {
    deploy(appId);
    toast.success(`Deployed · ${appName} is live`);
    setTimeout(() => router.refresh(), 300);
  };

  return (
    <div className="flex items-center gap-2 shrink-0">
      <Link
        href={`/apps/${appId}/chat`}
        className="h-8 px-3 rounded-md text-xs font-medium border border-border-muted text-foreground-muted hover:text-foreground hover:bg-background-elevated transition-colors flex items-center gap-1.5"
      >
        <MessagesSquare className="size-3.5" />
        Chat
      </Link>

      {status === 'approved' && (
        <button
          type="button"
          onClick={handleDeploy}
          className="h-8 px-3.5 rounded-md text-xs font-medium bg-success text-success-foreground hover:bg-success/85 transition-colors flex items-center gap-1.5"
        >
          <Rocket className="size-3.5" />
          Deploy
        </button>
      )}

      {status === 'deployed' && (
        <span className="h-8 px-3 rounded-md text-xs font-medium bg-success-subtle text-success border border-success/30 flex items-center gap-1.5">
          <CheckCircle2 className="size-3.5" />
          Deployed
        </span>
      )}

      {status === 'in_review' && (
        <span className="h-8 px-3 rounded-md text-xs font-medium bg-info-subtle text-info border border-info/30 flex items-center gap-1.5">
          In review
        </span>
      )}

      {(status === 'draft' || status === 'changes_requested') && (
        <SubmitForApprovalButton
          appName={appName}
          appId={appId}
          sopReason={`Submission for ${sopFilename}, evaluation score ${evaluationScore}.`}
          guardrailsCount={guardrailsCount}
          knowledgeCount={knowledgeCount}
          blockers={blockers}
          warnings={warnings}
          evaluationScore={evaluationScore}
          approvalsRequired={approvalsRequired}
          canSubmit={canSubmit}
        />
      )}
    </div>
  );
}
