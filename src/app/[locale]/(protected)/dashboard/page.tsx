'use client';

import { useEffect, useState } from 'react';

interface ClassOverview {
  id: string;
  name: string;
  is_active: boolean;
  created_at: string;
  class_memberships: [{ count: number }];
}

interface DashboardData {
  classes: ClassOverview[];
  recentSessions: Array<{
    id: string;
    subject_label: string | null;
    status: string;
    bloom_level_reached: string | null;
    created_at: string;
  }>;
  totalExplorations: number;
  pendingReports: number;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateClass, setShowCreateClass] = useState(false);
  const [newClassName, setNewClassName] = useState('');

  useEffect(() => {
    fetch('/api/dashboard/overview')
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  async function createClass() {
    if (!newClassName.trim()) return;

    const response = await fetch('/api/classes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newClassName.trim() }),
    });

    if (response.ok) {
      setNewClassName('');
      setShowCreateClass(false);
      const updated = await fetch('/api/dashboard/overview').then((r) =>
        r.json(),
      );
      setData(updated);
    }
  }

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
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <button
          onClick={() => setShowCreateClass(true)}
          className="rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
        >
          Create class
        </button>
      </div>

      {showCreateClass && (
        <div className="flex items-center gap-3 rounded-md border border-zinc-200 p-4 dark:border-zinc-700">
          <input
            type="text"
            placeholder="Class name"
            value={newClassName}
            onChange={(e) => setNewClassName(e.target.value)}
            className="min-h-[44px] flex-1 rounded-md border border-zinc-300 px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
          <button
            onClick={createClass}
            className="rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
          >
            Create
          </button>
          <button
            onClick={() => setShowCreateClass(false)}
            className="text-sm text-zinc-500"
          >
            Cancel
          </button>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-md border border-zinc-200 p-4 dark:border-zinc-700">
          <p className="text-sm text-zinc-500">Classes</p>
          <p className="text-2xl font-semibold">{data?.classes.length ?? 0}</p>
        </div>
        <div className="rounded-md border border-zinc-200 p-4 dark:border-zinc-700">
          <p className="text-sm text-zinc-500">Total Explorations</p>
          <p className="text-2xl font-semibold">
            {data?.totalExplorations ?? 0}
          </p>
        </div>
        <div className="rounded-md border border-zinc-200 p-4 dark:border-zinc-700">
          <p className="text-sm text-zinc-500">Pending Reports</p>
          <p className="text-2xl font-semibold">
            {data?.pendingReports ?? 0}
          </p>
        </div>
      </div>

      <section>
        <h2 className="mb-3 text-lg font-medium">Your Classes</h2>
        {data?.classes.length === 0 ? (
          <p className="text-sm text-zinc-500">
            No classes yet. Create one to get started.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {data?.classes.map((cls) => (
              <div
                key={cls.id}
                className="rounded-md border border-zinc-200 p-4 dark:border-zinc-700"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">{cls.name}</h3>
                  <span
                    className={`text-xs ${cls.is_active ? 'text-green-600' : 'text-zinc-400'}`}
                  >
                    {cls.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <p className="mt-1 text-sm text-zinc-500">
                  {cls.class_memberships?.[0]?.count ?? 0} students
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-medium">Recent Explorations</h2>
        {data?.recentSessions.length === 0 ? (
          <p className="text-sm text-zinc-500">No explorations yet.</p>
        ) : (
          <div className="divide-y divide-zinc-200 rounded-md border border-zinc-200 dark:divide-zinc-700 dark:border-zinc-700">
            {data?.recentSessions.slice(0, 10).map((session) => (
              <div key={session.id} className="flex items-center gap-4 p-3">
                <span className="text-sm">
                  {session.subject_label ?? 'Untitled'}
                </span>
                {session.bloom_level_reached && (
                  <span className="rounded bg-zinc-100 px-2 py-0.5 text-xs dark:bg-zinc-800">
                    {session.bloom_level_reached}
                  </span>
                )}
                <span className="ml-auto text-xs text-zinc-400">
                  {new Date(session.created_at).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
