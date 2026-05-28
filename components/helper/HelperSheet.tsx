'use client';

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import {
  Sparkles,
  X,
  MoreHorizontal,
  ArrowUp,
  RotateCcw,
  ExternalLink,
  Check,
} from 'lucide-react';
import { useHelper, getContextSpec } from '@/lib/helper-state';
import { cn } from '@/lib/utils';

export function HelperSheet() {
  const isOpen = useHelper((s) => s.isOpen);
  const context = useHelper((s) => s.context);
  const turns = useHelper((s) => s.turns);
  const close = useHelper((s) => s.close);
  const ask = useHelper((s) => s.ask);
  const reset = useHelper((s) => s.reset);

  const spec = getContextSpec(context.kind);
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const [appliedActions, setAppliedActions] = useState<Set<string>>(new Set());
  const [skippedActions, setSkippedActions] = useState<Set<string>>(new Set());

  // Auto-scroll to latest turn
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [turns.length, isOpen]);

  const handleSubmit = (e?: FormEvent) => {
    e?.preventDefault();
    const text = input.trim();
    if (!text) return;
    ask(text);
    setInput('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleClearConversation = () => reset();

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => (open ? null : close())}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-background/40 backdrop-blur-[2px] animate-fade-in" />
        <Dialog.Content
          className={cn(
            'fixed top-0 right-0 z-50 h-screen w-[480px] max-w-[100vw]',
            'bg-background-elevated border-l border-border shadow-2xl flex flex-col',
            'data-[state=open]:animate-fade-in',
          )}
          aria-describedby={undefined}
        >
          {/* Header */}
          <header className="flex items-start justify-between gap-2 px-5 py-4 border-b border-border-muted shrink-0">
            <div className="flex items-start gap-2.5 min-w-0">
              <div className="size-7 rounded-md bg-purple/15 text-purple flex items-center justify-center shrink-0">
                <Sparkles className="size-4" />
              </div>
              <div className="min-w-0">
                <Dialog.Title className="text-sm font-semibold tracking-tight">
                  AI Helper
                </Dialog.Title>
                <p className="text-[11px] text-foreground-muted font-mono truncate">
                  {context.label}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <DropdownMenu.Root>
                <DropdownMenu.Trigger asChild>
                  <button
                    type="button"
                    className="size-7 rounded-md hover:bg-background-muted text-foreground-muted hover:text-foreground transition-colors flex items-center justify-center"
                    aria-label="Helper options"
                  >
                    <MoreHorizontal className="size-4" />
                  </button>
                </DropdownMenu.Trigger>
                <DropdownMenu.Portal>
                  <DropdownMenu.Content
                    align="end"
                    sideOffset={6}
                    className="z-[60] min-w-[200px] rounded-lg border border-border bg-background-elevated shadow-xl p-1 animate-fade-in"
                  >
                    <DropdownMenu.Item
                      onSelect={handleClearConversation}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-md text-xs cursor-pointer outline-none focus:bg-background-muted data-[highlighted]:bg-background-muted text-foreground-muted hover:text-foreground"
                    >
                      <RotateCcw className="size-3.5" />
                      Clear conversation
                    </DropdownMenu.Item>
                    <DropdownMenu.Item
                      className="flex items-center gap-2.5 px-3 py-2 rounded-md text-xs cursor-pointer outline-none focus:bg-background-muted data-[highlighted]:bg-background-muted text-foreground-muted hover:text-foreground"
                      onSelect={(e) => e.preventDefault()}
                    >
                      <ExternalLink className="size-3.5" />
                      Open in new window
                    </DropdownMenu.Item>
                  </DropdownMenu.Content>
                </DropdownMenu.Portal>
              </DropdownMenu.Root>
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="size-7 rounded-md hover:bg-background-muted text-foreground-muted hover:text-foreground transition-colors flex items-center justify-center"
                  aria-label="Close Helper"
                >
                  <X className="size-4" />
                </button>
              </Dialog.Close>
            </div>
          </header>

          {/* Body */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto scrollbar-thin px-5 py-4 space-y-4"
          >
            {turns.length === 0 && (
              <div className="space-y-4 animate-fade-in">
                {/* Welcome bubble */}
                <div className="flex items-start gap-2">
                  <div className="size-6 rounded-md bg-purple/15 text-purple flex items-center justify-center shrink-0 mt-0.5">
                    <Sparkles className="size-3.5" />
                  </div>
                  <div className="bg-background-muted/70 rounded-md px-3 py-2 text-sm leading-relaxed text-foreground max-w-[90%]">
                    {spec.welcome}
                  </div>
                </div>

                {/* Suggestion chips */}
                <div className="space-y-1.5 pt-2">
                  <div className="text-[10px] uppercase tracking-wide text-foreground-meta font-medium">
                    Try one of these
                  </div>
                  {spec.suggestions.map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => ask(chip)}
                      className="w-full text-left text-xs px-3 py-2 rounded-md bg-background-muted/40 hover:bg-background-muted text-foreground-muted hover:text-foreground transition-colors border border-border-muted"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {turns.map((turn, i) => (
              <div key={turn.id} className="animate-fade-in">
                {turn.role === 'user' && (
                  <div className="flex justify-end">
                    <div className="bg-background-elevated rounded-md px-3 py-2 text-sm leading-relaxed text-foreground max-w-[85%] border border-border-muted">
                      {turn.text}
                    </div>
                  </div>
                )}

                {turn.role === 'helper' && (
                  <div className="flex items-start gap-2">
                    <div className="size-6 rounded-md bg-purple/15 text-purple flex items-center justify-center shrink-0 mt-0.5">
                      <Sparkles className="size-3.5" />
                    </div>
                    <div className="flex-1 min-w-0 max-w-[90%]">
                      <div className="bg-background-muted/70 rounded-md px-3 py-2 text-sm leading-relaxed text-foreground">
                        {turn.text}
                      </div>

                      {turn.citations && turn.citations.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {turn.citations.map((c, j) => (
                            <div
                              key={j}
                              className="text-[11px] text-foreground-subtle border-l-2 border-border pl-2 font-mono"
                              title={c.snippet}
                            >
                              <span className="text-foreground-muted">{c.ref}</span>
                              <span className="block text-foreground-subtle leading-snug normal-case font-sans">
                                {c.snippet}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {turn.action && (
                        <div className="mt-3 rounded-md border border-purple/30 bg-purple/5 p-3">
                          <div className="flex items-start gap-2 mb-2">
                            <Sparkles className="size-3 text-purple shrink-0 mt-0.5" />
                            <div className="min-w-0">
                              <div className="text-xs font-medium text-foreground">
                                {turn.action.label}
                              </div>
                              {turn.action.preview && (
                                <div className="text-[11px] text-foreground-muted mt-0.5">
                                  {turn.action.preview}
                                </div>
                              )}
                            </div>
                          </div>
                          {appliedActions.has(turn.id) ? (
                            <div className="flex items-center gap-1.5 text-[11px] text-success">
                              <Check className="size-3" />
                              Applied
                            </div>
                          ) : skippedActions.has(turn.id) ? (
                            <div className="text-[11px] text-foreground-subtle">Skipped.</div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  setAppliedActions((prev) => new Set(prev).add(turn.id))
                                }
                                className="h-7 px-2.5 rounded-md text-[11px] font-medium bg-purple text-purple-foreground hover:bg-purple/85 transition-colors"
                              >
                                Confirm
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setSkippedActions((prev) => new Set(prev).add(turn.id))
                                }
                                className="h-7 px-2.5 rounded-md text-[11px] font-medium text-foreground-muted hover:text-foreground hover:bg-background-elevated transition-colors"
                              >
                                Skip
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {turn.role === 'system' && (
                  <div className="text-center">
                    <span className="text-[11px] text-foreground-subtle italic">{turn.text}</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Footer input */}
          <footer className="border-t border-border-muted px-4 py-3 shrink-0">
            <form onSubmit={handleSubmit} className="relative">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask me anything about the platform or your apps…"
                rows={1}
                className="w-full max-h-[140px] bg-background-muted/60 border border-border-muted rounded-md pl-3 pr-10 py-2 text-sm text-foreground placeholder:text-foreground-subtle focus:outline-none focus:ring-1 focus:ring-border-focus/40 resize-none scrollbar-thin"
              />
              <button
                type="submit"
                disabled={!input.trim()}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 size-7 rounded-md bg-foreground text-background hover:bg-foreground-muted transition-colors flex items-center justify-center disabled:bg-background-elevated disabled:text-foreground-subtle disabled:cursor-not-allowed"
                aria-label="Send"
              >
                <ArrowUp className="size-3.5" />
              </button>
            </form>
            <div className="flex items-center justify-between mt-1.5 text-[10px] text-foreground-subtle">
              <span>
                ⏎ Send <span className="text-foreground-subtle">·</span> Shift+⏎ New line
              </span>
              <span className="font-mono">Helper memory: this conversation only</span>
            </div>
          </footer>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
