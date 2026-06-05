import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import { AppShell } from '@/components/shell/AppShell';
import './globals.css';

export const metadata: Metadata = {
  title: 'cloudagle.ai — Integration Builder Prototype',
  description:
    'Build, test, and activate independent connectors from docs or templates.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable} dark`}>
      <body
        suppressHydrationWarning
        className="min-h-screen bg-background text-foreground font-sans antialiased"
      >
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
