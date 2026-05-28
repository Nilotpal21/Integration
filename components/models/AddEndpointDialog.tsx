'use client';

import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import {
  X,
  ArrowLeft,
  ArrowRight,
  Check,
  KeyRound,
  Plug,
  FileCode,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  allCapabilities,
  managedProviders,
  purposeMeta,
  purposeOrder,
  type ModelCapability,
  type ModelMode,
  type ModelPurpose,
} from '@/lib/mock-data';
import { cn } from '@/lib/utils';

type Step = 1 | 2 | 3 | 4 | 5;

const modeOptions: {
  id: ModelMode;
  label: string;
  description: string;
  icon: LucideIcon;
}[] = [
  {
    id: 'api_key',
    label: 'API key — managed provider',
    description: 'OpenAI / Anthropic / Azure OpenAI / AWS Bedrock / Google Vertex AI / Cohere / Mistral',
    icon: KeyRound,
  },
  {
    id: 'openai_compatible',
    label: 'OpenAI-compatible endpoint',
    description: 'Self-hosted models (vLLM, TGI, LM Studio, Ollama) or internal gateways',
    icon: Plug,
  },
  {
    id: 'declared_contract',
    label: 'Custom API (declared contract)',
    description: 'For non-OpenAI-compatible models. You provide a request/response contract.',
    icon: FileCode,
  },
  {
    id: 'platform_default',
    label: 'Platform default',
    description: 'Use the Platform Team\'s curated model selection. No configuration needed.',
    icon: Sparkles,
  },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddEndpointDialog({ open, onOpenChange }: Props) {
  const [step, setStep] = useState<Step>(1);
  const [mode, setMode] = useState<ModelMode | null>(null);
  const [name, setName] = useState('');
  const [provider, setProvider] = useState('OpenAI');
  const [region, setRegion] = useState('us-east');
  const [modelId, setModelId] = useState('');
  const [customUrl, setCustomUrl] = useState('');
  const [capabilities, setCapabilities] = useState<Set<ModelCapability>>(
    new Set(['tool_use', 'json_mode']),
  );
  const [purposes, setPurposes] = useState<Set<ModelPurpose>>(new Set());

  const reset = () => {
    setStep(1);
    setMode(null);
    setName('');
    setProvider('OpenAI');
    setRegion('us-east');
    setModelId('');
    setCustomUrl('');
    setCapabilities(new Set(['tool_use', 'json_mode']));
    setPurposes(new Set());
  };

  const handleClose = (next: boolean) => {
    if (!next) {
      setTimeout(reset, 200);
    }
    onOpenChange(next);
  };

  const handleConfirm = () => {
    handleClose(false);
    toast.success(`Added endpoint "${name || 'new endpoint'}"`);
  };

  const toggleCapability = (c: ModelCapability) =>
    setCapabilities((prev) => {
      const next = new Set(prev);
      if (next.has(c)) next.delete(c);
      else next.add(c);
      return next;
    });

  const togglePurpose = (p: ModelPurpose) =>
    setPurposes((prev) => {
      const next = new Set(prev);
      if (next.has(p)) next.delete(p);
      else next.add(p);
      return next;
    });

  const canAdvance = () => {
    if (step === 1) return mode !== null;
    if (step === 2) {
      if (mode === 'platform_default') return true;
      if (mode === 'api_key') return modelId.trim().length > 0;
      return customUrl.trim().length > 0 && modelId.trim().length > 0;
    }
    if (step === 3) return true; // capabilities optional
    if (step === 4) return name.trim().length > 0;
    return true;
  };

  return (
    <Dialog.Root open={open} onOpenChange={handleClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-background/40 backdrop-blur-[2px] animate-fade-in" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[620px] max-w-[100vw] rounded-2xl border border-border bg-background-elevated shadow-2xl flex flex-col max-h-[90vh] animate-fade-in">
          <header className="flex items-start justify-between gap-2 px-6 py-4 border-b border-border-muted shrink-0">
            <div>
              <Dialog.Title className="text-base font-semibold tracking-tight">
                Add model endpoint
              </Dialog.Title>
              <p className="text-[11px] text-foreground-muted mt-0.5">
                Step {step} of 5 · {labelForStep(step)}
              </p>
            </div>
            <Dialog.Close asChild>
              <button
                type="button"
                className="size-7 rounded-md text-foreground-muted hover:text-foreground hover:bg-background-muted transition-colors flex items-center justify-center"
                aria-label="Close"
              >
                <X className="size-4" />
              </button>
            </Dialog.Close>
          </header>

          <div className="flex-1 overflow-y-auto scrollbar-thin px-6 py-5">
            {step === 1 && (
              <div className="space-y-2">
                {modeOptions.map((m) => {
                  const Icon = m.icon;
                  const selected = mode === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setMode(m.id)}
                      className={cn(
                        'w-full text-left rounded-lg border p-3 transition-colors flex items-start gap-3',
                        selected
                          ? 'border-accent bg-background-muted'
                          : 'border-border-muted bg-background-subtle hover:border-border hover:bg-background-muted/40',
                      )}
                    >
                      <div
                        className={cn(
                          'size-8 rounded-md flex items-center justify-center shrink-0',
                          selected ? 'bg-accent text-accent-foreground' : 'bg-background-elevated text-foreground-muted',
                        )}
                      >
                        <Icon className="size-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium">{m.label}</div>
                        <div className="text-[11px] text-foreground-muted mt-0.5 leading-relaxed">
                          {m.description}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {step === 2 && mode === 'api_key' && (
              <div className="space-y-3">
                <Field label="Provider">
                  <div className="grid grid-cols-3 gap-1.5">
                    {managedProviders.map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setProvider(p)}
                        className={cn(
                          'px-2 py-1.5 rounded-md text-[11px] font-medium border transition-colors text-left',
                          provider === p
                            ? 'border-accent bg-background-muted text-foreground'
                            : 'border-border-muted text-foreground-muted hover:text-foreground hover:bg-background-muted/40',
                        )}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </Field>
                <Field label="API key">
                  <input
                    type="password"
                    placeholder="sk-…"
                    className="w-full h-9 bg-background-muted/60 border border-border-muted rounded-md px-3 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-border-focus/40"
                  />
                  <p className="text-[11px] text-foreground-subtle mt-1">
                    Stored in your tenant credential vault. Encrypted at rest. Rotation supported.
                  </p>
                </Field>
                <Field label="Region">
                  <input
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    placeholder="us-east-1"
                    className="w-full h-9 bg-background-muted/60 border border-border-muted rounded-md px-3 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-border-focus/40"
                  />
                </Field>
                <Field label="Model identifier">
                  <input
                    value={modelId}
                    onChange={(e) => setModelId(e.target.value)}
                    placeholder="gpt-4o · claude-sonnet-4-6 · …"
                    className="w-full h-9 bg-background-muted/60 border border-border-muted rounded-md px-3 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-border-focus/40"
                  />
                </Field>
              </div>
            )}

            {step === 2 && mode === 'openai_compatible' && (
              <div className="space-y-3">
                <Field label="Endpoint URL">
                  <input
                    value={customUrl}
                    onChange={(e) => setCustomUrl(e.target.value)}
                    placeholder="https://llm-gateway.your-cu.internal/v1"
                    className="w-full h-9 bg-background-muted/60 border border-border-muted rounded-md px-3 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-border-focus/40"
                  />
                </Field>
                <Field label="Authentication">
                  <select className="w-full h-9 bg-background-muted/60 border border-border-muted rounded-md px-2 text-sm focus:outline-none focus:ring-1 focus:ring-border-focus/40">
                    <option>Bearer token</option>
                    <option>API key (header)</option>
                    <option>Signed request</option>
                  </select>
                </Field>
                <Field label="Model identifier">
                  <input
                    value={modelId}
                    onChange={(e) => setModelId(e.target.value)}
                    placeholder="llama-3.1-70b-instruct · qwen-2.5-72b · …"
                    className="w-full h-9 bg-background-muted/60 border border-border-muted rounded-md px-3 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-border-focus/40"
                  />
                </Field>
                <button
                  type="button"
                  onClick={() => toast.success('Connection test passed (200 OK)')}
                  className="h-8 px-3 rounded-md text-[11px] font-medium border border-border-muted text-foreground-muted hover:text-foreground hover:bg-background-elevated transition-colors"
                >
                  Test connection
                </button>
              </div>
            )}

            {step === 2 && mode === 'declared_contract' && (
              <div className="space-y-3">
                <Field label="Endpoint URL">
                  <input
                    value={customUrl}
                    onChange={(e) => setCustomUrl(e.target.value)}
                    placeholder="https://custom-model.your-cu.internal/api"
                    className="w-full h-9 bg-background-muted/60 border border-border-muted rounded-md px-3 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-border-focus/40"
                  />
                </Field>
                <Field label="Model identifier">
                  <input
                    value={modelId}
                    onChange={(e) => setModelId(e.target.value)}
                    placeholder="custom-llm-v3"
                    className="w-full h-9 bg-background-muted/60 border border-border-muted rounded-md px-3 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-border-focus/40"
                  />
                </Field>
                <Field label="Request / response contract (JSON schema)">
                  <textarea
                    placeholder='{"request": {"prompt": "string"}, "response": {"text": "string"}}'
                    rows={6}
                    className="w-full bg-background-muted/60 border border-border-muted rounded-md px-3 py-2 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-border-focus/40 resize-none"
                  />
                </Field>
                <Field label="Adapter">
                  <select className="w-full h-9 bg-background-muted/60 border border-border-muted rounded-md px-2 text-sm focus:outline-none focus:ring-1 focus:ring-border-focus/40">
                    <option>Use generic adapter</option>
                    <option>Custom adapter (Platform Team)</option>
                  </select>
                </Field>
              </div>
            )}

            {step === 2 && mode === 'platform_default' && (
              <p className="text-sm text-foreground-muted">
                Uses the Platform Team&apos;s curated multi-model setup. No further configuration
                needed — click <strong>Continue</strong> to assign purposes.
              </p>
            )}

            {step === 3 && (
              <div className="space-y-3">
                <p className="text-xs text-foreground-muted">
                  Declare which capabilities this model supports. The platform&apos;s capability
                  matcher will warn at configuration and at runtime when a required capability is
                  missing.
                </p>
                <ul className="space-y-1.5">
                  {allCapabilities.map((c) => {
                    const checked = capabilities.has(c.id);
                    return (
                      <label
                        key={c.id}
                        className="flex items-center gap-3 px-3 py-2 rounded-md border border-border-muted bg-background-subtle cursor-pointer hover:bg-background-muted/40"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleCapability(c.id)}
                          className="size-3.5"
                        />
                        <span className="text-sm">{c.label}</span>
                      </label>
                    );
                  })}
                </ul>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-3">
                <Field label="Endpoint name">
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="cornerstone-azure-gpt4o"
                    className="w-full h-9 bg-background-muted/60 border border-border-muted rounded-md px-3 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-border-focus/40"
                  />
                </Field>
                <Field label="Purposes to assign">
                  <div className="flex flex-col gap-1.5">
                    {purposeOrder.map((p) => {
                      const checked = purposes.has(p);
                      return (
                        <label
                          key={p}
                          className="flex items-start gap-3 px-3 py-2 rounded-md border border-border-muted bg-background-subtle cursor-pointer hover:bg-background-muted/40"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => togglePurpose(p)}
                            className="size-3.5 mt-0.5"
                          />
                          <div className="min-w-0">
                            <div className="text-sm font-medium">{purposeMeta[p].label}</div>
                            <div className="text-[11px] text-foreground-muted mt-0.5">
                              {purposeMeta[p].description}
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </Field>
              </div>
            )}

            {step === 5 && (
              <div className="rounded-md border border-border-muted bg-background-muted/40 p-4 space-y-2 text-xs">
                <Summary label="Mode" value={mode ? modeOptions.find((m) => m.id === mode)?.label ?? '' : '—'} />
                <Summary label="Name" value={name || '—'} mono />
                {mode === 'api_key' && <Summary label="Provider" value={provider} />}
                {mode !== 'platform_default' && (
                  <Summary label="Model" value={modelId || '—'} mono />
                )}
                {(mode === 'openai_compatible' || mode === 'declared_contract') && (
                  <Summary label="URL" value={customUrl || '—'} mono />
                )}
                {mode === 'api_key' && <Summary label="Region" value={region} />}
                <Summary
                  label="Capabilities"
                  value={
                    Array.from(capabilities)
                      .map((c) => allCapabilities.find((x) => x.id === c)?.label)
                      .join(', ') || 'none'
                  }
                />
                <Summary
                  label="Purposes"
                  value={
                    Array.from(purposes)
                      .map((p) => purposeMeta[p].label)
                      .join(', ') || 'none'
                  }
                />
              </div>
            )}
          </div>

          <footer className="px-6 py-3 border-t border-border-muted flex items-center justify-between shrink-0">
            <button
              type="button"
              onClick={() => step > 1 && setStep((s) => (s - 1) as Step)}
              disabled={step === 1}
              className="h-8 px-3 rounded-md text-xs font-medium text-foreground-muted hover:text-foreground hover:bg-background-muted transition-colors flex items-center gap-1.5 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ArrowLeft className="size-3.5" />
              Back
            </button>
            {step < 5 ? (
              <button
                type="button"
                onClick={() => canAdvance() && setStep((s) => (s + 1) as Step)}
                disabled={!canAdvance()}
                className="h-8 px-3.5 rounded-md text-xs font-medium bg-accent text-accent-foreground hover:bg-accent-muted transition-colors flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue
                <ArrowRight className="size-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleConfirm}
                className="h-8 px-3.5 rounded-md text-xs font-medium bg-accent text-accent-foreground hover:bg-accent-muted transition-colors flex items-center gap-1.5"
              >
                <Check className="size-3.5" />
                Add endpoint
              </button>
            )}
          </footer>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function labelForStep(step: Step): string {
  if (step === 1) return 'Choose mode';
  if (step === 2) return 'Configure connection';
  if (step === 3) return 'Capabilities';
  if (step === 4) return 'Name + purposes';
  return 'Confirm';
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wide text-foreground-meta font-medium mb-1.5">
        {label}
      </div>
      {children}
    </div>
  );
}

function Summary({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="grid grid-cols-[120px_1fr] gap-3">
      <div className="text-[10px] uppercase tracking-wide text-foreground-meta font-medium">
        {label}
      </div>
      <div className={cn(mono && 'font-mono break-all')}>{value}</div>
    </div>
  );
}
