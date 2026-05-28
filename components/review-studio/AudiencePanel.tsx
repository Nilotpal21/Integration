'use client';

import { useAppState, type AudienceMode } from '@/lib/app-state';

export function AudiencePanel({ appId }: { appId: string }) {
  const audience = useAppState((s) => s.overrides[appId]?.audience ?? 'all_members');
  const setAudience = useAppState((s) => s.setAudience);

  const opts: { v: AudienceMode; label: string; muted?: boolean }[] = [
    { v: 'all_members', label: 'All members' },
    { v: 'segment', label: 'Members in segment…', muted: true },
  ];

  return (
    <div className="space-y-1.5">
      {opts.map((o) => (
        <label
          key={o.v}
          className={`flex items-center gap-2 text-xs cursor-pointer ${
            audience === o.v ? 'text-foreground' : 'text-foreground-muted'
          }`}
        >
          <input
            type="radio"
            name={`audience-${appId}`}
            checked={audience === o.v}
            onChange={() => setAudience(appId, o.v)}
            className="size-3.5 accent-foreground"
          />
          {o.label}
        </label>
      ))}
      <p className="text-[11px] text-foreground-subtle mt-2">
        Estimated audience size: 47,200 members
      </p>
    </div>
  );
}
