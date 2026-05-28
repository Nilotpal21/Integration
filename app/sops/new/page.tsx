'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  UploadCloud,
  FileText,
  Globe,
  ClipboardPaste,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { recentSOPs, getProjectById } from '@/lib/mock-data';
import { useActiveProjectId } from '@/lib/persona';
import { ParsingAnimation } from '@/components/sops/ParsingAnimation';
import { Footer } from '@/components/shell/Footer';
import { cn } from '@/lib/utils';
import { FolderKanban } from 'lucide-react';

type Tab = 'upload' | 'paste' | 'url';

const FORMAT_CHIPS = ['PDF', 'DOCX', 'MD', 'HTML', 'TXT'];

export default function NewSOPPage() {
  const router = useRouter();
  const activeProjectId = useActiveProjectId();
  const activeProject = getProjectById(activeProjectId);
  const [tab, setTab] = useState<Tab>('upload');
  const [parsing, setParsing] = useState(false);

  const startParsing = useCallback(() => setParsing(true), []);

  const handleComplete = useCallback(() => {
    // Route to the auto-gen result. For the prototype, default to the
    // card-disputes SOP — the BRD's hero example.
    router.push('/sops/sop_card_disputes');
  }, [router]);

  return (
    <div className="space-y-6">
      <nav className="text-xs text-foreground-muted flex items-center gap-2">
        {activeProject && (
          <>
            <Link
              href={`/projects/${activeProject.id}`}
              className="hover:text-foreground transition-colors"
            >
              {activeProject.name}
            </Link>
            <span className="text-foreground-subtle">/</span>
          </>
        )}
        <Link href="/sops" className="hover:text-foreground transition-colors">
          SOPs
        </Link>
        <span className="text-foreground-subtle">/</span>
        <span className="text-foreground">Upload</span>
      </nav>

      <header className="flex flex-col gap-3">
        <div className="inline-flex items-center gap-2 text-[11px] text-purple bg-purple/10 border border-purple/20 rounded-md px-2.5 py-1.5 self-start">
          <FolderKanban className="size-3.5" />
          <span>
            Uploading into{' '}
            <span className="font-medium text-foreground">
              {activeProject?.name ?? 'no active project'}
            </span>
          </span>
          <span className="text-foreground-subtle">·</span>
          <span className="text-foreground-muted">switch project from the top bar</span>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Bring your SOP. We&apos;ll build the app.
        </h1>
        <p className="text-sm text-foreground-muted max-w-2xl">
          Upload a Standard Operating Procedure. The platform reads it, applies credit-union
          expertise, and generates a working agentic app for{' '}
          <span className="font-medium text-foreground">
            {activeProject?.name ?? 'this project'}
          </span>
          . The AI Helper walks you through every step.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
        <div className="rounded-lg border border-border bg-background-subtle p-6">
          {/* Tab strip */}
          <div className="flex items-center gap-1 mb-5">
            <TabButton active={tab === 'upload'} onClick={() => setTab('upload')} icon={UploadCloud}>
              Upload
            </TabButton>
            <TabButton active={tab === 'paste'} onClick={() => setTab('paste')} icon={ClipboardPaste}>
              Paste text
            </TabButton>
            <TabButton active={tab === 'url'} onClick={() => setTab('url')} icon={Globe}>
              From URL
            </TabButton>
          </div>

          {tab === 'upload' && (
            <button
              type="button"
              onClick={startParsing}
              className="w-full border-2 border-dashed border-border rounded-xl bg-background-muted/40 hover:bg-background-muted/70 hover:border-foreground-subtle transition-colors p-10 text-center group"
            >
              <UploadCloud className="size-10 text-foreground-subtle group-hover:text-foreground-muted mx-auto mb-3 transition-colors" />
              <div className="text-base font-medium">
                Drag your SOP here, or click to browse
              </div>
              <div className="text-xs text-foreground-muted mt-1.5">
                PDF, DOCX, TXT, MD, HTML, or paste text. Multiple files supported.
              </div>
              <div className="flex items-center justify-center gap-1.5 mt-4">
                {FORMAT_CHIPS.map((f) => (
                  <span
                    key={f}
                    className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-background-elevated text-foreground-muted border border-border-muted"
                  >
                    {f}
                  </span>
                ))}
              </div>
            </button>
          )}

          {tab === 'paste' && (
            <div className="space-y-4">
              <textarea
                placeholder="Paste the SOP content here…"
                className="w-full h-52 bg-background-muted/60 border border-border-muted rounded-md p-3 text-sm text-foreground placeholder:text-foreground-subtle focus:outline-none focus:ring-1 focus:ring-border-focus/40 font-mono resize-none"
              />
              <input
                placeholder="Title (e.g., Card Dispute Resolution SOP)"
                defaultValue="Untitled SOP"
                className="w-full h-9 bg-background-muted/60 border border-border-muted rounded-md px-3 text-sm text-foreground placeholder:text-foreground-subtle focus:outline-none focus:ring-1 focus:ring-border-focus/40"
              />
              <button
                type="button"
                onClick={startParsing}
                className="h-9 px-4 rounded-md text-sm font-medium bg-accent text-accent-foreground hover:bg-accent-muted transition-colors flex items-center gap-1.5"
              >
                Continue
                <ArrowRight className="size-3.5" />
              </button>
            </div>
          )}

          {tab === 'url' && (
            <div className="space-y-4">
              <input
                placeholder="https://your-cu.com/sops/card-disputes"
                className="w-full h-9 bg-background-muted/60 border border-border-muted rounded-md px-3 text-sm text-foreground placeholder:text-foreground-subtle focus:outline-none focus:ring-1 focus:ring-border-focus/40 font-mono"
              />
              <p className="text-[11px] text-foreground-subtle">
                We&apos;ll fetch and parse the document. Authenticated URLs are not supported in the
                prototype.
              </p>
              <button
                type="button"
                onClick={startParsing}
                className="h-9 px-4 rounded-md text-sm font-medium bg-accent text-accent-foreground hover:bg-accent-muted transition-colors flex items-center gap-1.5"
              >
                Continue
                <ArrowRight className="size-3.5" />
              </button>
            </div>
          )}
        </div>

        <div className="space-y-5">
          <div className="rounded-lg border border-purple/20 bg-purple/5 p-4">
            <div className="flex items-center gap-1.5 mb-2 text-purple">
              <Sparkles className="size-3.5" />
              <span className="text-[11px] uppercase tracking-wide font-medium">
                Tips from the Helper
              </span>
            </div>
            <ul className="space-y-2 text-xs text-foreground-muted leading-relaxed">
              <li>
                A good SOP describes decision points, escalation rules, and disclosures.
              </li>
              <li>
                Multi-file SOPs are supported — upload them together if they belong to one
                process.
              </li>
              <li>
                We only flag safety and compliance issues. We don&apos;t suggest process changes.
              </li>
            </ul>
          </div>

          <div className="rounded-lg border border-border-muted bg-background-subtle p-4">
            <div className="text-[11px] uppercase tracking-wide text-foreground-meta font-medium mb-3">
              Recent SOPs
            </div>
            <div className="space-y-1">
              {recentSOPs.map((s) => (
                <Link
                  key={s.id}
                  href={`/sops/${s.id}`}
                  className="block px-2 py-2 -mx-2 rounded-md hover:bg-background-muted/60 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <FileText className="size-3.5 text-foreground-subtle shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs text-foreground truncate">{s.name}</div>
                      <div className="text-[11px] text-foreground-subtle font-mono truncate">
                        {s.filename} · {s.pages}p · parsed {s.uploadedAt}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      <Footer />

      {parsing && <ParsingAnimation onComplete={handleComplete} />}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon: Icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof UploadCloud;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
        active
          ? 'bg-background-elevated text-foreground'
          : 'text-foreground-muted hover:bg-background-elevated/60 hover:text-foreground',
      )}
    >
      <Icon className="size-3.5" />
      {children}
    </button>
  );
}
