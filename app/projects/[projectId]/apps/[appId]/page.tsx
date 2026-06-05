import Link from 'next/link';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { notFound } from 'next/navigation';
import { Ban, ChevronRight, KeyRound, MoreVertical, Trash2 } from 'lucide-react';
import { AddConnectionMenu } from '@/components/integrations/AddConnectionMenu';
import { AppIcon } from '@/components/integrations/AppIcon';
import { SyncActiveProject } from '@/components/projects/SyncActiveProject';
import { Footer } from '@/components/shell/Footer';
import { getProjectById } from '@/lib/mock-data';
import { getProjectAppGroups, type ProjectConnector } from '@/lib/mock-data/project-connectors';

interface PageProps {
  params: Promise<{ projectId: string; appId: string }>;
}

function statusTone(status: ProjectConnector['availabilityStatus'] | ProjectConnector['recordStatus']) {
  if (status === 'active') return 'border-[#9de8b9] bg-[#ecfff3] text-[#1f9d60]';
  if (status === 'disabled') return 'border-[#f5d39f] bg-[#fff7ea] text-[#df7d14]';
  if (status === 'revoked') return 'border-[#e0a6a6] bg-[#fff3f1] text-[#d64c4c]';
  return 'border-border-muted bg-background-elevated text-foreground-muted';
}

export default async function ProjectAppConnectorsPage({ params }: PageProps) {
  const { projectId, appId } = await params;
  const project = getProjectById(projectId);
  if (!project) notFound();

  const appGroup = getProjectAppGroups(project.id).find((group) => group.appId === appId);
  if (!appGroup) notFound();

  const connectorRows = appGroup.connectors.map((connector) => ({
    ...connector,
    addedBy: 'Nilotpal',
    authorizationDetails:
      connector.availabilityStatus === 'revoked'
        ? 'Reauthorization required'
        : connector.authType === 'OAuth'
          ? 'Pre-authorized'
          : connector.recordStatus === 'draft'
            ? 'Pending validation'
            : 'Pre-authorized',
    integrationType:
      connector.authType === 'OAuth'
        ? 'OAuth2'
        : connector.authType === 'PAT'
          ? 'PAT'
          : connector.authType,
    addedOn: connector.updatedAt.replace(/,.*$/, ''),
  }));

  return (
    <div className="space-y-4">
      <SyncActiveProject projectId={project.id} />

      <section className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-[13px] text-foreground-muted">
            <Link href={`/projects/${project.id}`} className="transition-colors hover:text-foreground">
              Integrations
            </Link>
            <ChevronRight className="size-4 text-foreground-subtle" />
            <span className="text-foreground">{appGroup.appName}</span>
          </div>
        </div>
        <AddConnectionMenu appId={appGroup.appId} returnTo={`/projects/${project.id}/apps/${appGroup.appId}`} />
      </section>

      <section className="overflow-hidden rounded-[18px] border border-border-muted bg-background-subtle">
        {connectorRows.length === 0 ? (
          <div className="flex min-h-[460px] items-center justify-center px-6 py-14">
            <div className="max-w-lg text-center">
              <div className="mx-auto flex size-24 items-center justify-center rounded-[24px] border border-border-muted bg-background shadow-[0_12px_32px_rgba(15,23,42,0.08)]">
                <AppIcon appId={appGroup.appId} className="size-14 rounded-2xl" />
              </div>
              <h3 className="mt-6 text-[22px] font-semibold tracking-tight text-foreground">
                No connections added yet
              </h3>
              <p className="mt-3 text-sm leading-7 text-foreground-muted">
                Looks like you have not added any account yet for {appGroup.appName}. Add a connection to create the first independent connector for this app.
              </p>
              <div className="mt-7 flex justify-center">
                <AddConnectionMenu appId={appGroup.appId} returnTo={`/projects/${project.id}/apps/${appGroup.appId}`} />
              </div>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="min-w-[1080px] divide-y divide-border-muted">
              <div className="grid grid-cols-[1.45fr_0.78fr_0.72fr_0.7fr_0.82fr] gap-4 bg-background-elevated/50 px-6 py-3 text-[12px] font-medium text-foreground-muted">
                <div>Connection name</div>
                <div>Added by</div>
                <div>Status</div>
                <div>Added on</div>
                <div>Action</div>
              </div>
              {connectorRows.map((connector) => (
                <div
                  key={connector.id}
                  className="grid grid-cols-[1.45fr_0.78fr_0.72fr_0.7fr_0.82fr] gap-4 px-6 py-4 transition-colors hover:bg-background-muted/10"
                >
                  <div>
                    <div className="text-[14px] font-medium text-foreground">{connector.connectionName}</div>
                    <div className="mt-0.5 text-[10px] text-foreground-subtle">record: {connector.recordStatus}</div>
                  </div>
                  <div className="text-[14px] text-foreground-muted">{connector.addedBy}</div>
                  <div>
                    <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] ${statusTone(connector.availabilityStatus)}`}>
                      {connector.availabilityStatus}
                    </span>
                  </div>
                  <div className="text-[14px] text-foreground-muted">{connector.addedOn}</div>
                  <div className="flex items-center text-foreground-subtle">
                    <DropdownMenu.Root>
                      <DropdownMenu.Trigger asChild>
                        <button
                          type="button"
                          className="rounded-md p-1.5 transition-colors hover:bg-background-muted hover:text-foreground"
                          aria-label={`Actions for ${connector.connectionName}`}
                        >
                          <MoreVertical className="size-4.5" />
                        </button>
                      </DropdownMenu.Trigger>
                      <DropdownMenu.Portal>
                        <DropdownMenu.Content
                          align="end"
                          sideOffset={8}
                          className="z-[90] min-w-[180px] rounded-xl border border-border bg-background p-1.5 shadow-[0_20px_60px_rgba(15,23,42,0.18)]"
                        >
                          <DropdownMenu.Item className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground outline-none transition-colors hover:bg-background-muted focus:bg-background-muted">
                            <Ban className="size-4 text-foreground-subtle" />
                            Disable
                          </DropdownMenu.Item>
                          <DropdownMenu.Item className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground outline-none transition-colors hover:bg-background-muted focus:bg-background-muted">
                            <KeyRound className="size-4 text-warning" />
                            Revoke
                          </DropdownMenu.Item>
                          <DropdownMenu.Item className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-error outline-none transition-colors hover:bg-error-subtle focus:bg-error-subtle">
                            <Trash2 className="size-4" />
                            Delete
                          </DropdownMenu.Item>
                        </DropdownMenu.Content>
                      </DropdownMenu.Portal>
                    </DropdownMenu.Root>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      <Footer />
    </div>
  );
}
