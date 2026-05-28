import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  Bot,
  CheckCircle2,
  AlertOctagon,
  AlertTriangle,
  Lightbulb,
  Plus,
  MessageSquare,
  Phone,
  Mail,
  Smartphone,
  Database,
  Wrench,
  ArrowUpRight,
  type LucideIcon,
} from 'lucide-react';
import {
  apps,
  getSOPById,
  getSubAgentById,
  getFlagsForSOP,
  getReviewStudioContext,
  projectAppMap,
  getProjectById,
  type Channel,
} from '@/lib/mock-data';
import { EvalCard } from '@/components/review-studio/EvalCard';
import { SandboxPreview } from '@/components/review-studio/SandboxPreview';
import { HelperCard } from '@/components/review-studio/HelperCard';
import { Panel } from '@/components/review-studio/Panel';
import { SubmitForApprovalButton } from '@/components/review-studio/SubmitForApprovalButton';
import {
  AppHeaderActions,
  AppStatusBadge,
  AppVersionTag,
} from '@/components/review-studio/AppHeaderActions';
import { MemoryPanel } from '@/components/review-studio/MemoryPanel';
import { AudiencePanel } from '@/components/review-studio/AudiencePanel';
import { GuardrailsPanel } from '@/components/review-studio/GuardrailsPanel';
import { AppSpec } from '@/components/apps/AppSpec';
import { Footer } from '@/components/shell/Footer';
import { cn } from '@/lib/utils';

interface PageProps {
  params: Promise<{ appId: string }>;
  searchParams: Promise<{ view?: string }>;
}

export function generateStaticParams() {
  return apps.map((a) => ({ appId: a.id }));
}

type AppView = 'studio' | 'spec';

const channelLabel: Record<Channel, { icon: LucideIcon; label: string }> = {
  digital: { icon: MessageSquare, label: 'Digital' },
  voice: { icon: Phone, label: 'Voice' },
  sms: { icon: Smartphone, label: 'SMS' },
  email: { icon: Mail, label: 'Email' },
};

export default async function ReviewStudioPage({ params, searchParams }: PageProps) {
  const { appId } = await params;
  const { view: rawView } = await searchParams;
  const view: AppView = rawView === 'spec' ? 'spec' : 'studio';
  const app = apps.find((a) => a.id === appId);
  if (!app) notFound();

  const sop = getSOPById(app.sopId);
  const flags = sop ? getFlagsForSOP(sop.id) : [];
  const context = getReviewStudioContext(app.id);
  const subAgents = app.subAgents
    .map((id) => getSubAgentById(id))
    .filter((sa): sa is NonNullable<typeof sa> => Boolean(sa));
  const project = getProjectById(projectAppMap[app.id]);

  const blockers = flags.filter((f) => f.severity === 'blocker' && !f.acknowledged).length;
  const warnings = flags.filter((f) => f.severity === 'warning' && !f.acknowledged).length;
  const suggestions = flags.filter((f) => f.severity === 'suggestion' && !f.acknowledged).length;
  const canSubmit = blockers === 0;

  return (
    <div className="space-y-5">
      <nav className="text-xs text-foreground-muted flex items-center gap-2">
        {project && (
          <>
            <Link
              href={`/projects/${project.id}`}
              className="hover:text-foreground transition-colors"
            >
              {project.name}
            </Link>
            <span className="text-foreground-subtle">/</span>
          </>
        )}
        <Link href="/apps" className="hover:text-foreground transition-colors">
          Apps
        </Link>
        <span className="text-foreground-subtle">/</span>
        <span className="text-foreground font-mono">{app.name}</span>
      </nav>

      {/* App header bar */}
      <header className="flex items-end justify-between gap-3 pb-4 border-b border-border-muted">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-md bg-background-elevated border border-border-muted flex items-center justify-center shrink-0">
              <Bot className="size-4 text-foreground-muted" />
            </div>
            <h1 className="text-lg font-mono tracking-tight">{app.name}</h1>
            <AppVersionTag appId={app.id} fallbackVersion={app.deployedVersion} />
            <AppStatusBadge appId={app.id} fallback={app.status} />
          </div>
          <p className="text-[11px] text-foreground-muted font-mono mt-1.5">
            from SOP: {app.sopFilename} · last evaluated {app.lastEvaluatedAt}
          </p>
        </div>

        <AppHeaderActions
          appId={app.id}
          appName={app.name}
          sopFilename={app.sopFilename}
          evaluationScore={app.evaluationScore}
          approvalsRequired={app.approvalsRequired}
          guardrailsCount={sop?.attachedGuardrails.length ?? 0}
          knowledgeCount={sop?.attachedKnowledge.length ?? 0}
          blockers={blockers}
          warnings={warnings}
        />
      </header>

      {/* View tabs */}
      <div className="flex items-center gap-1 border-b border-border-muted -mt-2">
        {(['studio', 'spec'] as const).map((id) => {
          const label = id === 'studio' ? 'Studio' : 'Spec';
          const isActive = view === id;
          const href = id === 'studio' ? `/apps/${app.id}` : `/apps/${app.id}?view=spec`;
          return (
            <Link
              key={id}
              href={href}
              className={cn(
                'px-3 py-2 text-xs font-medium border-b-2 -mb-px transition-colors',
                isActive
                  ? 'border-foreground text-foreground'
                  : 'border-transparent text-foreground-muted hover:text-foreground',
              )}
            >
              {label}
            </Link>
          );
        })}
      </div>

      {view === 'spec' && (
        <AppSpec app={app} sop={sop} subAgents={subAgents} />
      )}

      {view === 'studio' && (
      /* Main + right rail */
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-5">
        {/* Main canvas */}
        <div className="space-y-3 min-w-0">
          {/* Panel 1: What this app does */}
          <Panel
            title="What this app does"
            subtitle="Plain-language summary that grounds the rest of the configuration."
            helperHint="Explain how this maps to my SOP"
          >
            <p className="text-sm text-foreground leading-relaxed">{app.description}</p>
            <p className="text-[11px] text-foreground-subtle font-mono mt-3">
              Sourced from §1 of {app.sopFilename}
            </p>
          </Panel>

          {/* Panel 2: Who it serves */}
          <Panel title="Who it serves" subtitle="Audience and channels the app is available on.">
            <div className="space-y-3">
              <div>
                <div className="text-[10px] uppercase tracking-wide text-foreground-meta font-medium mb-1.5">
                  Audience
                </div>
                <div className="flex items-center gap-1.5">
                  <Chip>Members</Chip>
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wide text-foreground-meta font-medium mb-1.5">
                  Channels
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {(['digital', 'voice', 'sms', 'email'] as Channel[]).map((c) => {
                    const meta = channelLabel[c];
                    const Icon = meta.icon;
                    const on = app.channels.includes(c);
                    return (
                      <span
                        key={c}
                        className={cn(
                          'inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium border',
                          on
                            ? 'bg-background-elevated text-foreground border-border'
                            : 'bg-background-muted/40 text-foreground-subtle border-border-muted',
                        )}
                      >
                        <Icon className="size-3" />
                        {meta.label}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          </Panel>

          {/* Panel 3: What it knows */}
          <Panel
            title="What it knows"
            subtitle={`${sop?.attachedKnowledge.length ?? 0} knowledge sources attached`}
            helperHint="Why did you attach these sources?"
          >
            <ul className="space-y-1.5">
              {(sop?.attachedKnowledge ?? []).map((k) => (
                <li
                  key={k}
                  className="flex items-center gap-2.5 px-2 py-1.5 rounded-md bg-background-muted/40 border border-border-muted text-xs"
                >
                  <Database className="size-3.5 text-foreground-muted shrink-0" />
                  <span className="flex-1 truncate">{k}</span>
                  <button
                    type="button"
                    className="text-[11px] text-foreground-subtle hover:text-foreground transition-colors"
                  >
                    View
                  </button>
                </li>
              ))}
            </ul>
            <button
              type="button"
              className="mt-3 h-7 px-2.5 rounded-md text-[11px] font-medium border border-border-muted text-foreground-muted hover:bg-background-elevated hover:text-foreground transition-colors flex items-center gap-1"
            >
              <Plus className="size-3" />
              Attach more from Knowledge Library
            </button>
            <p className="text-[11px] text-success mt-3">
              Citation coverage: 96% in last evaluation
            </p>
          </Panel>

          {/* Panel 4: What it won't do */}
          <Panel
            title="What it won't do"
            subtitle={`${sop?.attachedGuardrails.length ?? 0} guardrails active`}
            helperHint="Suggest a custom guardrail for this app"
          >
            <GuardrailsPanel
              appId={app.id}
              baselineGuardrails={(sop?.attachedGuardrails ?? []).slice(0, 6)}
            />
          </Panel>

          {/* Panel 5: What it can touch */}
          <Panel
            title="What it can touch"
            subtitle="Tools and connectors this app can use."
            helperHint="What data does this connector access?"
          >
            <ul className="space-y-1.5">
              {subAgents.flatMap((sa) => sa?.toolsBound ?? []).slice(0, 5).map((t, i) => {
                const moves = t.includes('payments');
                return (
                  <li
                    key={`${t}-${i}`}
                    className="flex items-center gap-2.5 px-2 py-1.5 rounded-md bg-background-muted/40 border border-border-muted text-xs"
                  >
                    <Wrench className="size-3.5 text-foreground-muted shrink-0" />
                    <span className="flex-1 font-mono truncate">{t}</span>
                    {moves && (
                      <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-warning-subtle text-warning uppercase tracking-wide font-medium">
                        <AlertTriangle className="size-2.5" />
                        Money-moving
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </Panel>

          {/* Panel 6: What it remembers */}
          <Panel
            title="What it remembers"
            subtitle="Memory mode applied to this app."
            helperHint="Why is session memory the default here?"
          >
            <MemoryPanel appId={app.id} />
          </Panel>

          {/* Panel 7: SOP issues */}
          <Panel
            title="SOP issues to address"
            subtitle={`${blockers} Blocker${blockers === 1 ? '' : 's'} · ${warnings} Warning${warnings === 1 ? '' : 's'} · ${suggestions} Suggestion${suggestions === 1 ? '' : 's'}`}
            helperHint="Walk me through each flag"
          >
            <ul className="space-y-2">
              {flags.slice(0, 4).map((f) => {
                const meta =
                  f.severity === 'blocker'
                    ? { icon: AlertOctagon, cls: 'text-error', label: 'Blocker' }
                    : f.severity === 'warning'
                      ? { icon: AlertTriangle, cls: 'text-warning', label: 'Warning' }
                      : { icon: Lightbulb, cls: 'text-info', label: 'Suggestion' };
                const Icon = meta.icon;
                return (
                  <li
                    key={f.id}
                    className="flex items-start gap-2.5 px-3 py-2 rounded-md bg-background-muted/40 border border-border-muted text-xs"
                  >
                    <Icon className={cn('size-3.5 shrink-0 mt-0.5', meta.cls)} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className={cn('text-[10px] uppercase tracking-wide font-medium', meta.cls)}>
                          {meta.label}
                        </span>
                        {f.acknowledged && (
                          <span className="text-[10px] uppercase tracking-wide text-foreground-subtle">
                            · Acknowledged
                          </span>
                        )}
                      </div>
                      <div className="text-foreground mt-1">{f.title}</div>
                    </div>
                  </li>
                );
              })}
              {flags.length === 0 && (
                <li className="text-[11px] text-foreground-muted text-center py-2">
                  No flags from SOP Quality Check.
                </li>
              )}
            </ul>
            <Link
              href={`/sops/${app.sopId}`}
              className="mt-3 text-[11px] text-foreground-muted hover:text-foreground transition-colors flex items-center gap-1"
            >
              View all flags in SOP
              <ArrowUpRight className="size-3" />
            </Link>
          </Panel>

          {/* Panel 8: Channels & deployment target */}
          <Panel title="Channels & deployment target" subtitle="Where and to whom this app will run.">
            <div className="space-y-3">
              <div>
                <div className="text-[10px] uppercase tracking-wide text-foreground-meta font-medium mb-1.5">
                  Channels
                </div>
                <div className="flex items-center gap-1.5">
                  {app.channels.map((c) => {
                    const Icon = channelLabel[c].icon;
                    return (
                      <span
                        key={c}
                        className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded bg-background-muted/40 border border-border-muted"
                      >
                        <Icon className="size-3 text-foreground-muted" />
                        {channelLabel[c].label}
                      </span>
                    );
                  })}
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wide text-foreground-meta font-medium mb-1.5">
                  Audience
                </div>
                <AudiencePanel appId={app.id} />
              </div>
            </div>
          </Panel>

          {/* Panel 9: Submission summary */}
          <section className="rounded-lg border border-border bg-background-muted/40 p-5">
            <h2 className="text-sm font-semibold mb-3">Pre-flight checklist</h2>
            <ul className="space-y-1.5 text-xs">
              <CheckItem pass={true}>
                {sop?.attachedGuardrails.length ?? 0} baseline guardrails active
              </CheckItem>
              <CheckItem pass={true}>
                {sop?.attachedKnowledge.length ?? 0} knowledge sources attached (96% citation
                coverage)
              </CheckItem>
              <CheckItem pass={blockers === 0}>
                {blockers === 0
                  ? '0 Blocker flags'
                  : `${blockers} Blocker flag${blockers > 1 ? 's' : ''} unresolved`}
              </CheckItem>
              <CheckItem pass={warnings === 0} warn={warnings > 0}>
                {warnings === 0
                  ? '0 Warning flags unacknowledged'
                  : `${warnings} Warning flag${warnings > 1 ? 's' : ''} not yet acknowledged`}
              </CheckItem>
              <CheckItem pass={true}>
                Evaluation Score: {app.evaluationScore} (well above pilot baseline of 80)
              </CheckItem>
              <CheckItem pass={true}>All required approvers identified ({app.approvalsRequired} of {app.approvalsRequired})</CheckItem>
            </ul>
            <div className="mt-4 flex items-center gap-2">
              <SubmitForApprovalButton
                appName={app.name}
                appId={app.id}
                sopReason={`Submission for ${app.sopFilename}, evaluation score ${app.evaluationScore}.`}
                guardrailsCount={sop?.attachedGuardrails.length ?? 0}
                knowledgeCount={sop?.attachedKnowledge.length ?? 0}
                blockers={blockers}
                warnings={warnings}
                evaluationScore={app.evaluationScore}
                approvalsRequired={app.approvalsRequired}
                canSubmit={canSubmit}
              />
            </div>
          </section>
        </div>

        {/* Right rail */}
        <aside className="space-y-3 min-w-0">
          <EvalCard
            appId={app.id}
            score={app.evaluationScore}
            delta={app.evaluationDelta}
            trend={app.evaluationTrend}
            categories={context.evalCategories}
          />
          <SandboxPreview script={context.sandboxScript} />
          <HelperCard suggestions={context.helperSuggestions} appName={app.name} />
        </aside>
      </div>
      )}

      <Footer />
    </div>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-background-elevated border border-border-muted">
      {children}
    </span>
  );
}

function CheckItem({
  pass,
  warn = false,
  children,
}: {
  pass: boolean;
  warn?: boolean;
  children: React.ReactNode;
}) {
  return (
    <li className="flex items-start gap-2">
      {pass ? (
        <CheckCircle2 className="size-3.5 text-success shrink-0 mt-0.5" />
      ) : warn ? (
        <AlertTriangle className="size-3.5 text-warning shrink-0 mt-0.5" />
      ) : (
        <AlertOctagon className="size-3.5 text-error shrink-0 mt-0.5" />
      )}
      <span className={cn(pass ? 'text-foreground' : warn ? 'text-warning' : 'text-error')}>
        {children}
      </span>
    </li>
  );
}
