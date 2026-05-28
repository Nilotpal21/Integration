'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import * as Dialog from '@radix-ui/react-dialog';
import { Send, CheckCircle2, AlertTriangle, AlertOctagon, X } from 'lucide-react';
import { toast } from 'sonner';
import { personas } from '@/lib/mock-data';
import { useAppState } from '@/lib/app-state';
import { cn } from '@/lib/utils';

interface Props {
  appName: string;
  appId: string;
  sopReason: string;
  guardrailsCount: number;
  knowledgeCount: number;
  blockers: number;
  warnings: number;
  evaluationScore: number;
  approvalsRequired: number;
  canSubmit: boolean;
}

export function SubmitForApprovalButton({
  appName,
  appId,
  sopReason,
  guardrailsCount,
  knowledgeCount,
  blockers,
  warnings,
  evaluationScore,
  approvalsRequired,
  canSubmit,
}: Props) {
  const router = useRouter();
  const submitForApproval = useAppState((s) => s.submitForApproval);
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState('');

  const handleConfirm = () => {
    submitForApproval(appId);
    setOpen(false);
    toast.success(`Submitted to compliance review · ${approvalsRequired} reviewers notified`);
    setTimeout(() => router.push(`/queue/${appId}?from=submit`), 400);
  };

  if (!canSubmit) {
    return (
      <span
        title={`Resolve ${blockers} Blocker${blockers > 1 ? 's' : ''} before submitting.`}
        className="h-8 px-3.5 rounded-md text-xs font-medium bg-background-elevated text-foreground-subtle cursor-not-allowed flex items-center gap-1.5"
      >
        <Send className="size-3.5" />
        Submit for approval
      </span>
    );
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          type="button"
          className="h-8 px-3.5 rounded-md text-xs font-medium bg-accent text-accent-foreground hover:bg-accent-muted transition-colors flex items-center gap-1.5"
        >
          <Send className="size-3.5" />
          Submit for approval
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-background/40 backdrop-blur-[2px] animate-fade-in" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[520px] max-w-[100vw] rounded-2xl border border-border bg-background-elevated shadow-2xl p-6 animate-fade-in">
          <div className="flex items-start justify-between mb-4">
            <div className="min-w-0">
              <Dialog.Title className="text-base font-semibold tracking-tight">
                Submit <span className="font-mono">{appName}</span> for approval
              </Dialog.Title>
              <Dialog.Description className="text-xs text-foreground-muted mt-1">
                {sopReason}
              </Dialog.Description>
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
          </div>

          <div className="rounded-md border border-border-muted bg-background-muted/40 p-3 mb-3 space-y-1.5">
            <PreFlightItem ok>{guardrailsCount} baseline guardrails active</PreFlightItem>
            <PreFlightItem ok>{knowledgeCount} knowledge sources attached</PreFlightItem>
            <PreFlightItem ok={blockers === 0} bad={blockers > 0}>
              {blockers === 0 ? '0 Blocker flags' : `${blockers} Blocker flag${blockers > 1 ? 's' : ''} unresolved`}
            </PreFlightItem>
            <PreFlightItem warn={warnings > 0} ok={warnings === 0}>
              {warnings === 0
                ? '0 Warning flags unacknowledged'
                : `${warnings} Warning flag${warnings > 1 ? 's' : ''} unacknowledged`}
            </PreFlightItem>
            <PreFlightItem ok>Evaluation Score: {evaluationScore} (above baseline of 80)</PreFlightItem>
          </div>

          <div className="mb-3">
            <div className="text-[10px] uppercase tracking-wide text-foreground-meta font-medium mb-2">
              Required reviewers
            </div>
            <div className="flex flex-wrap gap-2">
              <ReviewerChip name={personas.reviewer.name} initials={personas.reviewer.initials} />
              <ReviewerChip name="Marco Davis" initials="MD" />
            </div>
            <p className="text-[11px] text-foreground-subtle mt-2">
              Dual approval is required because this app touches regulated workflows.
            </p>
          </div>

          <div className="mb-4">
            <label className="block text-[10px] uppercase tracking-wide text-foreground-meta font-medium mb-1.5">
              Note to reviewers (optional)
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Context, mitigations, anything reviewers should know…"
              rows={3}
              className="w-full bg-background-muted/60 border border-border-muted rounded-md px-3 py-2 text-sm text-foreground placeholder:text-foreground-subtle focus:outline-none focus:ring-1 focus:ring-border-focus/40 resize-none"
            />
          </div>

          <p className="text-[11px] text-foreground-subtle mb-4">
            Reviewers will see: configuration summary · SOP flags · Helper actions · Evaluation Report.
          </p>

          <div className="flex items-center justify-end gap-2">
            <Dialog.Close asChild>
              <button
                type="button"
                className="h-8 px-3 rounded-md text-xs font-medium text-foreground-muted hover:text-foreground hover:bg-background-muted transition-colors"
              >
                Cancel
              </button>
            </Dialog.Close>
            <button
              type="button"
              onClick={handleConfirm}
              className="h-8 px-3.5 rounded-md text-xs font-medium bg-accent text-accent-foreground hover:bg-accent-muted transition-colors flex items-center gap-1.5"
            >
              <Send className="size-3.5" />
              Confirm submission
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function PreFlightItem({
  ok,
  warn,
  bad,
  children,
}: {
  ok?: boolean;
  warn?: boolean;
  bad?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 text-xs">
      {bad ? (
        <AlertOctagon className="size-3.5 text-error shrink-0" />
      ) : warn ? (
        <AlertTriangle className="size-3.5 text-warning shrink-0" />
      ) : ok ? (
        <CheckCircle2 className="size-3.5 text-success shrink-0" />
      ) : null}
      <span className={cn(bad ? 'text-error' : warn ? 'text-warning' : 'text-foreground')}>
        {children}
      </span>
    </div>
  );
}

function ReviewerChip({ name, initials }: { name: string; initials: string }) {
  return (
    <span className="inline-flex items-center gap-2 px-2 py-1 rounded-md bg-background-muted/60 border border-border-muted text-xs">
      <span className="size-5 rounded-full bg-success-subtle text-success flex items-center justify-center text-[10px] font-medium">
        {initials}
      </span>
      {name}
    </span>
  );
}
