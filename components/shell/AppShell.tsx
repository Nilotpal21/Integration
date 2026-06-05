'use client';

import { useEffect, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Toaster } from 'sonner';
import { Topbar } from './Topbar';
import { Sidebar } from './Sidebar';
import { useAuth } from '@/lib/auth';

const PRE_AUTH_ROUTES = ['/login', '/forgot-password', '/reset-password', '/invite', '/auth'];

function isPreAuthRoute(pathname: string): boolean {
  return PRE_AUTH_ROUTES.some((r) => pathname === r || pathname.startsWith(`${r}/`));
}

/** The Projects listing page is full-width; the sidebar appears only once you're inside a project. */
function hidesSidebar(pathname: string): boolean {
  return pathname === '/projects';
}

export function AppShell({ children }: { children: ReactNode }) {
  const isAuthenticated = useAuth((s) => s.isAuthenticated);
  const pathname = usePathname();
  const router = useRouter();
  const preAuth = isPreAuthRoute(pathname);

  useEffect(() => {
    if (!isAuthenticated && !preAuth) {
      router.replace('/login');
    }
  }, [isAuthenticated, preAuth, router]);

  if (preAuth) {
    return <>{children}</>;
  }

  if (!isAuthenticated) {
    return null;
  }

  const hideSidebar = hidesSidebar(pathname);

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Topbar />
      <div className="flex-1 flex min-h-0">
        {!hideSidebar && <Sidebar />}
        <main className="flex-1 overflow-y-auto scrollbar-thin">
          <div className="max-w-[1180px] mx-auto px-3 py-3 animate-fade-in">{children}</div>
        </main>
      </div>
      <Toaster
        theme="light"
        position="bottom-right"
        toastOptions={{
          style: {
            background: 'hsl(0 0% 100%)',
            border: '1px solid hsl(220 20% 86%)',
            color: 'hsl(221 39% 18%)',
            fontSize: 13,
            boxShadow: '0 18px 40px rgba(15, 23, 42, 0.08)',
          },
        }}
      />
    </div>
  );
}
