'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface ChildInfo {
  child_id: string;
  consent_status: string;
  profiles: {
    display_name: string;
    age_bracket: string | null;
  };
}

export default function ParentPage() {
  const [children, setChildren] = useState<ChildInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/parent/children')
      .then((r) => r.json())
      .then(setChildren)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="h-8 w-48 animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-800" />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">My Children</h1>
        <Link
          href="/join/parent"
          className="rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
        >
          Link another child
        </Link>
      </div>

      {children.length === 0 ? (
        <div className="text-center">
          <p className="text-sm text-zinc-500">No children linked yet.</p>
          <Link
            href="/join/parent"
            className="mt-2 inline-block text-sm text-blue-600 hover:underline"
          >
            Link your child using a parent code
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {children.map((child) => (
            <Link
              key={child.child_id}
              href={`/parent/child/${child.child_id}`}
              className="block rounded-md border border-zinc-200 p-4 transition-colors hover:border-zinc-400 dark:border-zinc-700 dark:hover:border-zinc-500"
            >
              <h3 className="font-medium">{child.profiles.display_name}</h3>
              <p className="mt-1 text-sm text-zinc-500">
                Age group: {child.profiles.age_bracket?.replace('_', '-') ?? 'Unknown'}
              </p>
              <p className="mt-1 text-xs text-zinc-400">
                Consent: {child.consent_status}
              </p>
              <p className="mt-2 text-xs text-blue-600 dark:text-blue-400">
                Manage settings &rarr;
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
