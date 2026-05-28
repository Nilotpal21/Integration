'use client';

import { useMemo, useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Bot,
  BookOpen,
  Bug,
  Copy,
  Cpu,
  Download,
  Paperclip,
  ShieldCheck,
  Sparkles,
  Wifi,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import { subAgents, type App, type SubAgent } from '@/lib/mock-data';
import { cn } from '@/lib/utils';

type Scope =
  | { kind: 'app'; app: App }
  | { kind: 'project'; projectId: string; apps: App[] };

interface AgentChatProps {
  scope: Scope;
  agentName: string;
  backHref: string;
  backLabel?: string;
}

interface TraceEvent {
  kind: 'route' | 'tool' | 'knowledge' | 'guardrail' | 'handoff';
  label: string;
  detail?: string;
}

interface ChatTurn {
  id: string;
  role: 'user' | 'agent';
  text: string;
  appName?: string;
  subAgentName?: string;
  trace?: TraceEvent[];
  citations?: string[];
}

const traceIcon: Record<TraceEvent['kind'], LucideIcon> = {
  route: ArrowRight,
  tool: Wrench,
  knowledge: BookOpen,
  guardrail: ShieldCheck,
  handoff: Sparkles,
};

const traceTone: Record<TraceEvent['kind'], string> = {
  route: 'text-info',
  tool: 'text-foreground-muted',
  knowledge: 'text-success',
  guardrail: 'text-warning',
  handoff: 'text-purple',
};

/* ------------- Mock router ------------- */

const intentMap: { keywords: string[]; subAgentId: string }[] = [
  { keywords: ['login', 'auth', 'identity', 'verify', 'mfa', 'kyc'], subAgentId: 'sa_member_auth' },
  { keywords: ['balance', 'statement', 'account', 'transaction'], subAgentId: 'sa_account_services' },
  { keywords: ['hardship', 'collection', 'payment plan', 'promise', 'past due', 'late'], subAgentId: 'sa_collections' },
  { keywords: ['budget', 'save', 'savings', 'wellness', 'literacy'], subAgentId: 'sa_financial_wellness' },
  { keywords: ['loan', 'apply', 'rate', 'defer', 'eligibility'], subAgentId: 'sa_loans' },
  { keywords: ['reg e', 'reg d', 'glba', 'disclosure', 'compliance', 'ffiec'], subAgentId: 'sa_compliance' },
  { keywords: ['dispute', 'fraud', 'unauthorized', 'chargeback'], subAgentId: 'sa_compliance' },
  { keywords: ['fee', 'card', 'replace card', 'pin', 'block'], subAgentId: 'sa_account_services' },
];

function pickAppForMessage(message: string, candidates: App[]): App {
  const m = message.toLowerCase();
  const scored = candidates.map((a) => {
    const text = `${a.name} ${a.description}`.toLowerCase();
    let score = 0;
    for (const word of m.split(/\W+/)) {
      if (word.length < 3) continue;
      if (text.includes(word)) score += 1;
    }
    return { a, score };
  });
  scored.sort((x, y) => y.score - x.score);
  return scored[0]?.a ?? candidates[0];
}

function pickSubAgents(message: string, allowed: SubAgent[]): SubAgent[] {
  const m = message.toLowerCase();
  const matches = new Set<string>();
  for (const { keywords, subAgentId } of intentMap) {
    if (keywords.some((k) => m.includes(k))) {
      if (allowed.find((a) => a.id === subAgentId)) matches.add(subAgentId);
    }
  }
  if (/balance|account|statement|loan|payment|dispute|card/.test(m)) {
    const auth = allowed.find((a) => a.id === 'sa_member_auth');
    if (auth) matches.add(auth.id);
  }
  if (matches.size === 0) return [allowed[0]].filter(Boolean);
  return allowed.filter((a) => matches.has(a.id));
}

function craftReply(app: App, sas: SubAgent[], message: string): { text: string; citations: string[]; trace: TraceEvent[] } {
  const primary = sas[sas.length - 1] ?? sas[0];
  const trace: TraceEvent[] = [];

  trace.push({
    kind: 'route',
    label: `Routed to ${app.name}`,
    detail: `Matched against the app's SOP scope.`,
  });

  for (let i = 0; i < sas.length; i++) {
    const sa = sas[i];
    trace.push({
      kind: i === 0 ? 'route' : 'handoff',
      label: i === 0 ? `Sub-agent: ${sa.name}` : `Hand-off → ${sa.name}`,
      detail: sa.description,
    });
    for (const tool of sa.toolsBound.slice(0, 2)) {
      trace.push({ kind: 'tool', label: `Tool call: ${tool}` });
    }
    for (const k of sa.knowledgeAttached.slice(0, 1)) {
      trace.push({ kind: 'knowledge', label: `Knowledge: ${k}` });
    }
    for (const g of sa.guardrailsApplied.slice(0, 1)) {
      trace.push({ kind: 'guardrail', label: `Guardrail: ${g}` });
    }
  }

  const citations = Array.from(new Set(sas.flatMap((s) => s.knowledgeAttached))).slice(0, 3);
  const intro =
    sas.length > 1
      ? `Working with ${sas.map((s) => s.name).join(', ')}.`
      : `From ${primary?.name ?? 'the assigned sub-agent'}:`;

  const m = message.toLowerCase();
  const body = (() => {
    if (/balance|statement|transaction/.test(m)) {
      return `Your verified balance is $4,128.42 (as of last sync). I can pull a statement, set up an alert, or walk you through Reg E if a transaction looks unfamiliar.`;
    }
    if (/dispute|unauthorized|chargeback/.test(m)) {
      return `I can open a Reg E case. To proceed I'll need:\n\n1. **Merchant name** as it appears on the statement\n2. **Transaction date**\n3. Whether the **card is in your possession**\n\nThe case is filed in the core within 1 business day and I'll send you a confirmation.`;
    }
    if (/loan|apply|rate|defer/.test(m)) {
      return `I can run a pre-eligibility check against your member profile. I won't quote final rates here — those come from the LOS after a soft pull.`;
    }
    if (/hardship|past due|late|promise/.test(m)) {
      return `I'll route you into the hardship workflow. Based on your account, you may be eligible for a 60-day deferment with no late fee. Want me to draft the request?`;
    }
    if (/login|auth|verify|mfa/.test(m)) {
      return `Identity check passed (multi-factor). Anything you ask next will be answered from your verified member context.`;
    }
    if (/fee|card|pin/.test(m)) {
      return `Card servicing options available: replace card, change PIN, temporarily block. I'll only complete an action after explicit confirmation.`;
    }
    return `I can help with that within ${app.name}'s SOP. Try asking about account servicing, a dispute, a loan question, or financial wellness — toggle Debug to see the orchestration trace.`;
  })();

  return { text: `${intro}\n\n${body}`, citations, trace };
}

/* ------------- Component ------------- */

const STARTERS = [
  'What can you help with?',
  "What's my balance?",
  "I see a charge I didn't make.",
  'Am I eligible for a hardship deferment?',
];

function shortSessionId(): string {
  // Stable-ish per mount; not cryptographic.
  let s = '';
  const chars = 'abcdef0123456789';
  for (let i = 0; i < 32; i++) {
    s += chars[Math.floor(Math.random() * chars.length)];
    if (i === 7 || i === 11 || i === 15 || i === 19) s += '-';
  }
  return `s-${s}`;
}

function approxTokens(text: string): number {
  return Math.max(1, Math.round(text.length / 4));
}

export function AgentChat({ scope, agentName, backHref, backLabel = 'Back to Agent' }: AgentChatProps) {
  const allowedApps = scope.kind === 'app' ? [scope.app] : scope.apps;

  const allowedSubAgents = useMemo(() => {
    const ids = new Set<string>();
    for (const a of allowedApps) for (const s of a.subAgents) ids.add(s);
    return subAgents.filter((s) => ids.has(s.id));
  }, [allowedApps]);

  const toolCount = useMemo(
    () => new Set(allowedSubAgents.flatMap((s) => s.toolsBound)).size,
    [allowedSubAgents],
  );
  const routeCount = allowedSubAgents.length;

  const [turns, setTurns] = useState<ChatTurn[]>([
    {
      id: 'a_seed',
      role: 'agent',
      text: 'Hi, how can I help?',
    },
  ]);
  const [input, setInput] = useState('');
  const [pending, setPending] = useState(false);
  const [debugOpen, setDebugOpen] = useState(false);
  const [sessionId] = useState<string>(() => shortSessionId());
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [turns.length, pending]);

  function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || pending) return;
    const userTurn: ChatTurn = { id: `u_${Date.now()}`, role: 'user', text: trimmed };
    setTurns((t) => [...t, userTurn]);
    setInput('');
    setPending(true);

    setTimeout(() => {
      const app = pickAppForMessage(trimmed, allowedApps);
      const allowedForApp = subAgents.filter((s) => app.subAgents.includes(s.id));
      const picks = pickSubAgents(trimmed, allowedForApp);
      const { text: reply, citations, trace } = craftReply(app, picks, trimmed);

      const agentTurn: ChatTurn = {
        id: `a_${Date.now()}`,
        role: 'agent',
        text: reply,
        appName: app.name,
        subAgentName: picks[picks.length - 1]?.name,
        trace,
        citations,
      };
      setTurns((t) => [...t, agentTurn]);
      setPending(false);
    }, 600);
  }

  /* derived stats for the debug rail */
  const tokensIn = useMemo(
    () => turns.filter((t) => t.role === 'user').reduce((acc, t) => acc + approxTokens(t.text), 0),
    [turns],
  );
  const tokensOut = useMemo(
    () => turns.filter((t) => t.role === 'agent').reduce((acc, t) => acc + approxTokens(t.text), 0),
    [turns],
  );
  const totalTokens = tokensIn + tokensOut;
  const llmCalls = turns.filter((t) => t.role === 'agent').length;
  const traceEvents = turns.reduce((acc, t) => acc + (t.trace?.length ?? 0), 0);
  const messageCount = turns.length;
  const tracesWithEvents = turns.filter((t) => t.trace && t.trace.length > 0).length;

  const latestTrace = [...turns].reverse().find((t) => t.role === 'agent' && t.trace)?.trace;

  return (
    <div className={cn('grid gap-0 min-h-[640px]', debugOpen ? 'grid-cols-[1fr_360px]' : 'grid-cols-1')}>
      {/* Conversation column */}
      <section className="flex flex-col rounded-lg border border-border-muted bg-background-subtle overflow-hidden">
        {/* Header */}
        <header className="px-4 py-3 border-b border-border-muted flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="size-9 rounded-md bg-background-elevated border border-border-muted flex items-center justify-center shrink-0">
              <Bot className="size-4 text-foreground-muted" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-semibold tracking-tight truncate">{agentName}</h2>
              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                <Badge>{scope.kind === 'project' ? 'Supervisor' : 'Agent'}</Badge>
                <Badge>Reasoning</Badge>
                <span className="text-[11px] text-foreground-muted">
                  {toolCount} {toolCount === 1 ? 'tool' : 'tools'} · {routeCount}{' '}
                  {routeCount === 1 ? 'route' : 'routes'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <Link
              href={backHref}
              className="h-8 px-2.5 rounded-md text-xs font-medium text-foreground-muted hover:text-foreground hover:bg-background-elevated transition-colors flex items-center gap-1.5"
            >
              <ArrowLeft className="size-3.5" />
              {backLabel}
            </Link>
            <button
              type="button"
              onClick={() => toast.info('Export is disabled in this prototype.')}
              className="h-8 px-2.5 rounded-md text-xs font-medium text-foreground-muted hover:text-foreground hover:bg-background-elevated transition-colors flex items-center gap-1.5"
            >
              <Download className="size-3.5" />
              Export
            </button>
            <button
              type="button"
              onClick={() => setDebugOpen((v) => !v)}
              className={cn(
                'h-8 px-2.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5',
                debugOpen
                  ? 'bg-accent text-accent-foreground hover:bg-accent-muted'
                  : 'text-foreground-muted hover:text-foreground hover:bg-background-elevated',
              )}
              aria-pressed={debugOpen}
            >
              <Bug className="size-3.5" />
              Debug
            </button>
          </div>
        </header>

        {/* Conversation */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {turns.map((t) => (
            <TurnBubble key={t.id} turn={t} scope={scope} />
          ))}
          {pending && (
            <div className="flex items-center gap-2 text-[11px] text-foreground-muted">
              <span className="inline-flex gap-1">
                <span className="size-1.5 rounded-full bg-foreground-muted animate-pulse" />
                <span className="size-1.5 rounded-full bg-foreground-muted animate-pulse [animation-delay:120ms]" />
                <span className="size-1.5 rounded-full bg-foreground-muted animate-pulse [animation-delay:240ms]" />
              </span>
              Orchestrating…
            </div>
          )}

          {turns.length === 1 && (
            <div className="pt-2 flex flex-wrap gap-1.5">
              {STARTERS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => send(s)}
                  className="text-[11px] px-2 py-1 rounded-md border border-border-muted text-foreground-muted hover:text-foreground hover:bg-background-elevated transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          <div ref={endRef} />
        </div>

        {/* Input */}
        <footer className="px-4 py-4 border-t border-border-muted">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
          >
            <div className="flex items-center gap-2 h-11 px-3 rounded-full border border-border-muted bg-background-muted/40 focus-within:border-border-focus/60 transition-colors">
              <button
                type="button"
                onClick={() => toast.info('Attachments are disabled in this prototype.')}
                className="size-7 rounded-full text-foreground-muted hover:text-foreground hover:bg-background-elevated transition-colors flex items-center justify-center shrink-0"
                aria-label="Attach file"
              >
                <Paperclip className="size-3.5" />
              </button>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Send a message..."
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-foreground-subtle focus:outline-none"
              />
              <button
                type="submit"
                disabled={!input.trim() || pending}
                className="size-7 rounded-full bg-foreground text-background hover:opacity-90 transition-opacity flex items-center justify-center shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label="Send"
              >
                <ArrowUp className="size-3.5" />
              </button>
            </div>
          </form>
        </footer>
      </section>

      {/* Debug rail */}
      {debugOpen && (
        <DebugRail
          sessionId={sessionId}
          agentName={agentName}
          messageCount={messageCount}
          traceEvents={traceEvents}
          tokensIn={tokensIn}
          tokensOut={tokensOut}
          totalTokens={totalTokens}
          llmCalls={llmCalls}
          tracesWithEvents={tracesWithEvents}
          latestTrace={latestTrace}
          subAgentCount={allowedSubAgents.length}
        />
      )}
    </div>
  );
}

/* ------------- Subcomponents ------------- */

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[10px] uppercase tracking-wide bg-background-elevated text-foreground-muted px-1.5 py-0.5 rounded font-medium">
      {children}
    </span>
  );
}

function TurnBubble({ turn, scope }: { turn: ChatTurn; scope: Scope }) {
  if (turn.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[75%] rounded-2xl bg-foreground text-background px-4 py-2 text-sm whitespace-pre-wrap">
          {turn.text}
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start">
      <div className="min-w-0 max-w-[75%]">
        {((scope.kind === 'project' && turn.appName) ||
          (scope.kind === 'app' && turn.subAgentName)) && (
          <div className="text-[10px] uppercase tracking-wide text-foreground-meta mb-1 font-medium">
            {scope.kind === 'project'
              ? `${turn.appName} · ${turn.subAgentName ?? ''}`
              : turn.subAgentName}
          </div>
        )}
        <div className="rounded-2xl bg-background-muted/60 px-4 py-2.5 text-sm text-foreground whitespace-pre-wrap">
          {turn.text}
        </div>
        {turn.citations && turn.citations.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {turn.citations.map((c, i) => (
              <span
                key={c}
                className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-success-subtle text-success font-mono"
              >
                <BookOpen className="size-2.5" />[{i + 1}] {c}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

type DebugTab = 'overview' | 'traces' | 'errors' | 'data' | 'conversation';

const DEBUG_TABS: { id: DebugTab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'traces', label: 'Traces' },
  { id: 'errors', label: 'Errors' },
  { id: 'data', label: 'Data' },
  { id: 'conversation', label: 'Conversation' },
];

function DebugRail({
  sessionId,
  agentName,
  messageCount,
  traceEvents,
  tokensIn,
  tokensOut,
  totalTokens,
  llmCalls,
  tracesWithEvents,
  latestTrace,
  subAgentCount,
}: {
  sessionId: string;
  agentName: string;
  messageCount: number;
  traceEvents: number;
  tokensIn: number;
  tokensOut: number;
  totalTokens: number;
  llmCalls: number;
  tracesWithEvents: number;
  latestTrace?: TraceEvent[];
  subAgentCount: number;
}) {
  const [tab, setTab] = useState<DebugTab>('overview');

  return (
    <aside className="ml-3 flex flex-col rounded-lg border border-border-muted bg-background-subtle overflow-hidden">
      {/* Tabs */}
      <div className="border-b border-border-muted flex items-center px-2 gap-0.5 overflow-x-auto">
        {DEBUG_TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              'px-2.5 py-2.5 text-xs font-medium border-b-2 -mb-px transition-colors whitespace-nowrap flex items-center gap-1.5',
              tab === t.id
                ? 'border-foreground text-foreground'
                : 'border-transparent text-foreground-muted hover:text-foreground',
            )}
          >
            {t.label}
            {t.id === 'traces' && tracesWithEvents > 0 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-background-elevated text-foreground-muted font-mono">
                {tracesWithEvents}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
        {tab === 'overview' && (
          <>
            <Group label="Session overview">
              <Row icon={Bot} label="Agent" value={agentName} mono />
              <Row
                icon={Copy}
                label="Session"
                value={sessionId}
                mono
                onCopy={() => {
                  navigator.clipboard?.writeText(sessionId);
                  toast.success('Session ID copied');
                }}
              />
              <Row label="Messages" value={String(messageCount)} />
              <Row label="Trace events" value={String(traceEvents)} />
              <Row
                icon={Wifi}
                label="Connection"
                value={
                  <span className="inline-flex items-center gap-1.5 text-foreground">
                    <span className="size-1.5 rounded-full bg-success animate-pulse" />
                    Connected
                  </span>
                }
              />
            </Group>

            <Group label="Models used">
              <span className="inline-flex items-center gap-1.5 text-xs bg-background-elevated border border-border-muted text-foreground px-2 py-1 rounded-md font-mono">
                <Cpu className="size-3 text-foreground-muted" />
                gpt-5.2
              </span>
            </Group>

            <Group label="Token breakdown">
              <div className="grid grid-cols-2 gap-2">
                <StatCard label="Tokens In" value={tokensIn.toLocaleString()} />
                <StatCard label="Tokens Out" value={tokensOut.toLocaleString()} />
                <StatCard label="Total Tokens" value={totalTokens.toLocaleString()} />
                <StatCard label="LLM Calls" value={String(llmCalls)} />
              </div>
            </Group>

            <Group label="Timeout diagnostics">
              <div className="grid grid-cols-2 gap-2">
                <StatCard label="Browser idle" value="30m" sub="Source: Studio Client Idle" />
                <StatCard label="Access token TTL" value="1h" sub="Source: Studio Jwt" />
                <StatCard label="Runtime idle" value="2h" sub="Source: Tenant" />
                <StatCard label="Runtime max age" value="24h" sub="Source: Tenant" />
              </div>
            </Group>
          </>
        )}

        {tab === 'traces' && (
          <Group label="Latest trace">
            {!latestTrace && (
              <p className="text-[11px] text-foreground-muted">
                Trace appears here after the first response.
              </p>
            )}
            {latestTrace && (
              <ol className="space-y-2">
                {latestTrace.map((ev, i) => {
                  const Icon = traceIcon[ev.kind];
                  return (
                    <li key={i} className="flex items-start gap-2">
                      <Icon className={cn('size-3.5 shrink-0 mt-0.5', traceTone[ev.kind])} />
                      <div className="min-w-0">
                        <div className="text-xs text-foreground truncate">{ev.label}</div>
                        {ev.detail && (
                          <div className="text-[11px] text-foreground-muted">{ev.detail}</div>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </Group>
        )}

        {tab === 'errors' && (
          <EmptyState
            title="No errors"
            subtitle="Errors from the orchestration would appear here."
          />
        )}

        {tab === 'data' && (
          <Group label="Scope">
            <Row label="Sub-agents" value={String(subAgentCount)} />
            <Row label="Tools" value={String(latestTrace?.filter((e) => e.kind === 'tool').length ?? 0)} />
            <Row label="Knowledge hits" value={String(latestTrace?.filter((e) => e.kind === 'knowledge').length ?? 0)} />
            <Row label="Guardrails fired" value={String(latestTrace?.filter((e) => e.kind === 'guardrail').length ?? 0)} />
          </Group>
        )}

        {tab === 'conversation' && (
          <Group label="Turn counts">
            <Row label="User messages" value={String(Math.ceil(messageCount / 2))} />
            <Row label="Agent messages" value={String(Math.floor(messageCount / 2))} />
            <Row label="Avg agent tokens" value={String(llmCalls > 0 ? Math.round(tokensOut / llmCalls) : 0)} />
          </Group>
        )}
      </div>
    </aside>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wide text-foreground-meta font-medium mb-2.5">
        {label}
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Row({
  icon: Icon,
  label,
  value,
  mono = false,
  onCopy,
}: {
  icon?: LucideIcon;
  label: string;
  value: React.ReactNode;
  mono?: boolean;
  onCopy?: () => void;
}) {
  return (
    <div className="flex items-center gap-2 text-xs">
      {Icon && <Icon className="size-3 text-foreground-subtle shrink-0" />}
      <span className="text-foreground-muted">{label}:</span>
      <span className={cn('flex-1 min-w-0 truncate text-foreground', mono && 'font-mono')}>
        {value}
      </span>
      {onCopy && (
        <button
          type="button"
          onClick={onCopy}
          className="size-5 rounded text-foreground-subtle hover:text-foreground hover:bg-background-elevated transition-colors flex items-center justify-center"
          aria-label={`Copy ${label}`}
        >
          <Copy className="size-3" />
        </button>
      )}
    </div>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-md border border-border-muted bg-background-muted/40 px-3 py-2">
      <div className="text-[10px] uppercase tracking-wide text-foreground-meta font-medium">
        {label}
      </div>
      <div className="text-sm font-semibold tabular-nums mt-0.5">{value}</div>
      {sub && <div className="text-[10px] text-foreground-subtle mt-0.5">{sub}</div>}
    </div>
  );
}

function EmptyState({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="py-10 text-center">
      <p className="text-sm font-semibold">{title}</p>
      <p className="text-[11px] text-foreground-muted mt-1">{subtitle}</p>
    </div>
  );
}
