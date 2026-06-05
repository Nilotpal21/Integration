'use client';

import { useState } from 'react';
import { notFound, useParams } from 'next/navigation';
import Link from 'next/link';
import { Plus, X, Archive } from 'lucide-react';
import { getProjectById, projects, personas } from '@/lib/mock-data';
import { Footer } from '@/components/shell/Footer';
import { PickerSelect } from '@/components/ui/PickerSelect';
import { cn } from '@/lib/utils';

const TABS = [
  'Overview',
  'Membership & RBAC',
  'Reviewer pool',
  'Knowledge scope',
  'Model overrides',
  'Tools',
  'Cost & budget',
  'Channels',
  'Archive',
] as const;

type Tab = (typeof TABS)[number];

export default function ProjectSettingsPage() {
  const params = useParams<{ projectId: string }>();
  const project = getProjectById(params.projectId);
  const [tab, setTab] = useState<Tab>('Overview');

  if (!project) notFound();

  return (
    <div className="space-y-6">
      <nav className="text-xs text-foreground-muted flex items-center gap-2">
        <Link href="/projects" className="hover:text-foreground transition-colors">
          Projects
        </Link>
        <span className="text-foreground-subtle">/</span>
        <Link
          href={`/projects/${project.id}`}
          className="hover:text-foreground transition-colors"
        >
          {project.name}
        </Link>
        <span className="text-foreground-subtle">/</span>
        <span className="text-foreground">Settings</span>
      </nav>

      <header>
        <h1 className="text-xl font-semibold tracking-tight">{project.name} · Settings</h1>
        <p className="text-xs text-foreground-muted mt-1">
          Configure membership, reviewer pool, knowledge scope, model overrides, tools, budget,
          channels, and archive controls for this project.
        </p>
      </header>

      <div className="border-b border-border-muted overflow-x-auto">
        <div className="flex items-center gap-1 min-w-max">
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={cn(
                'px-3 py-2 text-xs font-medium transition-colors border-b-2 -mb-px',
                tab === t
                  ? 'text-foreground border-foreground'
                  : 'text-foreground-muted border-transparent hover:text-foreground',
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-border-muted bg-background-subtle p-5">
        {tab === 'Overview' && <OverviewTab projectName={project.name} projectId={project.id} />}
        {tab === 'Membership & RBAC' && <MembershipTab />}
        {tab === 'Reviewer pool' && <ReviewerPoolTab />}
        {tab === 'Knowledge scope' && <KnowledgeScopeTab />}
        {tab === 'Model overrides' && <ModelOverridesTab />}
        {tab === 'Tools' && <ToolsTab />}
        {tab === 'Cost & budget' && (
          <CostBudgetTab monthlyBudget={project.monthlyBudget} mtdSpend={project.mtdSpend} />
        )}
        {tab === 'Channels' && (
          <ChannelsTab defaultChannels={project.defaultChannels} />
        )}
        {tab === 'Archive' && <ArchiveTab projectName={project.name} />}
      </div>

      <Footer />
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-sm font-semibold mb-3">{title}</h2>
      {children}
    </div>
  );
}

function OverviewTab({ projectName, projectId }: { projectName: string; projectId: string }) {
  return (
    <Section title="Overview">
      <div className="space-y-4 max-w-xl">
        <Field label="Project name">
          <input
            defaultValue={projectName}
            className="w-full h-9 bg-background-muted/60 border border-border-muted rounded-md px-3 text-sm focus:outline-none focus:ring-1 focus:ring-border-focus/40"
          />
        </Field>
        <Field label="Description">
          <textarea
            defaultValue="Business-area scope for the project."
            className="w-full h-20 bg-background-muted/60 border border-border-muted rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-border-focus/40 resize-none"
          />
        </Field>
        <Field label="Project ID">
          <div className="font-mono text-xs text-foreground-muted bg-background-muted/40 border border-border-muted rounded-md px-3 py-2">
            {projectId}
          </div>
        </Field>
      </div>
    </Section>
  );
}

function MembershipTab() {
  const [inviteRole, setInviteRole] = useState('Process Owner');
  return (
    <Section title="Membership & RBAC">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <div className="text-[10px] uppercase tracking-wide text-foreground-meta font-medium mb-2">
            Current members
          </div>
          <div className="space-y-1.5">
            {[personas.processOwner, personas.reviewer, personas.admin].map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-3 px-3 py-2 rounded-md bg-background-muted/40 border border-border-muted text-xs"
              >
                <span className="size-7 rounded-full bg-purple/20 text-purple flex items-center justify-center text-[10px] font-medium shrink-0">
                  {p.initials}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-foreground truncate">{p.name}</div>
                  <div className="text-[11px] text-foreground-subtle">{p.role}</div>
                </div>
                <button className="text-foreground-subtle hover:text-foreground transition-colors">
                  <X className="size-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wide text-foreground-meta font-medium mb-2">
            Invite a member
          </div>
          <div className="space-y-3">
            <input
              placeholder="email@cornerstone.cu"
              className="w-full h-9 bg-background-muted/60 border border-border-muted rounded-md px-3 text-sm focus:outline-none focus:ring-1 focus:ring-border-focus/40"
            />
            <PickerSelect
              value={inviteRole}
              onChange={setInviteRole}
              options={[
                { value: 'Process Owner', label: 'Process Owner' },
                { value: 'Reviewer', label: 'Reviewer' },
                { value: 'Project Admin', label: 'Project Admin' },
                { value: 'Knowledge Editor', label: 'Knowledge Editor' },
                { value: 'Observer', label: 'Observer' },
              ]}
              triggerClassName="h-9 rounded-md bg-background-muted/60 px-3"
            />
            <button className="h-9 px-4 rounded-md text-xs font-medium bg-accent text-accent-foreground hover:bg-accent-muted transition-colors flex items-center gap-1.5">
              <Plus className="size-3.5" />
              Send invitation
            </button>
          </div>
        </div>
      </div>
    </Section>
  );
}

function ReviewerPoolTab() {
  return (
    <Section title="Reviewer pool">
      <p className="text-xs text-foreground-muted mb-4 max-w-2xl">
        Submissions in this project route to these reviewers. Dual approval is enforced for
        money-moving tools, Reg E disputes, and member NPI access.
      </p>
      <div className="space-y-1.5 mb-4">
        {[personas.reviewer].map((p) => (
          <div
            key={p.id}
            className="flex items-center gap-3 px-3 py-2 rounded-md bg-background-muted/40 border border-border-muted text-xs"
          >
            <span className="size-7 rounded-full bg-success-subtle text-success flex items-center justify-center text-[10px] font-medium shrink-0">
              {p.initials}
            </span>
            <div className="flex-1 min-w-0">
              <div>{p.name}</div>
              <div className="text-[11px] text-foreground-subtle">
                {p.role} · active
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="space-y-2">
        {[
          'Money-moving tools require dual approval',
          'Reg E disputes require dual approval',
          'Member NPI access requires dual approval',
          'Escalate to tenant-wide compliance pool when queue is empty for > 24h',
        ].map((rule) => (
          <label key={rule} className="flex items-center gap-2 text-xs cursor-pointer">
            <input
              type="checkbox"
              defaultChecked
              className="size-3.5 rounded border-border-muted bg-background-muted text-foreground focus:ring-1 focus:ring-border-focus/40"
            />
            <span>{rule}</span>
          </label>
        ))}
      </div>
    </Section>
  );
}

function KnowledgeScopeTab() {
  return (
    <Section title="Knowledge scope">
      <p className="text-xs text-foreground-muted mb-4 max-w-2xl">
        This project draws from tenant-wide sources by default and from any project-scoped sources
        added below.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-md border border-border-muted p-3">
          <div className="text-[10px] uppercase tracking-wide text-foreground-meta font-medium mb-2">
            Tenant-wide (read-only)
          </div>
          <ul className="text-xs text-foreground-muted space-y-1">
            <li>· Reg D and Reg E basics</li>
            <li>· Member identity policy</li>
            <li>· FFIEC guidance</li>
            <li>· TCPA outbound rules</li>
          </ul>
        </div>
        <div className="rounded-md border border-border-muted p-3">
          <div className="text-[10px] uppercase tracking-wide text-foreground-meta font-medium mb-2">
            Project-scoped
          </div>
          <ul className="text-xs text-foreground-muted space-y-1">
            <li>· Cornerstone Card Services FAQ</li>
            <li>· Card dispute disclosures</li>
          </ul>
          <button className="mt-3 text-[11px] text-foreground-muted hover:text-foreground transition-colors flex items-center gap-1">
            <Plus className="size-3" />
            Attach more from Knowledge Library
          </button>
        </div>
      </div>
    </Section>
  );
}

function ModelOverridesTab() {
  const purposes = [
    'Routing',
    'Response generation',
    'AI Helper',
    'Embedding (Knowledge)',
    'Evaluation grading',
  ];
  return (
    <Section title="Model overrides">
      <p className="text-xs text-foreground-muted mb-4 max-w-2xl">
        Each purpose inherits the tenant default unless overridden here.
      </p>
      <div className="space-y-2">
        {purposes.map((purpose, idx) => (
          <div
            key={purpose}
            className="flex items-center gap-3 px-3 py-2 rounded-md bg-background-muted/40 border border-border-muted text-xs"
          >
            <div className="flex-1 min-w-0">
              <div className="font-medium">{purpose}</div>
              <div className="text-[11px] text-foreground-subtle">
                {idx === 1
                  ? 'Override: Azure OpenAI GPT-4o (Cornerstone tenant)'
                  : 'Inherit tenant default'}
              </div>
            </div>
            <button className="text-[11px] text-foreground-muted hover:text-foreground transition-colors">
              Change
            </button>
          </div>
        ))}
      </div>
    </Section>
  );
}

function ToolsTab() {
  return (
    <Section title="Tools and connectors">
      <p className="text-xs text-foreground-muted mb-4 max-w-2xl">
        Apps in this project can use these tools. Money-moving tools require dual approval per the
        reviewer pool.
      </p>
      <div className="space-y-1.5">
        {[
          { name: 'Core banking (Symitar)', scope: 'tenant-wide', moves: false },
          { name: 'Card processor (Visa DPS)', scope: 'project-scoped', moves: false },
          { name: 'Payments (ACH origination)', scope: 'project-scoped', moves: true },
          { name: 'Salesforce CRM', scope: 'tenant-wide', moves: false },
        ].map((t) => (
          <div
            key={t.name}
            className="flex items-center gap-3 px-3 py-2 rounded-md bg-background-muted/40 border border-border-muted text-xs"
          >
            <div className="flex-1 min-w-0">
              <div className="font-medium">{t.name}</div>
              <div className="text-[11px] text-foreground-subtle">{t.scope}</div>
            </div>
            {t.moves && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-warning-subtle text-warning uppercase tracking-wide font-medium">
                Money-moving
              </span>
            )}
          </div>
        ))}
      </div>
    </Section>
  );
}

function CostBudgetTab({
  monthlyBudget,
  mtdSpend,
}: {
  monthlyBudget: number;
  mtdSpend: number;
}) {
  const pct = Math.round((mtdSpend / monthlyBudget) * 100);
  return (
    <Section title="Cost & budget">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl">
        <div>
          <Field label="Monthly budget (USD)">
            <input
              type="number"
              defaultValue={monthlyBudget}
              className="w-full h-9 bg-background-muted/60 border border-border-muted rounded-md px-3 text-sm focus:outline-none focus:ring-1 focus:ring-border-focus/40 font-mono"
            />
          </Field>
          <Field label="Warning threshold (% of budget)">
            <input
              type="number"
              defaultValue={80}
              className="w-full h-9 bg-background-muted/60 border border-border-muted rounded-md px-3 text-sm focus:outline-none focus:ring-1 focus:ring-border-focus/40 font-mono"
            />
          </Field>
          <Field label="Hard cap (% of budget)">
            <input
              type="number"
              defaultValue={120}
              className="w-full h-9 bg-background-muted/60 border border-border-muted rounded-md px-3 text-sm focus:outline-none focus:ring-1 focus:ring-border-focus/40 font-mono"
            />
          </Field>
        </div>
        <div>
          <div className="rounded-md border border-border-muted bg-background-muted/40 p-4">
            <div className="text-[10px] uppercase tracking-wide text-foreground-meta font-medium">
              MTD spend
            </div>
            <div className="text-2xl font-semibold tabular-nums mt-1">
              ${mtdSpend.toLocaleString()}
            </div>
            <div className="text-xs text-foreground-muted mt-0.5">
              of ${monthlyBudget.toLocaleString()} budgeted · {pct}%
            </div>
            <div className="mt-3 h-1.5 rounded-full bg-background-elevated overflow-hidden">
              <div
                className={cn(
                  'h-full',
                  pct >= 95 ? 'bg-error' : pct >= 80 ? 'bg-warning' : 'bg-success/80',
                )}
                style={{ width: `${Math.min(100, pct)}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}

function ChannelsTab({
  defaultChannels,
}: {
  defaultChannels: ('digital' | 'voice' | 'sms' | 'email')[];
}) {
  const all: ('digital' | 'voice' | 'sms' | 'email')[] = ['digital', 'voice', 'sms', 'email'];
  return (
    <Section title="Default channels">
      <p className="text-xs text-foreground-muted mb-4 max-w-2xl">
        New apps generated in this project default to these channels.
      </p>
      <div className="flex items-center gap-2">
        {all.map((c) => {
          const on = defaultChannels.includes(c);
          return (
            <span
              key={c}
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border',
                on
                  ? 'bg-background-elevated text-foreground border-border'
                  : 'bg-background-muted/40 text-foreground-subtle border-border-muted',
              )}
            >
              <span
                className={cn('size-1.5 rounded-full', on ? 'bg-success' : 'bg-foreground-subtle')}
              />
              {c}
            </span>
          );
        })}
      </div>
    </Section>
  );
}

function ArchiveTab({ projectName }: { projectName: string }) {
  return (
    <Section title="Archive this project">
      <p className="text-xs text-foreground-muted mb-4 max-w-2xl">
        Archiving pauses all apps in <span className="font-medium">{projectName}</span>. SOPs,
        audit, and historical data remain queryable. You can restore the project later.
      </p>
      <button className="h-9 px-4 rounded-md text-xs font-medium border border-warning/40 text-warning hover:bg-warning-subtle transition-colors flex items-center gap-1.5">
        <Archive className="size-3.5" />
        Archive project
      </button>
    </Section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-3">
      <label className="block text-[10px] uppercase tracking-wide text-foreground-meta font-medium mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}
