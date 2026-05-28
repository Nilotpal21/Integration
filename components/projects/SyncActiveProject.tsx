'use client';

import { useEffect } from 'react';
import { usePersona } from '@/lib/persona';

/**
 * Mounts on a project-scoped route and ensures the topbar Project switcher
 * reflects the project the user is actually viewing.
 */
export function SyncActiveProject({ projectId }: { projectId: string }) {
  const activeProjectId = usePersona((s) => s.activeProjectId);
  const setActiveProject = usePersona((s) => s.setActiveProject);

  useEffect(() => {
    if (activeProjectId !== projectId) {
      setActiveProject(projectId);
    }
  }, [projectId, activeProjectId, setActiveProject]);

  return null;
}
