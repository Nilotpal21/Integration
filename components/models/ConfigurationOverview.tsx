'use client';

import { toast } from 'sonner';
import { Cpu, ArrowRight } from 'lucide-react';
import {
  modelEndpoints,
  purposeMeta,
  purposeOrder,
  getEndpointByPurpose,
  type ModelPurpose,
} from '@/lib/mock-data';
import { cn } from '@/lib/utils';

export function ConfigurationOverview() {
  return (
    <section className="rounded-lg border border-border-muted bg-background-subtle p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-sm font-semibold">Configuration</h2>
          <p className="text-[11px] text-foreground-muted mt-0.5">
            Per-purpose model assignments · BYOM hybrid
          </p>
        </div>
        <span className="text-[10px] uppercase tracking-wide text-purple bg-purple/10 border border-purple/20 px-2 py-0.5 rounded font-medium">
          Custom (BYOM)
        </span>
      </div>

      <ul className="divide-y divide-border-muted">
        {purposeOrder.map((p) => {
          const endpoint = getEndpointByPurpose(p);
          return <PurposeRow key={p} purpose={p} endpoint={endpoint ?? null} />;
        })}
      </ul>
    </section>
  );
}

function PurposeRow({
  purpose,
  endpoint,
}: {
  purpose: ModelPurpose;
  endpoint: ReturnType<typeof getEndpointByPurpose> | null;
}) {
  const meta = purposeMeta[purpose];
  const handleChange = () => {
    const compatible = modelEndpoints.filter((e) => e.id !== endpoint?.id).slice(0, 3);
    toast.info(
      `${compatible.length} compatible endpoints available`,
      { description: `Compatible: ${compatible.map((e) => e.name).join(', ')}` },
    );
  };

  return (
    <li className="py-2.5 grid grid-cols-[1fr_max-content_auto] items-center gap-3 text-xs">
      <div className="min-w-0">
        <div className="text-sm font-medium">{meta.label}</div>
        <div className="text-[11px] text-foreground-muted">{meta.description}</div>
      </div>
      <ArrowRight className="size-3.5 text-foreground-subtle shrink-0" />
      <div className="flex items-center gap-3 min-w-0">
        <div className="min-w-0 text-right">
          {endpoint ? (
            <>
              <div className="font-mono text-foreground truncate">{endpoint.name}</div>
              <div className={cn('text-[11px] text-foreground-subtle truncate')}>
                {endpoint.provider} · {endpoint.region}
              </div>
            </>
          ) : (
            <div className="text-foreground-subtle italic text-[11px]">Inherits tenant default</div>
          )}
        </div>
        <button
          type="button"
          onClick={handleChange}
          className="h-7 px-2.5 rounded-md text-[11px] font-medium border border-border-muted text-foreground-muted hover:text-foreground hover:bg-background-elevated transition-colors flex items-center gap-1 shrink-0"
        >
          <Cpu className="size-3" />
          Change
        </button>
      </div>
    </li>
  );
}
