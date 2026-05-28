import Link from 'next/link';
import { Plus, FolderKanban, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { projects, type Project } from '@/lib/mock-data';
import { Footer } from '@/components/shell/Footer';
import { cn } from '@/lib/utils';

export default function ProjectsPage() {
  const active = projects.filter((p) => p.status === 'active');

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Projects</h1>
          <p className="text-xs text-foreground-muted mt-1">
            Business-area groupings inside Cornerstone FCU. Each project has its own SOPs, apps,
            reviewers, knowledge, and KPIs.
          </p>
        </div>
        <button
          type="button"
          className="h-8 px-3 rounded-md text-xs font-medium bg-accent text-accent-foreground hover:bg-accent-muted transition-colors flex items-center gap-1.5"
        >
          <Plus className="size-3.5" />
          New project
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {active.map((p) => (
          <ProjectCard key={p.id} project={p} />
        ))}
      </div>

      <section className="rounded-lg border border-border-muted bg-background-subtle overflow-hidden">
        <div className="px-4 py-3 border-b border-border-muted">
          <h2 className="text-sm font-semibold">Cross-project comparison</h2>
          <p className="text-xs text-foreground-muted mt-0.5">
            Visible to CU Admin. Sort by any column.
          </p>
        </div>
        <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr] items-center px-4 py-2.5 border-b border-border-muted text-[10px] uppercase tracking-wide text-foreground-meta font-medium gap-3">
          <div>Project</div>
          <div className="text-right">Apps</div>
          <div className="text-right">Conv · 24h</div>
          <div className="text-right">Avg eval</div>
          <div className="text-right">Cost · MTD</div>
          <div className="text-right">Reviewers</div>
        </div>
        {active.map((p) => {
          const costPct = Math.round((p.mtdSpend / p.monthlyBudget) * 100);
          return (
            <div
              key={p.id}
              className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr] items-center px-4 py-3 border-b last:border-b-0 border-border-muted text-xs gap-3 hover:bg-background-muted/40 transition-colors"
            >
              <Link
                href={`/projects/${p.id}`}
                className="font-medium hover:text-foreground transition-colors"
              >
                {p.name}
              </Link>
              <div className="text-right tabular-nums">{p.appCount}</div>
              <div className="text-right tabular-nums">{p.conversations24h.toLocaleString()}</div>
              <div className={cn('text-right tabular-nums font-medium', scoreText(p.avgEvaluationScore))}>
                {p.avgEvaluationScore}
              </div>
              <div className="text-right tabular-nums">
                <span className={costTextClass(costPct)}>{costPct}%</span>
              </div>
              <div className="text-right tabular-nums">{p.reviewerCount}</div>
            </div>
          );
        })}
      </section>

      <Footer />
    </div>
  );
}

function ProjectCard({ project: p }: { project: Project }) {
  const costPct = Math.round((p.mtdSpend / p.monthlyBudget) * 100);

  return (
    <Link
      href={`/projects/${p.id}`}
      className="group rounded-lg border border-border-muted bg-background-subtle hover:border-border hover:bg-background-muted/40 transition-colors p-4 flex flex-col"
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="size-7 rounded-md bg-background-elevated border border-border-muted flex items-center justify-center shrink-0">
            <FolderKanban className="size-3.5 text-foreground-muted group-hover:text-foreground transition-colors" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-medium truncate">{p.name}</div>
            <div className="text-[10px] uppercase tracking-wide text-foreground-meta">
              {p.tag}
            </div>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded uppercase tracking-wide font-medium bg-success-subtle text-success">
          <span className="size-1.5 rounded-full bg-success" />
          Active
        </span>
      </div>

      <p className="text-xs text-foreground-muted leading-relaxed line-clamp-2 mb-4 min-h-[2.2rem]">
        {p.description}
      </p>

      <div className="grid grid-cols-4 gap-2 pt-3 border-t border-border-muted">
        <Stat label="Apps" value={p.appCount.toString()} />
        <Stat label="SOPs" value={p.sopCount.toString()} />
        <Stat label="Reviewers" value={p.reviewerCount.toString()} />
        <Stat
          label="Score"
          value={
            <span className={cn('inline-flex items-center gap-0.5', scoreText(p.avgEvaluationScore))}>
              {p.avgEvaluationScore}
              <TrendIndicator score={p.avgEvaluationScore} />
            </span>
          }
        />
      </div>

      <div className="mt-3">
        <div className="flex items-center justify-between text-[10px] text-foreground-meta">
          <span className="uppercase tracking-wide">Budget · MTD</span>
          <span className="tabular-nums">{costPct}%</span>
        </div>
        <div className="mt-1 h-1 rounded-full bg-background-muted overflow-hidden">
          <div
            className={cn('h-full', costBarClass(costPct))}
            style={{ width: `${Math.min(100, costPct)}%` }}
          />
        </div>
      </div>
    </Link>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wide text-foreground-meta">{label}</div>
      <div className="text-xs font-medium tabular-nums mt-0.5">{value}</div>
    </div>
  );
}

function TrendIndicator({ score }: { score: number }) {
  if (score >= 90) return <TrendingUp className="size-3 text-success" />;
  if (score < 75) return <TrendingDown className="size-3 text-error" />;
  return <Minus className="size-3 text-foreground-meta" />;
}

function scoreText(score: number): string {
  if (score >= 90) return 'text-success';
  if (score >= 75) return 'text-warning';
  return 'text-error';
}

function costTextClass(pct: number): string {
  if (pct >= 95) return 'text-error';
  if (pct >= 80) return 'text-warning';
  return 'text-foreground';
}

function costBarClass(pct: number): string {
  if (pct >= 95) return 'bg-error';
  if (pct >= 80) return 'bg-warning';
  return 'bg-success/80';
}
