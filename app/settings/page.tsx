'use client';

import { useState } from 'react';
import {
  User,
  Bell,
  Sparkles,
  Building2,
  KeyRound,
  Shield,
  Eye,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { personas, tenant } from '@/lib/mock-data';
import { useActivePersona } from '@/lib/persona';
import { Footer } from '@/components/shell/Footer';
import { PickerSelect } from '@/components/ui/PickerSelect';
import { cn } from '@/lib/utils';

export default function SettingsPage() {
  const persona = useActivePersona();
  const [builderDefaultMode, setBuilderDefaultMode] = useState('scratch');
  const [reviewLanding, setReviewLanding] = useState('summary');
  const [charterType, setCharterType] = useState(tenant.charter);
  const [dataResidency, setDataResidency] = useState('us-east');
  const [idleTimeout, setIdleTimeout] = useState('30');
  const [sessionLifetime, setSessionLifetime] = useState('8');
  const [auditRetention, setAuditRetention] = useState('7');
  const [connectorRunLogs, setConnectorRunLogs] = useState('90');
  const [modeHubHistory, setModeHubHistory] = useState('90');
  const [sandboxDataRetention, setSandboxDataRetention] = useState('14');

  const isAdmin = persona.role === 'Credit Union Admin';

  return (
    <div className="space-y-5">
      <header className="pb-4 border-b border-border-muted">
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-xs text-foreground-muted mt-1.5">
          Manage your profile, notifications, integration defaults, and{' '}
          {isAdmin ? 'workspace-wide' : 'personal'} preferences.
        </p>
      </header>

      <Section
        icon={User}
        title="Profile"
        description="Your identity within cloudagle.ai and the integration workspace."
      >
        <FieldGrid>
          <Field label="Name">
            <div className="h-9 bg-background-muted/40 border border-border-muted rounded-md px-3 text-sm flex items-center text-foreground">
              {persona.name}
            </div>
          </Field>
          <Field label="Email">
            <div className="h-9 bg-background-muted/40 border border-border-muted rounded-md px-3 text-sm font-mono flex items-center text-foreground">
              {persona.email}
            </div>
          </Field>
          <Field label="Role">
            <div className="h-9 bg-background-muted/40 border border-border-muted rounded-md px-3 text-sm flex items-center text-foreground-muted">
              {persona.role}
            </div>
          </Field>
          <Field label="Initials avatar">
            <div className="flex items-center gap-2.5">
              <span className="size-9 rounded-full bg-purple/20 text-purple flex items-center justify-center text-xs font-medium">
                {persona.initials}
              </span>
              <span className="text-xs text-foreground-subtle">Managed by your account profile</span>
            </div>
          </Field>
        </FieldGrid>
      </Section>

      <Section
        icon={Bell}
        title="Notifications"
        description="How and when you hear about connector activity and review events."
      >
        <div className="space-y-2.5">
          <Toggle
            label="In-app notifications"
            description="Bell icon updates for connector activation, revoke actions, and model configuration changes."
            defaultChecked
          />
          <Toggle
            label="Email notifications"
            description="Daily digest of connector status changes, sandbox failures, and workspace events."
            defaultChecked
          />
          <Toggle
            label="Notify me when a connector needs attention"
            description="Get notified when a connector is revoked, fails sandbox validation, or requires reauthorization."
            defaultChecked={false}
          />
          {persona.role === 'Compliance Reviewer' && (
            <Toggle
              label="Page me on high-risk connector changes"
              description="SMS notification for production-impacting lifecycle actions like revoke, delete, or credential rotation."
              defaultChecked
            />
          )}
        </div>
      </Section>

      <Section
        icon={Sparkles}
        title="Integration defaults"
        description="Control how connector setup and review behave for your account."
      >
        <FieldGrid>
          <Field label="Default creation mode">
            <PickerSelect
              value={builderDefaultMode}
              onChange={(value) => setBuilderDefaultMode(value)}
              options={[
                { value: 'scratch', label: 'Start from scratch' },
                { value: 'template', label: 'Use existing template' },
              ]}
              triggerClassName="h-9 rounded-md bg-background-muted/60 px-3"
            />
          </Field>
          <Field label="Review landing">
            <PickerSelect
              value={reviewLanding}
              onChange={(value) => setReviewLanding(value)}
              options={[
                { value: 'summary', label: 'Parsed spec summary' },
                { value: 'components', label: 'Components selection' },
                { value: 'sandbox', label: 'Sandbox test step' },
              ]}
              triggerClassName="h-9 rounded-md bg-background-muted/60 px-3"
            />
          </Field>
        </FieldGrid>
        <Toggle
          label="Require sandbox success before activation"
          description="Prevent connector activation until the latest sandbox test passes."
          defaultChecked
        />
        <Toggle
          label="Warn before irreversible lifecycle actions"
          description="Show confirmation before revoke and delete actions."
          defaultChecked
        />
      </Section>

      {isAdmin && (
        <>
          <Section
            icon={Building2}
            title="Workspace settings"
            description={`Workspace-wide configuration for ${tenant.name}.`}
            adminOnly
          >
            <FieldGrid>
              <Field label="Workspace name">
                <input
                  defaultValue={tenant.name}
                  className="w-full h-9 bg-background-muted/60 border border-border-muted rounded-md px-3 text-sm focus:outline-none focus:ring-1 focus:ring-border-focus/40"
                />
              </Field>
              <Field label="Workspace type">
                <PickerSelect
                  value={charterType}
                  onChange={(value) => setCharterType(value as typeof charterType)}
                  options={[
                    { value: 'federal', label: 'Enterprise workspace' },
                    { value: 'state', label: 'Sandbox workspace' },
                  ]}
                  triggerClassName="h-9 rounded-md bg-background-muted/60 px-3"
                />
              </Field>
              <Field label="Region">
                <input
                  defaultValue={tenant.region}
                  className="w-full h-9 bg-background-muted/60 border border-border-muted rounded-md px-3 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-border-focus/40"
                />
              </Field>
              <Field label="Data residency">
                <PickerSelect
                  value={dataResidency}
                  onChange={(value) => setDataResidency(value)}
                  options={[
                    { value: 'us-east', label: 'us-east (Virginia)' },
                    { value: 'us-west', label: 'us-west (Oregon)' },
                    { value: 'eu-west', label: 'eu-west (Ireland)' },
                  ]}
                  triggerClassName="h-9 rounded-md bg-background-muted/60 px-3"
                />
              </Field>
            </FieldGrid>
          </Section>

          <Section
            icon={KeyRound}
            title="Authentication & session"
            description="Identity provider, MFA, and session controls for the platform."
            adminOnly
          >
            <FieldGrid>
              <Field label="SSO provider">
                <div className="h-9 bg-background-muted/40 border border-border-muted rounded-md px-3 text-sm flex items-center text-foreground-muted gap-2">
                  <KeyRound className="size-3.5 text-foreground-subtle" />
                  Workspace SSO · SAML 2.0
                </div>
              </Field>
              <Field label="MFA requirement">
                <div className="h-9 bg-background-muted/40 border border-border-muted rounded-md px-3 text-sm flex items-center text-success gap-2">
                  <Shield className="size-3.5" />
                  Mandatory for all admins
                </div>
              </Field>
              <Field label="Idle timeout">
                <PickerSelect
                  value={idleTimeout}
                  onChange={(value) => setIdleTimeout(value)}
                  options={[
                    { value: '5', label: '5 minutes' },
                    { value: '15', label: '15 minutes' },
                    { value: '30', label: '30 minutes' },
                    { value: '60', label: '1 hour' },
                  ]}
                  triggerClassName="h-9 rounded-md bg-background-muted/60 px-3"
                />
              </Field>
              <Field label="Absolute session lifetime">
                <PickerSelect
                  value={sessionLifetime}
                  onChange={(value) => setSessionLifetime(value)}
                  options={[
                    { value: '4', label: '4 hours' },
                    { value: '8', label: '8 hours' },
                    { value: '12', label: '12 hours' },
                    { value: '24', label: '24 hours' },
                  ]}
                  triggerClassName="h-9 rounded-md bg-background-muted/60 px-3"
                />
              </Field>
            </FieldGrid>
            <Toggle
              label="Require step-up MFA for sensitive actions"
              description="Required for model changes, credential rotation, revoke actions, and workspace membership changes."
              defaultChecked
              disabled
            />
          </Section>

          <Section
            icon={Eye}
            title="Audit & retention"
            description="How long the platform keeps audit trails, logs, and sandbox artifacts."
            adminOnly
          >
            <FieldGrid>
              <Field label="Audit log retention">
                <PickerSelect
                  value={auditRetention}
                  onChange={(value) => setAuditRetention(value)}
                  options={[
                    { value: '3', label: '3 years' },
                    { value: '5', label: '5 years' },
                    { value: '7', label: '7 years (recommended)' },
                    { value: '10', label: '10 years' },
                  ]}
                  triggerClassName="h-9 rounded-md bg-background-muted/60 px-3"
                />
              </Field>
              <Field label="Connector run logs">
                <PickerSelect
                  value={connectorRunLogs}
                  onChange={(value) => setConnectorRunLogs(value)}
                  options={[
                    { value: '30', label: '30 days' },
                    { value: '90', label: '90 days' },
                    { value: '365', label: '1 year' },
                  ]}
                  triggerClassName="h-9 rounded-md bg-background-muted/60 px-3"
                />
              </Field>
              <Field label="Mode hub change history">
                <PickerSelect
                  value={modeHubHistory}
                  onChange={(value) => setModeHubHistory(value)}
                  options={[
                    { value: '7', label: '7 days' },
                    { value: '30', label: '30 days' },
                    { value: '90', label: '90 days' },
                    { value: '365', label: '1 year' },
                  ]}
                  triggerClassName="h-9 rounded-md bg-background-muted/60 px-3"
                />
              </Field>
              <Field label="Sandbox test artifacts">
                <PickerSelect
                  value={sandboxDataRetention}
                  onChange={(value) => setSandboxDataRetention(value)}
                  options={[
                    { value: '7', label: '7 days' },
                    { value: '14', label: '14 days' },
                    { value: '30', label: '30 days' },
                  ]}
                  triggerClassName="h-9 rounded-md bg-background-muted/60 px-3"
                />
              </Field>
            </FieldGrid>
          </Section>
        </>
      )}

      <section className="space-y-3">
        <header>
          <h2 className="text-xl font-semibold tracking-tight text-error">Danger Zone</h2>
          <p className="mt-1 text-xs text-foreground-muted">
            High-impact project actions. These changes can affect every app and connector in the current project.
          </p>
        </header>

        <div className="overflow-hidden rounded-lg border border-error/25 bg-background-subtle">
          <DangerRow
            title="Archive project"
            description="Mark this project as archived and read-only for all apps and connectors under it."
            actionLabel="Archive project"
            onClick={() => toast.error('Archive project is disabled in this prototype.')}
          />
          <DangerRow
            title="Delete project"
            description="Permanently delete this project and all of its apps, connectors, connector activity, and audit history."
            actionLabel="Delete project"
            onClick={() => toast.error('Delete project is disabled in this prototype.')}
            destructive
          />
        </div>
      </section>

      <Footer />
    </div>
  );
}

function Section({
  icon: Icon,
  title,
  description,
  children,
  adminOnly,
}: {
  icon: typeof User;
  title: string;
  description: string;
  children: React.ReactNode;
  adminOnly?: boolean;
}) {
  return (
    <section className="rounded-lg border border-border-muted bg-background-subtle p-5">
      <header className="flex items-start gap-3 mb-4">
        <div className="size-8 rounded-md bg-background-elevated border border-border-muted flex items-center justify-center shrink-0">
          <Icon className="size-4 text-foreground-muted" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
            {adminOnly && (
              <span className="text-[10px] uppercase tracking-wide bg-info-subtle text-info px-1.5 py-0.5 rounded font-medium">
                Admin
              </span>
            )}
          </div>
          <p className="text-xs text-foreground-muted mt-0.5">{description}</p>
        </div>
      </header>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function FieldGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{children}</div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[10px] uppercase tracking-wide text-foreground-meta font-medium mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}

function Toggle({
  label,
  description,
  defaultChecked = false,
  disabled = false,
}: {
  label: string;
  description?: string;
  defaultChecked?: boolean;
  disabled?: boolean;
}) {
  const [checked, setChecked] = useState(defaultChecked);
  return (
    <label
      className={cn(
        'flex items-start gap-3 px-3 py-2.5 rounded-md border border-border-muted bg-background-muted/40 cursor-pointer hover:bg-background-muted/60 transition-colors',
        disabled && 'opacity-60 cursor-not-allowed',
      )}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={() => !disabled && setChecked((c) => !c)}
        disabled={disabled}
        className="mt-0.5 size-3.5 accent-foreground"
      />
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium">{label}</div>
        {description && (
          <div className="text-[11px] text-foreground-muted mt-0.5 leading-relaxed">
            {description}
          </div>
        )}
      </div>
    </label>
  );
}

function DangerRow({
  title,
  description,
  actionLabel,
  onClick,
  destructive = false,
}: {
  title: string;
  description: string;
  actionLabel: string;
  onClick: () => void;
  destructive?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-5 border-t border-error/15 px-5 py-5 first:border-t-0">
      <div className="min-w-0">
        <h3 className="text-base font-semibold tracking-tight text-foreground">{title}</h3>
        <p className="mt-1 text-sm leading-relaxed text-foreground-muted max-w-3xl">{description}</p>
      </div>
      <button
        type="button"
        onClick={onClick}
        className={cn(
          'shrink-0 rounded-md border px-4 py-2 text-sm font-medium transition-colors',
          destructive
            ? 'border-error/30 text-error hover:bg-error-subtle'
            : 'border-error/20 text-error hover:bg-error-subtle/60',
        )}
      >
        {actionLabel}
      </button>
    </div>
  );
}
