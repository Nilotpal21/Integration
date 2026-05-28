import { notFound } from 'next/navigation';
import { apps, getProjectById, projectAppMap, projects } from '@/lib/mock-data';
import { AgentChat } from '@/components/chat/AgentChat';
import { Footer } from '@/components/shell/Footer';

interface PageProps {
  params: Promise<{ projectId: string }>;
}

export function generateStaticParams() {
  return projects.map((p) => ({ projectId: p.id }));
}

export default async function ProjectChatPage({ params }: PageProps) {
  const { projectId } = await params;
  const project = getProjectById(projectId);
  if (!project) notFound();

  const projectApps = apps.filter((a) => projectAppMap[a.id] === project.id);

  if (projectApps.length === 0) {
    return (
      <div className="space-y-5">
        <header className="pb-4 border-b border-border-muted">
          <h1 className="text-2xl font-semibold tracking-tight">Chat with {project.name}</h1>
        </header>
        <div className="rounded-lg border border-border-muted bg-background-subtle p-8 text-center">
          <p className="text-xs text-foreground-muted">
            No apps in this project yet. Build one from an SOP to chat with it here.
          </p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <AgentChat
        scope={{ kind: 'project', projectId: project.id, apps: projectApps }}
        agentName={`${project.name} · Router`}
        backHref={`/projects/${project.id}`}
        backLabel="Back to Project"
      />
      <Footer />
    </div>
  );
}
