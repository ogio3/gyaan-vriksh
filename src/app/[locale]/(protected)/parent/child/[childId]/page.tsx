'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { ParentSettings } from '@/types/database';
import { ShareGuard } from '@/components/safety/ShareGuard';

export default function ChildDetailPage() {
  const { childId } = useParams<{ childId: string }>();
  const router = useRouter();
  const [settings, setSettings] = useState<ParentSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    fetch(`/api/parent/settings?childId=${childId}`)
      .then((r) => r.json())
      .then(setSettings)
      .finally(() => setLoading(false));
  }, [childId]);

  async function saveSettings(updates: Partial<{
    dailyLimitMinutes: number;
    accountPaused: boolean;
    notificationFrequency: string;
  }>) {
    setSaving(true);
    const response = await fetch('/api/parent/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ childId, ...updates }),
    });
    if (response.ok) {
      const updated = await response.json();
      setSettings(updated);
    }
    setSaving(false);
  }

  async function deleteChildData() {
    const response = await fetch('/api/parent/delete-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ childId }),
    });
    if (response.ok) {
      router.push('/parent');
    }
  }

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="h-8 w-48 animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-800" />
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm text-zinc-500">Settings not found.</p>
      </div>
    );
  }

  return (
    <ShareGuard>
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push('/parent')}
          className="text-sm text-zinc-500 hover:text-zinc-700"
        >
          &larr; Back
        </button>
        <h1 className="text-2xl font-semibold tracking-tight">
          Child Settings
        </h1>
      </div>

      {/* Time Limit */}
      <section className="rounded-md border border-zinc-200 p-4 dark:border-zinc-700">
        <h2 className="font-medium">Daily Time Limit</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Maximum minutes per day your child can use the platform.
        </p>
        <div className="mt-3 flex items-center gap-3">
          <input
            type="number"
            min={0}
            max={480}
            value={settings.daily_limit_minutes}
            onChange={(e) =>
              setSettings({
                ...settings,
                daily_limit_minutes: parseInt(e.target.value, 10) || 0,
              })
            }
            className="w-24 rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
          <span className="text-sm text-zinc-500">minutes</span>
          <button
            onClick={() =>
              saveSettings({ dailyLimitMinutes: settings.daily_limit_minutes })
            }
            disabled={saving}
            className="rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
          >
            Save
          </button>
        </div>
      </section>

      {/* Pause Account */}
      <section className="rounded-md border border-zinc-200 p-4 dark:border-zinc-700">
        <h2 className="font-medium">Pause Account</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Temporarily disable your child&apos;s access to the platform.
        </p>
        <div className="mt-3">
          <button
            onClick={() =>
              saveSettings({ accountPaused: !settings.account_paused })
            }
            disabled={saving}
            className={`rounded-md px-4 py-2 text-sm font-medium ${
              settings.account_paused
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-amber-600 text-white hover:bg-amber-700'
            } disabled:opacity-50`}
          >
            {settings.account_paused ? 'Resume Access' : 'Pause Access'}
          </button>
          {settings.account_paused && (
            <p className="mt-2 text-sm text-amber-600 dark:text-amber-400">
              Account is currently paused. Your child cannot access the platform.
            </p>
          )}
        </div>
      </section>

      {/* Notification Frequency */}
      <section className="rounded-md border border-zinc-200 p-4 dark:border-zinc-700">
        <h2 className="font-medium">Session Notifications</h2>
        <p className="mt-1 text-sm text-zinc-500">
          How often to receive summaries of your child&apos;s explorations.
        </p>
        <div className="mt-3 flex gap-3">
          {(['realtime', 'daily', 'weekly'] as const).map((freq) => (
            <button
              key={freq}
              onClick={() => saveSettings({ notificationFrequency: freq })}
              disabled={saving}
              className={`rounded-md px-3 py-2 text-sm ${
                settings.notification_frequency === freq
                  ? 'bg-zinc-900 font-medium text-white dark:bg-zinc-100 dark:text-zinc-900'
                  : 'border border-zinc-300 dark:border-zinc-700'
              } disabled:opacity-50`}
            >
              {freq.charAt(0).toUpperCase() + freq.slice(1)}
            </button>
          ))}
        </div>
      </section>

      {/* Delete Data */}
      <section className="rounded-md border border-red-200 p-4 dark:border-red-800">
        <h2 className="font-medium text-red-600 dark:text-red-400">
          Delete All Data
        </h2>
        <p className="mt-1 text-sm text-zinc-500">
          Permanently delete all of your child&apos;s data. This cannot be undone.
        </p>
        <div className="mt-3">
          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
            >
              Request Data Deletion
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <p className="text-sm text-red-600 dark:text-red-400">
                Are you sure? This will permanently delete all data.
              </p>
              <button
                onClick={deleteChildData}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                Confirm Delete
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="text-sm text-zinc-500"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
    </ShareGuard>
  );
}
