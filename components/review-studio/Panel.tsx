import type { ReactNode } from 'react';
import { Sparkles, PencilLine } from 'lucide-react';

export function Panel({
  title,
  subtitle,
  helperHint,
  children,
}: {
  title: string;
  subtitle?: string;
  helperHint?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-lg border border-border-muted bg-background-subtle p-5">
      <header className="flex items-start justify-between mb-3">
        <div>
          <h2 className="text-sm font-semibold">{title}</h2>
          {subtitle && (
            <p className="text-[11px] text-foreground-muted mt-0.5">{subtitle}</p>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            className="size-7 rounded-md hover:bg-background-elevated text-foreground-subtle hover:text-foreground transition-colors flex items-center justify-center"
            aria-label="Edit"
            title="Edit"
          >
            <PencilLine className="size-3.5" />
          </button>
          <button
            type="button"
            className="size-7 rounded-md hover:bg-purple/10 text-purple/70 hover:text-purple transition-colors flex items-center justify-center"
            aria-label={helperHint ?? 'Ask Helper'}
            title={helperHint ?? 'Ask Helper about this section'}
          >
            <Sparkles className="size-3.5" />
          </button>
        </div>
      </header>
      {children}
    </section>
  );
}
