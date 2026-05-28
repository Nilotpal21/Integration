import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowUpRight, Sparkles, Settings as SettingsIcon, Upload } from 'lucide-react';
import { SyncActiveProject } from '@/components/projects/SyncActiveProject';
import {
  getProjectById,
  projects,
  apps as allApps,
  sops as allSops,
  activity as allActivity,
  projectAppMap,
  projectSOPMap,
} from '@/lib/mock-data';
import { Footer } from '@/components/shell/Footer';
import { cn } from '@/lib/utils';

interface PageProps {
  params: Promise<{ projectId: string }>;
}

export function generateStaticParams() {
  return projects.map((p) => ({ projectId: p.id }));
}

export default async function ProjectDetailPage({ params }: PageProps) {
  const { projectId } = await params;
  const project = getProjectById(projectId);
  if (!project) notFound();

  const projectApps = allApps.filter((a) => projectAppMap[a.id] === project.id);
  const projectSops = allSops.filter((s) => projectSOPMap[s.id] === project.id);
  const projectActivity = allActivity.filter((a) => projectAppMap[a.appId] === project.id);
  const costPct = Math.round((project.mtdSpend / project.monthlyBudget) * 100);

  return (
    <div className="space-y-6">
      <SyncActiveProject projectId={project.id} />

      <nav className="text-xs text-foreground-muted flex items-center gap-2">
        <Link href="/projects" className="hover:text-foreground transition-colors">
          Projects
        </Link>
        <span className="text-foreground-subtle">/</span>
        <span className="text-foreground">{project.name}</span>
      </nav>

      <header className="flex items-end justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-semibold tracking-tight">{project.name}</h1>
            <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded uppercase tracking-wide font-medium bg-success-subtle text-success">
              <span className="size-1.5 rounded-full bg-success" />
              Active
            </span>
          </div>
          <p className="text-xs text-foreground-muted mt-1">
            {project.description}
          </p>
          <p className="text-[11px] text-foreground-subtle mt-1">
            {project.memberCount} members · {project.reviewerCount} reviewers · default channels:{' '}
            {project.defaultChannels.join(', ')}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href={`/projects/${project.id}/settings`}
            className="h-8 px-3 rounded-md text-xs font-medium border border-border-muted text-foreground-muted hover:text-foreground hover:bg-background-elevated transition-colors flex items-center gap-1.5"
          >
            <SettingsIcon className="size-3.5" />
            Settings
          </Link>
          <Link
            href="/sops/new"
            className="h-8 px-3 rounded-md text-xs font-medium bg-accent text-accent-foreground hover:bg-accent-muted transition-colors flex items-center gap-1.5"
          >
            <Upload className="size-3.5" />
            Upload SOP into {project.name}
          </Link>
        </div>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPI label="Apps" value={project.appCount.toString()} />
        <KPI label="Conversations · 24h" value={project.conversations24h.toLocaleString()} />
        <KPI
          label="Avg evaluation score"
          value={project.avgEvaluationScore.toString()}
          tone={
            project.avgEvaluationScore >= 90
              ? 'success'
              : project.avgEvaluationScore >= 75
                ? 'warning'
                : 'error'
          }
        />
        <KPI
          label="Budget · MTD"
          value={`${costPct}%`}
          tone={costPct >= 95 ? 'error' : costPct >= 80 ? 'warning' : 'neutral'}
          delta={`$${project.mtdSpend.toLocaleString()} / $${project.monthlyBudget.toLocaleString()}`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <section className="rounded-lg border border-border-muted bg-background-subtle">
          <div className="px-4 py-3 border-b border-border-muted">
            <h2 className="text-sm font-semibold">Apps</h2>
            <p className="text-xs text-foreground-muted mt-0.5">
              {projectApps.length} apps in this project
            </p>
          </div>
          <div className="divide-y divide-border-muted">
            {projectApps.length === 0 && (
              <p className="px-4 py-6 text-xs text-foreground-muted text-center">
                No apps yet.
              </p>
            )}
            {projectApps.map((a) => (
              <Link
                key={a.id}
                href={`/apps/${a.id}`}
                className="px-4 py-3 flex items-center gap-3 hover:bg-background-muted/40 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-mono">{a.name}</div>
                  <div className="text-[11px] text-foreground-subtle truncate mt-0.5">
                    {a.description}
                  </div>
                </div>
                <span
                  className={cn(
                    'text-xs font-medium tabular-nums px-1.5 py-0.5 rounded',
                    a.evaluationScore >= 90
                      ? 'bg-success-subtle text-success'
                      : a.evaluationScore >= 75
                        ? 'bg-warning-subtle text-warning'
                        : 'bg-error-subtle text-error',
                  )}
                >
                  {a.evaluationScore}
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-border-muted bg-background-subtle">
          <div className="px-4 py-3 border-b border-border-muted">
            <h2 className="text-sm font-semibold">SOPs</h2>
            <p className="text-xs text-foreground-muted mt-0.5">
              {projectSops.length} SOPs uploaded
            </p>
          </div>
          <div className="divide-y divide-border-muted">
            {projectSops.length === 0 && (
              <p className="px-4 py-6 text-xs text-foreground-muted text-center">
                No SOPs yet.
              </p>
            )}
            {projectSops.map((s) => (
              <Link
                key={s.id}
                href={`/sops/${s.id}`}
                className="px-4 py-3 flex items-center gap-3 hover:bg-background-muted/40 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <div className="text-sm">{s.name}</div>
                  <div className="text-[11px] text-foreground-subtle font-mono truncate mt-0.5">
                    {s.filename} · {s.pages}p · v{s.version}
                  </div>
                </div>
                <ArrowUpRight className="size-3.5 text-foreground-subtle" />
              </Link>
            ))}
          </div>
        </section>
      </div>

      <section className="rounded-lg border border-border-muted bg-background-subtle overflow-hidden">
        <div className="px-4 py-3 border-b border-border-muted">
          <h2 className="text-sm font-semibold">Recent activity</h2>
          <p className="text-xs text-foreground-muted mt-0.5">
            Events scoped to this project
          </p>
        </div>
        <div className="divide-y divide-border-muted">
          {projectActivity.length === 0 && (
            <p className="px-4 py-6 text-xs text-foreground-muted text-center">
              No recent activity in this project.
            </p>
          )}
          {projectActivity.slice(0, 6).map((a) => (
            <div
              key={a.id}
              className="px-4 py-2.5 flex items-center gap-3 text-xs"
            >
              <span
                className={cn(
                  'size-1.5 rounded-full shrink-0',
                  a.severity === 'success'
                    ? 'bg-success'
                    : a.severity === 'warning'
                      ? 'bg-warning'
                      : a.severity === 'error'
                        ? 'bg-error'
                        : a.severity === 'purple'
                          ? 'bg-purple'
                          : 'bg-info',
                )}
              />
              <span className="font-mono text-foreground-muted truncate">{a.appName}</span>
              <span className="text-foreground-subtle">·</span>
              <span className="flex-1 truncate">{a.summary}</span>
              <span className="text-foreground-subtle whitespace-nowrap">{a.ago}</span>
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}

function KPI({
  label,
  value,
  tone = 'neutral',
  delta,
}: {
  label: string;
  value: string;
  tone?: 'success' | 'warning' | 'error' | 'neutral';
  delta?: string;
}) {
  return (
    <div className="rounded-lg border border-border-muted bg-background-subtle p-4">
      <div className="text-[11px] uppercase tracking-wide text-foreground-meta font-medium">
        {label}
      </div>
      <div
        className={cn(
          'text-2xl font-semibold tabular-nums tracking-tight mt-2',
          tone === 'success' && 'text-success',
          tone === 'warning' && 'text-warning',
          tone === 'error' && 'text-error',
        )}
      >
        {value}
      </div>
      {delta && (
        <div className="text-[11px] text-foreground-subtle font-mono mt-1">{delta}</div>
      )}
    </div>
  );
}
