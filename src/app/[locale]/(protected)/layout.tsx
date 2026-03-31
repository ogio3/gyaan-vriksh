import { Suspense } from 'react';
import { getProfile } from '@/lib/auth';
import { AppShell } from '@/components/layout/AppShell';
import type { UserRole } from '@/types/database';

async function AuthGate({ children }: { children: React.ReactNode }) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  // Demo mode (no Supabase): show with role switcher
  if (!supabaseUrl) {
    return (
      <AppShell role="teacher" displayName="Demo" isDemo>
        {children}
      </AppShell>
    );
  }

  const profile = await getProfile();

  if (!profile) {
    // Not authenticated — show as demo/guest with role switcher
    return (
      <AppShell role="teacher" displayName="Demo" isDemo>
        {children}
      </AppShell>
    );
  }

  return (
    <AppShell role={(profile.role ?? 'student') as UserRole} displayName={profile.display_name ?? 'User'}>
      {children}
    </AppShell>
  );
}

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<ProtectedSkeleton />}>
      <AuthGate>{children}</AuthGate>
    </Suspense>
  );
}

function ProtectedSkeleton() {
  return (
    <div className="flex min-h-dvh flex-col">
      <div className="h-14 border-b border-zinc-200 dark:border-zinc-800" />
      <main className="flex flex-1 items-center justify-center">
        <div className="h-8 w-48 animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-800" />
      </main>
    </div>
  );
}
