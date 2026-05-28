'use client';

import { Copy } from 'lucide-react';
import { toast } from 'sonner';

export function SpecCopyButton({ text }: { text: string }) {
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard?.writeText(text);
        toast.success('Spec copied');
      }}
      className="h-7 px-2 rounded-md text-[11px] font-medium border border-border-muted text-foreground-muted hover:text-foreground hover:bg-background-elevated transition-colors flex items-center gap-1.5"
    >
      <Copy className="size-3" />
      Copy
    </button>
  );
}
