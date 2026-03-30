'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { UserRole } from '@/types/database';

interface NavItem {
  href: string;
  label: string;
}

const NAV_ITEMS: Record<UserRole, NavItem[]> = {
  student: [
    { href: '/explore', label: 'Explore' },
    { href: '/history', label: 'History' },
  ],
  teacher: [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/dashboard/engineers', label: 'Engineers' },
    { href: '/dashboard/philosophy', label: 'Why' },
    { href: '/explore', label: 'Try Explore' },
  ],
  parent: [{ href: '/parent', label: 'My Children' }],
  admin: [{ href: '/dashboard', label: 'Dashboard' }],
};

interface AppShellProps {
  children: React.ReactNode;
  role: UserRole;
  displayName: string;
}

export function AppShell({ children, role, displayName }: AppShellProps) {
  const pathname = usePathname();

  const navItems = NAV_ITEMS[role] ?? [];

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex h-14 items-center border-b border-zinc-200 px-4 dark:border-zinc-800">
        <Link
          href="/"
          className="text-lg font-semibold tracking-tight"
        >
          ज्ञान वृक्ष
        </Link>

        <nav className="ml-8 flex gap-4">
          {navItems.map((item) => {
            const isActive = pathname.includes(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm ${
                  isActive
                    ? 'font-medium text-zinc-900 dark:text-zinc-100'
                    : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <span className="text-xs text-zinc-400 dark:text-zinc-500">
            {displayName}
          </span>
          <form action="/api/auth/sign-out" method="POST">
            <button
              type="submit"
              className="text-xs text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
            >
              Sign out
            </button>
          </form>
        </div>
      </header>

      <main className="flex flex-1 flex-col">{children}</main>
    </div>
  );
}
