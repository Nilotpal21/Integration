'use client';

import { useState } from 'react';
import { Plus, MoreHorizontal, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import {
  modelEndpoints,
  apps,
  endpointSupports,
  getEndpointByPurpose,
  type ModelEndpoint,
} from '@/lib/mock-data';
import { ConfigurationOverview } from '@/components/models/ConfigurationOverview';
import { EndpointCard } from '@/components/models/EndpointCard';
import { EndpointDetailSheet } from '@/components/models/EndpointDetailSheet';
import { AddEndpointDialog } from '@/components/models/AddEndpointDialog';
import { Footer } from '@/components/shell/Footer';

export default function ModelsPage() {
  const [selected, setSelected] = useState<ModelEndpoint | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  // Build a simple capability-mismatch warning for the banner
  const respEndpoint = getEndpointByPurpose('response_generation');
  const visionRequiredApps = apps.filter((a) => false); // None in the prototype demand vision
  const showMismatch =
    visionRequiredApps.length > 0 && respEndpoint && !endpointSupports(respEndpoint, 'vision');

  return (
    <div className="space-y-5">
      <header className="flex items-end justify-between gap-3 pb-4 border-b border-border-muted">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Model Integration</h1>
          <p className="text-xs text-foreground-muted mt-1.5">
            Configure which models serve each platform function. Bring your own provider via API
            key, or connect a custom endpoint.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="h-9 px-3.5 rounded-md text-xs font-medium bg-accent text-accent-foreground hover:bg-accent-muted transition-colors flex items-center gap-1.5"
          >
            <Plus className="size-3.5" />
            Add endpoint
          </button>
          <button
            type="button"
            onClick={() =>
              toast.success(`Testing ${modelEndpoints.length} endpoints…`, {
                description: 'All endpoints responded within latency targets.',
              })
            }
            className="h-9 px-3 rounded-md text-xs font-medium border border-border-muted text-foreground-muted hover:text-foreground hover:bg-background-elevated transition-colors"
          >
            Test all
          </button>
          <button
            type="button"
            className="size-9 rounded-md border border-border-muted text-foreground-muted hover:text-foreground hover:bg-background-elevated transition-colors flex items-center justify-center"
            aria-label="More options"
          >
            <MoreHorizontal className="size-4" />
          </button>
        </div>
      </header>

      {showMismatch && (
        <div className="rounded-md border border-warning/30 bg-warning-subtle/40 p-3 flex items-start gap-2">
          <AlertTriangle className="size-3.5 text-warning shrink-0 mt-0.5" />
          <div className="text-xs">
            <div className="font-medium text-foreground">Capability mismatch</div>
            <div className="text-foreground-muted mt-0.5">
              One or more apps require a capability that the assigned endpoint doesn&apos;t
              advertise. Either disable the capability on those apps, or assign a capable endpoint.
            </div>
          </div>
        </div>
      )}

      <ConfigurationOverview />

      <section>
        <h2 className="text-sm font-semibold mb-3">
          Configured endpoints
          <span className="text-[11px] text-foreground-muted font-normal tabular-nums font-mono ml-2">
            ({modelEndpoints.length})
          </span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {modelEndpoints.map((e) => (
            <EndpointCard key={e.id} endpoint={e} onClick={() => setSelected(e)} />
          ))}
        </div>
      </section>

      <Footer />

      <EndpointDetailSheet
        endpoint={selected}
        open={selected !== null}
        onOpenChange={(o) => !o && setSelected(null)}
      />
      <AddEndpointDialog open={addOpen} onOpenChange={setAddOpen} />
    </div>
  );
}
