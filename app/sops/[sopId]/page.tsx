import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowRight,
  ArrowUpRight,
  FileText,
  Sparkles,
  AlertOctagon,
} from 'lucide-react';
import {
  getSOPById,
  getFlagsForSOP,
  apps as appsList,
  sops,
  projectSOPMap,
  getProjectById,
} from '@/lib/mock-data';
import { AttachedComponentsGrid } from '@/components/sops/AttachedComponentsGrid';
import { QualityCheckFlags } from '@/components/sops/QualityCheckFlags';
import { Footer } from '@/components/shell/Footer';

interface PageProps {
  params: Promise<{ sopId: string }>;
}

export function generateStaticParams() {
  return sops.map((s) => ({ sopId: s.id }));
}

export default async function SOPDetailPage({ params }: PageProps) {
  const { sopId } = await params;
  const sop = getSOPById(sopId);
  if (!sop) notFound();

  const flags = getFlagsForSOP(sop.id);
  const app = appsList.find((a) => a.id === sop.appsGenerated[0]);
  const hasBlocker = sop.blockerFlags > 0;
  const project = getProjectById(projectSOPMap[sop.id]);

  return (
    <div className="space-y-6">
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
        <Link href="/sops" className="hover:text-foreground transition-colors">
          SOPs
        </Link>
        <span className="text-foreground-subtle">/</span>
        <span className="text-foreground">{sop.name}</span>
      </nav>

      {hasBlocker && (
        <div className="rounded-lg border border-error/30 bg-error-subtle/60 px-4 py-3 flex items-center gap-2.5">
          <AlertOctagon className="size-4 text-error shrink-0" />
          <p className="text-xs text-foreground">
            <span className="text-error font-medium">
              {sop.blockerFlags} Blocker{sop.blockerFlags > 1 ? 's' : ''} must be resolved
            </span>{' '}
            before opening Review Studio.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-6">
        {/* Left — SOP card */}
        <section className="rounded-lg border border-border bg-background-subtle p-5">
          <div className="flex items-start gap-3 mb-4">
            <div className="size-10 rounded-md bg-background-elevated border border-border-muted flex items-center justify-center shrink-0">
              <FileText className="size-5 text-foreground-muted" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold tracking-tight">{sop.name}</div>
              <div className="text-[11px] text-foreground-subtle font-mono mt-0.5 truncate">
                {sop.filename}
              </div>
            </div>
          </div>

          <dl className="space-y-2 mb-4 text-xs">
            <Row label="Pages" value={`${sop.pages}`} />
            <Row label="Version" value={`v${sop.version}`} />
            <Row label="Uploaded" value={sop.uploadedAt} />
            <Row
              label="Detected"
              value={`${sop.stats.intentsDetected} intents · ${sop.stats.tasksDetected} tasks · ${sop.stats.escalationsDetected} escalations`}
            />
          </dl>

          <div className="flex items-center gap-2 mb-4">
            <FlagBadge color="error" count={sop.blockerFlags} label="Blocker" />
            <FlagBadge color="warning" count={sop.warningFlags} label="Warning" />
            <FlagBadge color="info" count={sop.suggestionFlags} label="Suggestion" />
          </div>

          <button
            type="button"
            className="text-[11px] text-foreground-muted hover:text-foreground transition-colors flex items-center gap-1"
          >
            View SOP <ArrowUpRight className="size-3" />
          </button>
        </section>

        {/* Right — what we did */}
        <section className="rounded-lg border border-border bg-background-subtle p-5 flex flex-col">
          <div className="text-[11px] uppercase tracking-wide text-foreground-meta font-medium mb-2">
            What we did
          </div>
          <h2 className="text-xl font-semibold tracking-tight">
            We generated{' '}
            <span className="font-mono text-foreground">
              {app ? app.name : '—'}
            </span>
            .
          </h2>
          {app && (
            <p className="text-sm text-foreground-muted mt-3 leading-relaxed">
              {app.description}
            </p>
          )}

          <div className="flex items-center gap-2 mt-auto pt-5">
            {hasBlocker || !app ? (
              <span
                aria-disabled
                title="Resolve all Blocker flags before opening Review Studio."
                className="h-9 px-4 rounded-md text-sm font-medium flex items-center gap-1.5 bg-background-elevated text-foreground-subtle cursor-not-allowed"
              >
                Open Review Studio <ArrowRight className="size-3.5" />
              </span>
            ) : (
              <Link
                href={`/apps/${app.id}`}
                className="h-9 px-4 rounded-md text-sm font-medium flex items-center gap-1.5 bg-accent text-accent-foreground hover:bg-accent-muted transition-colors"
              >
                Open Review Studio <ArrowRight className="size-3.5" />
              </Link>
            )}
            <button
              type="button"
              className="h-9 px-3 rounded-md text-sm font-medium bg-purple/15 text-purple hover:bg-purple/20 transition-colors flex items-center gap-1.5"
            >
              <Sparkles className="size-3.5" />
              Show me how this maps to my SOP
            </button>
          </div>
        </section>
      </div>

      <AttachedComponentsGrid sop={sop} />

      <QualityCheckFlags flags={flags} />

      <div className="rounded-lg border border-purple/20 bg-purple/5 p-4 flex flex-col md:flex-row md:items-center gap-3 md:gap-5">
        <div className="size-9 rounded-md bg-purple/20 flex items-center justify-center text-purple shrink-0">
          <Sparkles className="size-4" />
        </div>
        <p className="flex-1 text-xs text-foreground leading-relaxed">
          Want me to walk you through each section? I can explain why I attached each piece of
          knowledge, and how the escalation rules I derived from your SOP map to actions.
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="h-8 px-3 rounded-md text-xs font-medium bg-purple text-purple-foreground hover:bg-purple/85 transition-colors"
          >
            Yes, walk me through it
          </button>
          <button
            type="button"
            className="h-8 px-3 rounded-md text-xs font-medium text-foreground-muted hover:text-foreground hover:bg-background-elevated transition-colors"
          >
            Not now
          </button>
        </div>
      </div>

      <Footer />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-[11px] uppercase tracking-wide text-foreground-meta font-medium">
        {label}
      </dt>
      <dd className="text-xs text-foreground text-right">{value}</dd>
    </div>
  );
}

function FlagBadge({
  color,
  count,
  label,
}: {
  color: 'error' | 'warning' | 'info';
  count: number;
  label: string;
}) {
  const colorMap = {
    error: { bg: 'bg-error-subtle', text: 'text-error' },
    warning: { bg: 'bg-warning-subtle', text: 'text-warning' },
    info: { bg: 'bg-info-subtle', text: 'text-info' },
  };
  const c = colorMap[color];
  const muted = count === 0;
  return (
    <div
      className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-mono tabular-nums ${
        muted ? 'bg-background-elevated text-foreground-subtle' : `${c.bg} ${c.text}`
      }`}
      title={label}
    >
      <span>{count}</span>
      <span className="font-sans">{label}{count !== 1 ? 's' : ''}</span>
    </div>
  );
}
