'use client';

import Link from 'next/link';
import { FileText, Plus, AlertOctagon, AlertTriangle, Lightbulb } from 'lucide-react';
import { sops, projectSOPMap, getProjectById } from '@/lib/mock-data';
import { useActiveProjectId } from '@/lib/persona';
import { Footer } from '@/components/shell/Footer';

export default function SOPsPage() {
  const activeProjectId = useActiveProjectId();
  const project = getProjectById(activeProjectId);
  const projectSops = sops.filter((s) => projectSOPMap[s.id] === activeProjectId);

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">SOPs</h1>
          <p className="text-xs text-foreground-muted mt-1">
            {projectSops.length} SOPs in the {project?.name ?? 'active'} project · the basis for every generated app.
          </p>
        </div>
        <Link
          href="/sops/new"
          className="h-8 px-3 rounded-md text-xs font-medium bg-accent text-accent-foreground hover:bg-accent-muted transition-colors flex items-center gap-1.5"
        >
          <Plus className="size-3.5" />
          Upload SOP
        </Link>
      </header>

      <div className="rounded-lg border border-border-muted bg-background-subtle overflow-hidden">
        <div className="grid grid-cols-[2fr_1fr_1fr_1fr_auto] items-center gap-4 px-4 py-2.5 border-b border-border-muted text-[10px] uppercase tracking-wide text-foreground-meta font-medium">
          <div>SOP</div>
          <div>Parsed</div>
          <div>Flags</div>
          <div>Generated app</div>
          <div className="text-right">Uploaded</div>
        </div>

        {projectSops.length === 0 && (
          <p className="px-4 py-8 text-xs text-foreground-muted text-center">
            No SOPs in this project yet. Click <span className="font-medium">Upload SOP</span> to add one.
          </p>
        )}
        {projectSops.map((sop) => {
          const appId = sop.appsGenerated[0];
          return (
            <Link
              key={sop.id}
              href={`/sops/${sop.id}`}
              className="grid grid-cols-[2fr_1fr_1fr_1fr_auto] items-center gap-4 px-4 py-3 border-b last:border-b-0 border-border-muted hover:bg-background-muted/40 transition-colors group"
            >
              <div className="flex items-start gap-2.5 min-w-0">
                <div className="size-7 rounded-md bg-background-elevated border border-border-muted flex items-center justify-center shrink-0">
                  <FileText className="size-3.5 text-foreground-muted group-hover:text-foreground transition-colors" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{sop.name}</div>
                  <div className="text-[11px] text-foreground-subtle font-mono truncate">
                    {sop.filename} · {sop.pages} pages · v{sop.version}
                  </div>
                </div>
              </div>

              <div className="text-xs text-foreground-muted">
                {sop.stats.intentsDetected} intents · {sop.stats.tasksDetected} tasks ·{' '}
                {sop.stats.escalationsDetected} escalations
              </div>

              <div className="flex items-center gap-2 text-[11px]">
                <FlagPill
                  icon={AlertOctagon}
                  count={sop.blockerFlags}
                  color="text-error"
                  bg="bg-error-subtle"
                />
                <FlagPill
                  icon={AlertTriangle}
                  count={sop.warningFlags}
                  color="text-warning"
                  bg="bg-warning-subtle"
                />
                <FlagPill
                  icon={Lightbulb}
                  count={sop.suggestionFlags}
                  color="text-info"
                  bg="bg-info-subtle"
                />
              </div>

              <div className="text-xs font-mono text-foreground-muted truncate">
                {appId ? appId.replace('app_', '') : '—'}
              </div>

              <div className="text-[11px] text-foreground-subtle whitespace-nowrap text-right">
                {sop.uploadedAt}
              </div>
            </Link>
          );
        })}
      </div>

      <Footer />
    </div>
  );
}

function FlagPill({
  icon: Icon,
  count,
  color,
  bg,
}: {
  icon: typeof FileText;
  count: number;
  color: string;
  bg: string;
}) {
  const muted = count === 0;
  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded font-mono tabular-nums ${
        muted ? 'bg-background-elevated text-foreground-subtle' : `${bg} ${color}`
      }`}
    >
      <Icon className="size-3" />
      {count}
    </span>
  );
}
