'use client';

import * as Popover from '@radix-ui/react-popover';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export function PickerSelect({
  label,
  value,
  options,
  onChange,
  triggerClassName,
  contentClassName,
  labelClassName,
}: {
  label?: string;
  value: string;
  options: Array<{ value: string; label: string; description?: string }>;
  onChange: (value: string) => void;
  triggerClassName?: string;
  contentClassName?: string;
  labelClassName?: string;
}) {
  const selected = options.find((option) => option.value === value) ?? options[0];

  return (
    <label className="space-y-2">
      {label ? <span className={cn('text-sm text-foreground-muted', labelClassName)}>{label}</span> : null}
      <Popover.Root>
        <Popover.Trigger asChild>
          <button
            type="button"
            className={cn(
              'flex h-12 w-full items-center justify-between rounded-xl border border-border bg-background-subtle px-4 text-left text-sm text-foreground outline-none transition hover:bg-background focus:border-accent/50',
              triggerClassName,
            )}
          >
            <span className="truncate">{selected?.label ?? value}</span>
            <ChevronDown className="size-4 shrink-0 text-foreground-subtle" />
          </button>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content
            align="start"
            sideOffset={8}
            className={cn(
              'z-[140] w-[var(--radix-popover-trigger-width)] rounded-2xl border border-border bg-background p-2 shadow-[0_24px_64px_rgba(15,23,42,0.18)]',
              contentClassName,
            )}
          >
            <div className="max-h-72 overflow-y-auto">
              {options.map((option, index) => {
                const active = option.value === value;
                return (
                  <Popover.Close asChild key={`${option.value}-${index}`}>
                    <button
                      type="button"
                      onClick={() => onChange(option.value)}
                      className={cn(
                        'flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition',
                        active ? 'bg-accent-subtle text-accent' : 'text-foreground hover:bg-background-muted',
                      )}
                    >
                      <div
                        className={cn(
                          'mt-0.5 flex size-5 items-center justify-center rounded-full border',
                          active ? 'border-accent bg-accent text-white' : 'border-border text-transparent',
                        )}
                      >
                        <Check className="size-3.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium">{option.label}</div>
                        {option.description ? (
                          <div className="mt-1 text-xs leading-5 text-foreground-muted">{option.description}</div>
                        ) : null}
                      </div>
                    </button>
                  </Popover.Close>
                );
              })}
            </div>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    </label>
  );
}
