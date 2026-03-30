import { Suspense } from 'react';
import { requireAuth, getProfile } from '@/lib/auth';
import { AppShell } from '@/components/layout/AppShell';
import type { UserRole } from '@/types/database';

async function AuthGate({ children }: { children: React.ReactNode }) {
  await requireAuth();
  const profile = await getProfile();

  const role = (profile?.role ?? 'student') as UserRole;
  const displayName = profile?.display_name ?? 'User';

  return (
    <AppShell role={role} displayName={displayName}>
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
