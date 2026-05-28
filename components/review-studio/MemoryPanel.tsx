'use client';

import { useAppState, type MemoryMode } from '@/lib/app-state';

const OPTIONS: { v: MemoryMode; label: string; sub: string; recommended?: boolean }[] = [
  { v: 'none', label: 'None', sub: 'No memory across turns.' },
  {
    v: 'session',
    label: 'Session',
    sub: 'Remembers within one conversation.',
    recommended: true,
  },
  {
    v: 'long',
    label: 'Long-term',
    sub: 'Requires explicit member consent · follows GLBA disclosure rules.',
  },
];

export function MemoryPanel({ appId }: { appId: string }) {
  const mode = useAppState((s) => s.overrides[appId]?.memoryMode ?? 'session');
  const setMemoryMode = useAppState((s) => s.setMemoryMode);

  return (
    <div className="space-y-2">
      {OPTIONS.map((opt) => (
        <label
          key={opt.v}
          className="flex items-start gap-3 px-3 py-2 rounded-md border border-border-muted hover:border-border cursor-pointer transition-colors"
        >
          <input
            type="radio"
            name={`memory-${appId}`}
            checked={mode === opt.v}
            onChange={() => setMemoryMode(appId, opt.v)}
            className="mt-0.5 size-3.5 accent-foreground"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-medium">{opt.label}</span>
              {opt.recommended && (
                <span className="text-[10px] uppercase tracking-wide bg-success-subtle text-success px-1.5 py-0.5 rounded font-medium">
                  Recommended
                </span>
              )}
            </div>
            <p className="text-[11px] text-foreground-muted mt-0.5">{opt.sub}</p>
          </div>
        </label>
      ))}
    </div>
  );
}
