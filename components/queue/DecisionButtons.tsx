'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import * as Dialog from '@radix-ui/react-dialog';
import { Check, X, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Props {
  appName: string;
  hasBlocker: boolean;
  isCoReviewer?: boolean;
}

type Action = 'approve' | 'changes' | 'reject' | null;

export function DecisionButtons({ appName, hasBlocker, isCoReviewer }: Props) {
  const router = useRouter();
  const [action, setAction] = useState<Action>(null);
  const [comment, setComment] = useState('');
  const [acknowledgeReject, setAcknowledgeReject] = useState(false);

  const close = () => {
    setAction(null);
    setComment('');
    setAcknowledgeReject(false);
  };

  const handleConfirm = () => {
    if (action === 'approve') {
      toast.success(`Approved · ${appName} is ready to deploy`);
    } else if (action === 'changes') {
      toast.success(`Changes requested · the Process Owner has been notified`);
    } else if (action === 'reject') {
      toast.error(`Rejected · ${appName} is back to Draft`);
    }
    close();
    setTimeout(() => router.push('/queue'), 400);
  };

  const canConfirm =
    action === 'approve'
      ? true
      : action === 'changes'
        ? comment.trim().length > 0
        : action === 'reject'
          ? comment.trim().length > 0 && acknowledgeReject
          : false;

  return (
    <>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setAction('approve')}
          disabled={hasBlocker}
          title={hasBlocker ? 'Resolve all Blocker flags before approving.' : undefined}
          className={cn(
            'h-9 px-3.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors',
            hasBlocker
              ? 'bg-background-elevated text-foreground-subtle cursor-not-allowed'
              : 'bg-success text-success-foreground hover:bg-success/85',
          )}
        >
          <Check className="size-3.5" />
          {isCoReviewer ? 'Co-approve' : 'Approve'}
        </button>
        <button
          type="button"
          onClick={() => setAction('changes')}
          className="h-9 px-3 rounded-md text-xs font-medium bg-warning-subtle text-warning border border-warning/30 hover:bg-warning/15 transition-colors flex items-center gap-1.5"
        >
          <MessageSquare className="size-3.5" />
          Request changes
        </button>
        <button
          type="button"
          onClick={() => setAction('reject')}
          className="h-9 px-3 rounded-md text-xs font-medium text-error hover:bg-error-subtle transition-colors flex items-center gap-1.5"
        >
          <X className="size-3.5" />
          Reject
        </button>
      </div>

      <Dialog.Root open={action !== null} onOpenChange={(o) => !o && close()}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40 bg-background/40 backdrop-blur-[2px] animate-fade-in" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[480px] max-w-[100vw] rounded-2xl border border-border bg-background-elevated shadow-2xl p-6 animate-fade-in">
            {action === 'approve' && (
              <>
                <Dialog.Title className="text-base font-semibold tracking-tight mb-1.5">
                  {isCoReviewer ? 'Co-approve' : 'Approve'} <span className="font-mono">{appName}</span>?
                </Dialog.Title>
                <Dialog.Description className="text-xs text-foreground-muted mb-4">
                  This decision is recorded immutably in the audit log along with your name and the
                  current timestamp.
                </Dialog.Description>
                <Footer onCancel={close} onConfirm={handleConfirm} confirmLabel="Approve" tone="success" />
              </>
            )}

            {action === 'changes' && (
              <>
                <Dialog.Title className="text-base font-semibold tracking-tight mb-1.5">
                  Request changes on <span className="font-mono">{appName}</span>
                </Dialog.Title>
                <Dialog.Description className="text-xs text-foreground-muted mb-4">
                  A comment is required so the Process Owner knows what to address.
                </Dialog.Description>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="What needs to change?"
                  rows={4}
                  className="w-full bg-background-muted/60 border border-border-muted rounded-md px-3 py-2 text-sm text-foreground placeholder:text-foreground-subtle focus:outline-none focus:ring-1 focus:ring-border-focus/40 resize-none mb-4"
                />
                <Footer
                  onCancel={close}
                  onConfirm={handleConfirm}
                  canConfirm={canConfirm}
                  confirmLabel="Request changes"
                  tone="warning"
                />
              </>
            )}

            {action === 'reject' && (
              <>
                <Dialog.Title className="text-base font-semibold tracking-tight mb-1.5">
                  Reject <span className="font-mono">{appName}</span>?
                </Dialog.Title>
                <Dialog.Description className="text-xs text-foreground-muted mb-4">
                  Rejection sends the app back to draft. A comment is required.
                </Dialog.Description>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Reason for rejection"
                  rows={3}
                  className="w-full bg-background-muted/60 border border-border-muted rounded-md px-3 py-2 text-sm text-foreground placeholder:text-foreground-subtle focus:outline-none focus:ring-1 focus:ring-border-focus/40 resize-none mb-3"
                />
                <label className="flex items-start gap-2 text-xs cursor-pointer mb-4">
                  <input
                    type="checkbox"
                    checked={acknowledgeReject}
                    onChange={(e) => setAcknowledgeReject(e.target.checked)}
                    className="mt-0.5 size-3.5 accent-error"
                  />
                  <span className="text-foreground-muted">
                    I understand this app will not be deployable in its current form.
                  </span>
                </label>
                <Footer
                  onCancel={close}
                  onConfirm={handleConfirm}
                  canConfirm={canConfirm}
                  confirmLabel="Reject"
                  tone="error"
                />
              </>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}

function Footer({
  onCancel,
  onConfirm,
  canConfirm = true,
  confirmLabel,
  tone,
}: {
  onCancel: () => void;
  onConfirm: () => void;
  canConfirm?: boolean;
  confirmLabel: string;
  tone: 'success' | 'warning' | 'error';
}) {
  const toneCls =
    tone === 'success'
      ? 'bg-success text-success-foreground hover:bg-success/85'
      : tone === 'warning'
        ? 'bg-warning text-warning-foreground hover:bg-warning/85'
        : 'bg-error text-error-foreground hover:bg-error/85';
  return (
    <div className="flex items-center justify-end gap-2">
      <button
        type="button"
        onClick={onCancel}
        className="h-8 px-3 rounded-md text-xs font-medium text-foreground-muted hover:text-foreground hover:bg-background-muted transition-colors"
      >
        Cancel
      </button>
      <button
        type="button"
        onClick={onConfirm}
        disabled={!canConfirm}
        className={cn(
          'h-8 px-3.5 rounded-md text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
          toneCls,
        )}
      >
        {confirmLabel}
      </button>
    </div>
  );
}
