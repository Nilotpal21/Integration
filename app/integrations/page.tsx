'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useActiveProjectId } from '@/lib/persona';

export default function IntegrationsPage() {
  const router = useRouter();
  const activeProjectId = useActiveProjectId();

  useEffect(() => {
    router.replace(`/projects/${activeProjectId}`);
  }, [activeProjectId, router]);

  return null;
}
