'use client';

import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { ChevronDown, LayoutTemplate, Plus, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function AddConnectionMenu({
  appId,
  returnTo,
}: {
  appId: string;
  returnTo: string;
}) {
  const router = useRouter();

  function openWizard(mode: 'scratch' | 'template') {
    const params = new URLSearchParams({
      mode,
      appId,
      returnTo,
    });

    router.push(`/integrations/new?${params.toString()}`);
  }

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent-muted"
        >
          <Plus className="size-4" />
          Add connection
          <ChevronDown className="size-4" />
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className="z-[90] min-w-[260px] rounded-xl border border-border bg-background p-2 shadow-[0_20px_60px_rgba(15,23,42,0.18)]"
        >
          <DropdownMenu.Item
            onSelect={() => openWizard('scratch')}
            className="flex cursor-pointer items-start gap-3 rounded-lg px-3 py-3 outline-none transition-colors hover:bg-background-muted focus:bg-background-muted"
          >
            <Sparkles className="mt-0.5 size-4 text-accent" />
            <div>
              <div className="text-sm font-medium text-foreground">Start from scratch</div>
              <div className="mt-1 text-xs leading-5 text-foreground-muted">
                Use current API docs and generate a new connector flow.
              </div>
            </div>
          </DropdownMenu.Item>

          <DropdownMenu.Item
            onSelect={() => openWizard('template')}
            className="flex cursor-pointer items-start gap-3 rounded-lg px-3 py-3 outline-none transition-colors hover:bg-background-muted focus:bg-background-muted"
          >
            <LayoutTemplate className="mt-0.5 size-4 text-foreground-subtle" />
            <div>
              <div className="text-sm font-medium text-foreground">Use existing template</div>
              <div className="mt-1 text-xs leading-5 text-foreground-muted">
                Start from a vetted baseline and keep the connector independent.
              </div>
            </div>
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
