import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Sparkles, ArrowUpRight, Check, AlertTriangle, AlertOctagon, Clock } from 'lucide-react';
import {
  apps,
  getSOPById,
  getFlagsForSOP,
  getEvalReport,
  getSubmissionByAppId,
  getProjectById,
  projectAppMap,
  personas,
  submissions,
  decidedSubmissions,
  coReviewerPersona,
  type ApprovalDecision,
} from '@/lib/mock-data';
import { DecisionButtons } from '@/components/queue/DecisionButtons';
import { Footer } from '@/components/shell/Footer';
import { cn } from '@/lib/utils';

interface PageProps {
  params: Promise<{ appId: string }>;
}

export function generateStaticParams() {
  return [...submissions, ...decidedSubmissions].map((s) => ({ appId: s.appId }));
}

const decisionStyle: Record<ApprovalDecision, { icon: typeof Check; cls: string; label: string }> = {
  approved: { icon: Check, cls: 'text-success', label: 'Approved' },
  rejected: { icon: AlertOctagon, cls: 'text-error', label: 'Rejected' },
  changes_requested: { icon: AlertTriangle, cls: 'text-warning', label: 'Changes requested' },
  pending: { icon: Clock, cls: 'text-foreground-muted', label: 'Pending' },
};

export default async function ReviewerDetailPage({ params }: PageProps) {
  const { appId } = await params;
  const submission = getSubmissionByAppId(appId);
  const app = apps.find((a) => a.id === appId);
  if (!submission || !app) notFound();

  const sop = getSOPById(app.sopId);
  const flags = sop ? getFlagsForSOP(sop.id) : [];
  const report = getEvalReport(app.id);
  const project = getProjectById(projectAppMap[app.id]);
  const submitter = personas.processOwner;
  const isDecided =
    submission.status === 'approved' ||
    submission.status === 'changes_requested' ||
    submission.status === 'rejected';

  return (
    <div className="space-y-5">
      <nav className="text-xs text-foreground-muted flex items-center gap-2">
        <Link href="/queue" className="hover:text-foreground transition-colors">
          Queue
        </Link>
        <span className="text-foreground-subtle">/</span>
        <span className="text-foreground font-mono">{submission.appName}</span>
      </nav>

      <header className="flex items-end justify-between gap-3 pb-4 border-b border-border-muted">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            <h1 className="text-lg font-mono tracking-tight">{submission.appName}</h1>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-background-elevated text-foreground-muted">
              v{submission.appVersion}
            </span>
          </div>
          <p className="text-[11px] text-foreground-muted font-mono mt-1.5">
            Submitted by {submitter.name} · {submission.submittedAgo} ·{' '}
            {project && (
              <Link
                href={`/projects/${project.id}`}
                className="text-foreground-muted hover:text-foreground transition-colors"
              >
                {project.name}
              </Link>
            )}
          </p>
        </div>
        {!isDecided ? (
          <DecisionButtons
            appName={submission.appName}
            hasBlocker={submission.blockerFlags > 0}
            isCoReviewer={submission.status === 'pending_co_reviewer'}
          />
        ) : (
          <div className="text-xs text-foreground-muted">
            Decision recorded · {submission.reviewers.find((r) => r.atAgo)?.atAgo}
          </div>
        )}
      </header>

      {/* Structured summary */}
      <section className="rounded-lg border border-border-muted bg-background-subtle p-5">
        <h2 className="text-sm font-semibold mb-3">Reviewer summary</h2>
        <dl className="grid grid-cols-1 md:grid-cols-[max-content_1fr] gap-x-4 gap-y-2.5 text-xs">
          <Dt>Purpose</Dt>
          <Dd>{app.description}</Dd>
          <Dt>Who it serves</Dt>
          <Dd>
            Members across {app.channels.join(', ')} · estimated audience 47,200
          </Dd>
          <Dt>What it knows</Dt>
          <Dd>
            {sop?.attachedKnowledge.length ?? 0} knowledge sources. Citation coverage{' '}
            {report.citationCoverage}% in last evaluation.
          </Dd>
          <Dt>What it won&apos;t do</Dt>
          <Dd>
            {sop?.attachedGuardrails.length ?? 0} guardrails active (baseline + custom). All
            non-disable-able guardrails verified.
          </Dd>
          <Dt>What it can touch</Dt>
          <Dd>Read account data; write dispute / hardship / fraud cases as applicable.</Dd>
          <Dt>What it remembers</Dt>
          <Dd>Session memory only.</Dd>
          <Dt>SOP flags addressed</Dt>
          <Dd>
            {submission.blockerFlags === 0 ? '0' : submission.blockerFlags} Blockers ·{' '}
            {submission.warningFlags} Warnings · {flags.filter((f) => f.acknowledged).length}{' '}
            acknowledged
          </Dd>
          <Dt>Helper actions taken</Dt>
          <Dd>
            {submission.helperEdits.length} Helper-driven edits (
            {submission.helperEdits.filter((e) => e.action === 'Confirmed').length} confirmed,{' '}
            {submission.helperEdits.filter((e) => e.action === 'Skipped').length} skipped)
          </Dd>
        </dl>

        {submission.noteToReviewers && (
          <div className="mt-4 rounded-md bg-background-muted/40 border border-border-muted p-3">
            <div className="text-[10px] uppercase tracking-wide text-foreground-meta font-medium mb-1">
              Note from Process Owner
            </div>
            <p className="text-xs text-foreground leading-relaxed">{submission.noteToReviewers}</p>
          </div>
        )}
      </section>

      {/* Helper edits provenance */}
      {submission.helperEdits.length > 0 && (
        <section className="rounded-lg border border-border-muted bg-background-subtle overflow-hidden">
          <header className="px-4 py-3 border-b border-border-muted">
            <h2 className="text-sm font-semibold flex items-center gap-1.5">
              <Sparkles className="size-3.5 text-purple" />
              Helper-driven edits
            </h2>
            <p className="text-xs text-foreground-muted mt-0.5">
              Changes the Helper proposed; the Process Owner accepted or skipped each.
            </p>
          </header>
          <div className="grid grid-cols-[1fr_2fr_max-content_1fr] items-center gap-3 px-4 py-2.5 border-b border-border-muted text-[10px] uppercase tracking-wide text-foreground-meta font-medium">
            <div>When</div>
            <div>Helper proposed</div>
            <div>Owner action</div>
            <div>Result</div>
          </div>
          {submission.helperEdits.map((e) => (
            <div
              key={e.id}
              className="grid grid-cols-[1fr_2fr_max-content_1fr] items-start gap-3 px-4 py-2.5 border-b last:border-b-0 border-border-muted text-xs"
            >
              <div className="text-foreground-subtle font-mono">{e.whenAgo}</div>
              <div className="text-foreground">{e.proposed}</div>
              <div>
                <span
                  className={cn(
                    'inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded uppercase tracking-wide font-medium',
                    e.action === 'Confirmed'
                      ? 'bg-success-subtle text-success'
                      : 'bg-background-elevated text-foreground-subtle',
                  )}
                >
                  {e.action}
                </span>
              </div>
              <div className="text-foreground-muted">{e.resultingChange}</div>
            </div>
          ))}
        </section>
      )}

      {/* Evaluation embedded */}
      <section className="rounded-lg border border-border-muted bg-background-subtle p-5">
        <div className="flex items-end justify-between mb-3">
          <div>
            <h2 className="text-sm font-semibold">Evaluation</h2>
            <p className="text-xs text-foreground-muted mt-0.5">
              Run #{report.runNumber} · {report.ranAgo}
            </p>
          </div>
          <Link
            href={`/apps/${app.id}/evaluation`}
            className="text-xs text-foreground-muted hover:text-foreground transition-colors flex items-center gap-1"
          >
            Drill into report
            <ArrowUpRight className="size-3" />
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KPI label="Overall score" value={report.overallScore.toString()} />
          <KPI label="Pre-built scenarios" value={`${report.sources.preBuiltScenarios.passed}/${report.sources.preBuiltScenarios.count}`} />
          <KPI label="SOP-derived" value={`${report.sources.sopDerived.passed}/${report.sources.sopDerived.count}`} />
          <KPI label="User-defined" value={`${report.sources.userDefined.passed}/${report.sources.userDefined.count}`} />
        </div>
      </section>

      {/* Reviewer pool decisions */}
      <section className="rounded-lg border border-border-muted bg-background-subtle p-5">
        <h2 className="text-sm font-semibold mb-3">Reviewers</h2>
        <div className="space-y-2">
          {submission.reviewers.map((r) => {
            const reviewerPersona = r.personaId === 'u_rs' ? personas.reviewer : coReviewerPersona;
            const style = decisionStyle[r.decision];
            const Icon = style.icon;
            return (
              <div
                key={r.personaId}
                className="flex items-center gap-3 px-3 py-2 rounded-md bg-background-muted/40 border border-border-muted"
              >
                <span className="size-7 rounded-full bg-success-subtle text-success flex items-center justify-center text-[11px] font-medium shrink-0">
                  {reviewerPersona.initials}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-foreground">{reviewerPersona.name}</div>
                  <div className="text-[11px] text-foreground-subtle">{reviewerPersona.role}</div>
                </div>
                <span className={cn('inline-flex items-center gap-1 text-[11px] font-medium', style.cls)}>
                  <Icon className="size-3" />
                  {style.label}
                  {r.atAgo && (
                    <span className="text-foreground-subtle font-mono ml-1">· {r.atAgo}</span>
                  )}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      <Footer />
    </div>
  );
}

function Dt({ children }: { children: React.ReactNode }) {
  return (
    <dt className="text-[10px] uppercase tracking-wide text-foreground-meta font-medium pt-0.5">
      {children}
    </dt>
  );
}

function Dd({ children }: { children: React.ReactNode }) {
  return <dd className="text-foreground-muted leading-relaxed">{children}</dd>;
}

function KPI({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border-muted bg-background-muted/40 p-3">
      <div className="text-[10px] uppercase tracking-wide text-foreground-meta font-medium">
        {label}
      </div>
      <div className="text-xl font-semibold tabular-nums tracking-tight mt-1 font-mono">{value}</div>
    </div>
  );
}
