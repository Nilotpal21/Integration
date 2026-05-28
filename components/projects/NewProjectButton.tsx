'use client';

import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import {
  Plus,
  ChevronDown,
  FileStack,
  Upload,
  Copy,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';
import { toast } from 'sonner';

interface CreateOption {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
}

const options: CreateOption[] = [
  {
    id: 'scratch',
    label: 'Create from scratch',
    description: 'Empty project with default channels and tenant-wide knowledge.',
    icon: Plus,
  },
  {
    id: 'template',
    label: 'Create from template…',
    description: 'Card Services, Member Onboarding, Lending, Collections starters.',
    icon: FileStack,
  },
  {
    id: 'clone',
    label: 'Clone existing project',
    description: 'Duplicate any project you have access to, including settings.',
    icon: Copy,
  },
  {
    id: 'import',
    label: 'Import from another tenant',
    description: 'Bring a project config across credit-union tenants you administer.',
    icon: Upload,
  },
];

export function NewProjectButton() {
  const handleCreateScratch = () => {
    toast.info('Create from scratch', {
      description: 'A blank project would open with a naming prompt.',
    });
  };

  const handleSelect = (id: string) => {
    const opt = options.find((o) => o.id === id);
    if (!opt) return;
    toast.info(opt.label, { description: opt.description });
  };

  return (
    <div className="inline-flex items-stretch h-9 rounded-md bg-accent text-accent-foreground overflow-hidden focus-within:ring-2 focus-within:ring-border-focus/40">
      <button
        type="button"
        onClick={handleCreateScratch}
        className="pl-3 pr-3 text-xs font-medium hover:bg-accent-muted transition-colors flex items-center gap-1.5 focus:outline-none"
      >
        <Plus className="size-3.5" />
        New Project
      </button>

      <span className="w-px bg-accent-foreground/15" aria-hidden="true" />

      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button
            type="button"
            aria-label="More create options"
            className="px-2 hover:bg-accent-muted transition-colors flex items-center justify-center focus:outline-none data-[state=open]:bg-accent-muted"
          >
            <ChevronDown className="size-3.5" />
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            align="end"
            sideOffset={6}
            className="z-50 min-w-[300px] rounded-lg border border-border bg-background-elevated shadow-xl p-1 animate-fade-in"
          >
            <div className="px-3 py-2 text-[10px] uppercase tracking-wide text-foreground-meta font-medium">
              Create a project
            </div>
            {options.map((o) => {
              const Icon = o.icon;
              return (
                <DropdownMenu.Item
                  key={o.id}
                  onSelect={() => handleSelect(o.id)}
                  className="flex items-start gap-2.5 px-3 py-2 rounded-md text-xs cursor-pointer outline-none focus:bg-background-muted data-[highlighted]:bg-background-muted"
                >
                  <Icon className="size-3.5 text-foreground-muted shrink-0 mt-0.5" />
                  <span className="min-w-0">
                    <span className="block text-foreground font-medium">{o.label}</span>
                    <span className="block text-[11px] text-foreground-muted leading-snug">
                      {o.description}
                    </span>
                  </span>
                </DropdownMenu.Item>
              );
            })}
            <DropdownMenu.Separator className="my-1 h-px bg-border-muted" />
            <DropdownMenu.Item
              onSelect={() =>
                toast.info('Ask Helper to set up a project for me', {
                  description: 'The Helper would walk you through it interactively.',
                })
              }
              className="flex items-center gap-2.5 px-3 py-2 rounded-md text-xs cursor-pointer outline-none focus:bg-background-muted data-[highlighted]:bg-background-muted text-purple"
            >
              <Sparkles className="size-3.5 shrink-0" />
              <span>Ask Helper to set this up for me</span>
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </div>
  );
}
