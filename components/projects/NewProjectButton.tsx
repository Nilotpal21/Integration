'use client';

import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';

export function NewProjectButton() {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.push('/integrations/new?mode=scratch&returnTo=/projects')}
      className="inline-flex h-9 items-center gap-2 rounded-md bg-accent px-4 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent-muted"
    >
      <Plus className="size-4" />
      New Project
    </button>
  );
}
