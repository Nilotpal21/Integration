'use client';

import { useState } from 'react';
import { Play, Save, User, Briefcase } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SandboxTurn } from '@/lib/mock-data';

interface Props {
  script: SandboxTurn[];
}

export function SandboxPreview({ script }: Props) {
  const [mode, setMode] = useState<'member' | 'employee'>('member');
  const [revealCount, setRevealCount] = useState(script.length);

  const replay = () => {
    setRevealCount(0);
    let i = 0;
    const interval = setInterval(() => {
      i += 1;
      setRevealCount(i);
      if (i >= script.length) clearInterval(interval);
    }, 420);
  };

  const visible = script.slice(0, revealCount);

  return (
    <section className="rounded-lg border border-border-muted bg-background-subtle overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border-muted">
        <div>
          <h3 className="text-sm font-semibold">Test conversation</h3>
          <p className="text-[11px] text-foreground-muted mt-0.5">
            Sandboxed · safe to try
          </p>
        </div>
        <div className="flex items-center gap-1 p-0.5 rounded-md bg-background-muted/60">
          <button
            type="button"
            onClick={() => setMode('member')}
            className={cn(
              'inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors',
              mode === 'member'
                ? 'bg-background-elevated text-foreground'
                : 'text-foreground-muted hover:text-foreground',
            )}
          >
            <User className="size-3" />
            Member
          </button>
          <button
            type="button"
            onClick={() => setMode('employee')}
            className={cn(
              'inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors',
              mode === 'employee'
                ? 'bg-background-elevated text-foreground'
                : 'text-foreground-muted hover:text-foreground',
            )}
          >
            <Briefcase className="size-3" />
            Employee
          </button>
        </div>
      </div>

      <div className="px-4 py-3 max-h-[320px] overflow-y-auto scrollbar-thin space-y-2">
        {visible.map((turn, i) => (
          <div
            key={i}
            className={cn(
              'flex',
              turn.speaker === 'member' ? 'justify-end' : 'justify-start',
            )}
          >
            <div
              className={cn(
                'max-w-[85%] rounded-md px-2.5 py-1.5 text-xs leading-snug',
                turn.speaker === 'member'
                  ? 'bg-background-elevated text-foreground'
                  : 'bg-background-muted/70 text-foreground',
              )}
            >
              {turn.speaker === 'agent' && turn.agent && (
                <div className="text-[10px] uppercase tracking-wide text-purple font-medium mb-0.5">
                  via {turn.agent}
                </div>
              )}
              <div>{turn.text}</div>
              {turn.citation && (
                <div className="text-[10px] text-foreground-subtle mt-1 font-mono truncate">
                  ↳ {turn.citation}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 px-4 py-2.5 border-t border-border-muted">
        <button
          type="button"
          onClick={replay}
          className="h-7 px-2.5 rounded-md text-[11px] font-medium border border-border-muted text-foreground-muted hover:bg-background-elevated hover:text-foreground transition-colors flex items-center gap-1"
        >
          <Play className="size-3" />
          New test
        </button>
        <button
          type="button"
          className="h-7 px-2.5 rounded-md text-[11px] font-medium text-foreground-muted hover:text-foreground transition-colors flex items-center gap-1"
        >
          <Save className="size-3" />
          Save as evaluation test
        </button>
      </div>
    </section>
  );
}
