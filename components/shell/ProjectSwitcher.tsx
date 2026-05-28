'use client';

import Link from 'next/link';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { FolderKanban, ChevronDown, Check, ArrowUpRight } from 'lucide-react';
import { projects, getProjectById } from '@/lib/mock-data';
import { usePersona } from '@/lib/persona';

export function ProjectSwitcher() {
  const activeProjectId = usePersona((s) => s.activeProjectId);
  const setActiveProject = usePersona((s) => s.setActiveProject);
  const active = getProjectById(activeProjectId);

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          className="flex items-center gap-1.5 px-2 py-1 rounded-md text-foreground-muted hover:bg-background-elevated hover:text-foreground transition-colors text-xs"
          aria-label="Switch project"
        >
          <FolderKanban className="size-3.5 text-foreground-subtle" />
          <span className="truncate max-w-[140px]">{active?.name ?? 'No project'}</span>
          <ChevronDown className="size-3" />
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="start"
          sideOffset={6}
          className="z-50 min-w-[260px] rounded-lg border border-border bg-background-elevated shadow-xl p-1 animate-fade-in"
        >
          <div className="px-3 py-2 text-[10px] uppercase tracking-wide text-foreground-meta font-medium">
            Switch project
          </div>
          {projects
            .filter((p) => p.status === 'active')
            .map((p) => {
              const isActive = p.id === activeProjectId;
              return (
                <DropdownMenu.Item
                  key={p.id}
                  onSelect={() => setActiveProject(p.id)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-md text-xs cursor-pointer outline-none focus:bg-background-muted data-[highlighted]:bg-background-muted"
                >
                  <FolderKanban className="size-3.5 text-foreground-muted shrink-0" />
                  <span className="flex-1 min-w-0">
                    <span className="block text-foreground font-medium truncate">
                      {p.name}
                    </span>
                    <span className="block text-[11px] text-foreground-muted">
                      {p.appCount} apps · {p.memberCount} members
                    </span>
                  </span>
                  {isActive && <Check className="size-3.5 text-foreground-muted shrink-0" />}
                </DropdownMenu.Item>
              );
            })}
          <DropdownMenu.Separator className="my-1 h-px bg-border-muted" />
          <DropdownMenu.Item asChild>
            <Link
              href="/projects"
              className="flex items-center gap-2 px-3 py-2 rounded-md text-xs text-foreground-muted hover:text-foreground cursor-pointer outline-none focus:bg-background-muted data-[highlighted]:bg-background-muted"
            >
              View all projects
              <ArrowUpRight className="size-3" />
            </Link>
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
