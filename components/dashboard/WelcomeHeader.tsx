'use client';

import { Sparkles } from 'lucide-react';
import { useActivePersona, useActiveProjectId } from '@/lib/persona';
import { tenant, getProjectById } from '@/lib/mock-data';
import { useHelper } from '@/lib/helper-state';

export function WelcomeHeader() {
  const persona = useActivePersona();
  const projectId = useActiveProjectId();
  const project = getProjectById(projectId);
  const openHelper = useHelper((s) => s.open);

  return (
    <header className="flex items-end justify-between">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">
          Welcome back, {persona.firstName}
        </h1>
        <p className="text-xs text-foreground-muted mt-1">
          {tenant.name} · {project ? `${project.name} project` : 'no active project'} · 3
          deployments in the last 7 days
        </p>
      </div>
      <button
        type="button"
        onClick={() =>
          openHelper({
            kind: 'dashboard',
            label: `Dashboard · ${project?.name ?? 'workspace'}`,
            projectName: project?.name,
          })
        }
        className="h-8 px-3 rounded-md bg-purple/15 text-purple hover:bg-purple/20 transition-colors text-xs font-medium flex items-center gap-1.5"
      >
        <Sparkles className="size-3.5" />
        Ask Helper
      </button>
    </header>
  );
}
