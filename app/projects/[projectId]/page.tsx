import { notFound } from 'next/navigation';
import { FolderOpen, Plus } from 'lucide-react';
import { ProjectAppsCatalog } from '@/components/projects/ProjectAppsCatalog';
import { SyncActiveProject } from '@/components/projects/SyncActiveProject';
import { Footer } from '@/components/shell/Footer';
import { getProjectById, projects } from '@/lib/mock-data';
import { getProjectAppGroups } from '@/lib/mock-data/project-connectors';

interface PageProps {
  params: Promise<{ projectId: string }>;
}

export function generateStaticParams() {
  return projects.map((p) => ({ projectId: p.id }));
}

export default async function ProjectAppsPage({ params }: PageProps) {
  const { projectId } = await params;
  const project = getProjectById(projectId);
  if (!project) notFound();

  const appGroups = getProjectAppGroups(project.id);

  return (
    <div className="space-y-6">
      <SyncActiveProject projectId={project.id} />

      {appGroups.length === 0 ? (
        <section className="rounded-[28px] border border-border-muted bg-background-subtle overflow-hidden">
          <div className="flex min-h-[560px] items-center justify-center px-6 py-16">
            <div className="mx-auto flex max-w-xl flex-col items-center text-center">
              <div className="flex size-24 items-center justify-center rounded-[28px] border border-border-muted bg-background shadow-[0_18px_48px_rgba(15,23,42,0.08)]">
                <FolderOpen className="size-6 text-foreground-subtle" />
              </div>
              <h3 className="mt-8 text-2xl font-semibold tracking-tight text-foreground">No integrations yet</h3>
              <p className="mt-3 max-w-lg text-sm leading-7 text-foreground-muted">
                Add a connection to create the first integration entry.
              </p>
              <a
                href={`/integrations/new?mode=scratch&returnTo=/projects/${project.id}`}
                className="mt-8 inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent-muted"
              >
                <Plus className="size-4" />
                Add connection
              </a>
            </div>
          </div>
        </section>
      ) : (
        <ProjectAppsCatalog projectId={project.id} appGroups={appGroups} />
      )}

      <Footer />
    </div>
  );
}
