'use client';

import { Sparkles } from 'lucide-react';
import { useHelper } from '@/lib/helper-state';

interface Props {
  suggestions: string[];
  appName?: string;
}

export function HelperCard({ suggestions, appName }: Props) {
  const openHelper = useHelper((s) => s.open);

  const handleClick = (prompt: string) => {
    openHelper({
      kind: 'review-studio',
      label: appName ? `Review Studio · ${appName}` : 'Review Studio',
      appName,
    });
    // Slight delay to let the open state settle, then ask
    setTimeout(() => {
      useHelper.getState().ask(prompt);
    }, 50);
  };

  return (
    <section className="rounded-lg border border-purple/20 bg-purple/5 p-4">
      <div className="flex items-center gap-1.5 mb-3 text-purple">
        <Sparkles className="size-3.5" />
        <span className="text-[11px] uppercase tracking-wide font-medium">Helper suggestions</span>
      </div>
      <div className="space-y-1.5">
        {suggestions.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => handleClick(s)}
            className="w-full text-left text-xs px-2.5 py-1.5 rounded-md bg-background-elevated/40 hover:bg-background-elevated text-foreground-muted hover:text-foreground transition-colors leading-snug"
          >
            {s}
          </button>
        ))}
      </div>
    </section>
  );
}
