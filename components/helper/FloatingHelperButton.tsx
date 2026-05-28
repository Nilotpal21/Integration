'use client';

import { useEffect } from 'react';
import * as Tooltip from '@radix-ui/react-tooltip';
import { Sparkles } from 'lucide-react';
import { useHelper } from '@/lib/helper-state';

export function FloatingHelperButton() {
  const isOpen = useHelper((s) => s.isOpen);
  const open = useHelper((s) => s.open);
  const toggle = useHelper((s) => s.toggle);

  // Global ⌘/ shortcut to toggle the helper
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault();
        toggle();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [toggle]);

  // Hide the FAB while the sheet is open (the sheet has its own close button)
  if (isOpen) return null;

  return (
    <Tooltip.Provider delayDuration={200}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <button
            type="button"
            onClick={() => open()}
            aria-label="AI Helper — ⌘/"
            className="fixed bottom-6 right-6 z-40 size-12 rounded-full bg-purple/15 hover:bg-purple/25 border border-purple/30 text-purple flex items-center justify-center shadow-lg transition-all hover:scale-105 active:scale-95"
          >
            <Sparkles className="size-5" />
            <span className="absolute top-1 right-1 size-2 rounded-full bg-purple animate-pulse" />
          </button>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            side="left"
            sideOffset={8}
            className="z-50 rounded-md bg-background-elevated border border-border px-2 py-1 text-[11px] text-foreground-muted shadow-md animate-fade-in"
          >
            AI Helper · <kbd className="font-mono text-foreground-subtle">⌘/</kbd>
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}
