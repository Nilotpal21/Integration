'use client';

import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Lock, PencilLine, Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import { useAppState } from '@/lib/app-state';

interface Props {
  appId: string;
  baselineGuardrails: string[];
}

export function GuardrailsPanel({ appId, baselineGuardrails }: Props) {
  const customs = useAppState((s) => s.overrides[appId]?.customGuardrails ?? []);
  const addCustomGuardrail = useAppState((s) => s.addCustomGuardrail);
  const removeCustomGuardrail = useAppState((s) => s.removeCustomGuardrail);
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');

  const baseline = baselineGuardrails.slice(0, 4);
  const sopCustom = baselineGuardrails.slice(4);

  const confirm = () => {
    const value = text.trim();
    if (!value) return;
    addCustomGuardrail(appId, value);
    toast.success('Custom guardrail added');
    setText('');
    setOpen(false);
  };

  return (
    <>
      <p className="text-[11px] text-foreground-muted mb-3">
        Baseline credit-union guardrails are applied automatically and cannot be removed.
      </p>
      <ul className="space-y-1.5">
        {baseline.map((g) => (
          <li
            key={g}
            className="flex items-center gap-2.5 px-2 py-1.5 rounded-md bg-background-muted/40 border border-border-muted text-xs"
          >
            <Lock className="size-3.5 text-foreground-subtle shrink-0" />
            <span className="flex-1 truncate">{g}</span>
            <span className="text-[10px] uppercase tracking-wide text-foreground-meta">
              Baseline
            </span>
          </li>
        ))}
        {sopCustom.map((g) => (
          <li
            key={g}
            className="flex items-center gap-2.5 px-2 py-1.5 rounded-md bg-background-muted/40 border border-border-muted text-xs"
          >
            <PencilLine className="size-3.5 text-foreground-muted shrink-0" />
            <span className="flex-1 truncate">{g}</span>
            <span className="text-[10px] uppercase tracking-wide text-foreground-meta">
              SOP
            </span>
          </li>
        ))}
        {customs.map((g) => (
          <li
            key={g}
            className="flex items-center gap-2.5 px-2 py-1.5 rounded-md bg-background-muted/40 border border-border-muted text-xs"
          >
            <PencilLine className="size-3.5 text-foreground-muted shrink-0" />
            <span className="flex-1 truncate">{g}</span>
            <span className="text-[10px] uppercase tracking-wide text-foreground-meta">
              Custom
            </span>
            <button
              type="button"
              onClick={() => removeCustomGuardrail(appId, g)}
              className="text-foreground-subtle hover:text-error transition-colors"
              aria-label={`Remove guardrail ${g}`}
            >
              <X className="size-3" />
            </button>
          </li>
        ))}
      </ul>

      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Trigger asChild>
          <button
            type="button"
            className="mt-3 h-7 px-2.5 rounded-md text-[11px] font-medium border border-border-muted text-foreground-muted hover:bg-background-elevated hover:text-foreground transition-colors flex items-center gap-1"
          >
            <Plus className="size-3" />
            Add a custom guardrail
          </button>
        </Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40 bg-background/40 backdrop-blur-[2px] animate-fade-in" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[440px] max-w-[100vw] rounded-2xl border border-border bg-background-elevated shadow-2xl p-6 animate-fade-in">
            <Dialog.Title className="text-base font-semibold tracking-tight mb-1.5">
              Add a custom guardrail
            </Dialog.Title>
            <Dialog.Description className="text-xs text-foreground-muted mb-4">
              Describe a rule this app must follow. It will sit alongside baseline guardrails and
              be enforced at runtime.
            </Dialog.Description>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={3}
              placeholder="e.g. Never quote internal employee compensation details."
              className="w-full bg-background-muted/60 border border-border-muted rounded-md px-3 py-2 text-sm text-foreground placeholder:text-foreground-subtle focus:outline-none focus:ring-1 focus:ring-border-focus/40 resize-none mb-4"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="h-8 px-3 rounded-md text-xs font-medium text-foreground-muted hover:text-foreground hover:bg-background-muted transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirm}
                disabled={!text.trim()}
                className="h-8 px-3.5 rounded-md text-xs font-medium bg-accent text-accent-foreground hover:bg-accent-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
