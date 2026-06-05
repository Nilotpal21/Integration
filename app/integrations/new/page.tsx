import { ConnectorCreationWizard } from '@/components/integrations/ConnectorCreationWizard';

interface PageProps {
  searchParams: Promise<{ mode?: 'scratch' | 'template'; returnTo?: string; appId?: 'hubspot' | 'salesforce' | 'zendesk' | 'calendly' }>;
}

export default async function NewIntegrationPage({ searchParams }: PageProps) {
  const params = await searchParams;
  return (
    <ConnectorCreationWizard
      initialMode={params.mode}
      initialAppId={params.appId}
      returnTo={params.returnTo ?? '/projects'}
    />
  );
}
