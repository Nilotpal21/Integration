'use client';

import { useState } from 'react';
import { ArrowUpRight, RefreshCw, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { EvalCategoryBrief } from '@/lib/mock-data';

interface Props {
  appId: string;
  score: number;
  delta: number;
  trend: 'up' | 'flat' | 'down';
  categories: EvalCategoryBrief[];
}

export function EvalCard({ appId, score, delta, trend, categories }: Props) {
  const [running, setRunning] = useState(false);
  const [displayScore, setDisplayScore] = useState(score);

  const handleRerun = () => {
    if (running) return;
    setRunning(true);
    setTimeout(() => {
      setDisplayScore((s) => Math.min(100, s + 1));
      setRunning(false);
    }, 2500);
  };

  const trendCls =
    trend === 'up' ? 'text-success' : trend === 'down' ? 'text-error' : 'text-foreground-meta';
  const TrendIco = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;

  return (
    <section className="rounded-lg border border-border-muted bg-background-subtle p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold">Evaluation</h3>
          <p className="text-[11px] text-foreground-muted mt-0.5">
            Run #14 · 14 min ago
          </p>
        </div>
        <button
          type="button"
          onClick={handleRerun}
          disabled={running}
          className="size-7 rounded-md hover:bg-background-elevated text-foreground-muted hover:text-foreground transition-colors flex items-center justify-center disabled:cursor-not-allowed"
          aria-label="Re-run evaluation"
          title="Re-run evaluation"
        >
          <RefreshCw className={cn('size-3.5', running && 'animate-spin')} />
        </button>
      </div>

      <div className="flex items-end gap-2 mb-3">
        <div className="text-4xl font-semibold tabular-nums tracking-tight font-mono">
          {displayScore}
        </div>
        <div
          className={cn(
            'flex items-center gap-1 text-[11px] font-medium mb-1.5 tabular-nums',
            trendCls,
          )}
        >
          <TrendIco className="size-3" />
          {delta >= 0 ? '+' : ''}
          {delta.toFixed(1)}
        </div>
      </div>

      <div className="space-y-2 mb-4">
        {categories.slice(0, 6).map((c) => (
          <div key={c.name}>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-foreground-muted truncate pr-2">{c.name}</span>
              <span className="font-mono tabular-nums text-foreground">{c.score}</span>
            </div>
            <div className="mt-1 h-0.5 rounded-full bg-background-muted overflow-hidden">
              <div
                className={cn(
                  'h-full',
                  c.score >= 90 ? 'bg-success/70' : c.score >= 75 ? 'bg-warning/70' : 'bg-error/70',
                )}
                style={{ width: `${c.score}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <Link
        href={`/apps/${appId}/evaluation`}
        className="text-xs text-foreground-muted hover:text-foreground transition-colors flex items-center gap-1"
      >
        Open full report
        <ArrowUpRight className="size-3" />
      </Link>
    </section>
  );
}
