import { notFound } from 'next/navigation';
import { apps } from '@/lib/mock-data';
import { AgentChat } from '@/components/chat/AgentChat';
import { Footer } from '@/components/shell/Footer';

interface PageProps {
  params: Promise<{ appId: string }>;
}

export function generateStaticParams() {
  return apps.map((a) => ({ appId: a.id }));
}

export default async function AppChatPage({ params }: PageProps) {
  const { appId } = await params;
  const app = apps.find((a) => a.id === appId);
  if (!app) notFound();

  return (
    <div className="space-y-3">
      <AgentChat
        scope={{ kind: 'app', app }}
        agentName={app.name}
        backHref={`/apps/${app.id}`}
        backLabel="Back to Agent"
      />
      <Footer />
    </div>
  );
}
