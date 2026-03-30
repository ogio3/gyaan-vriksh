'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ParentJoinPage() {
  const router = useRouter();
  const [parentCode, setParentCode] = useState('');
  const [childName, setChildName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLink() {
    if (!parentCode.trim() || !childName.trim()) {
      setError('Both fields are required.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/parent/link-child', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parentCode: parentCode.toUpperCase().trim(),
          childDisplayName: childName.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? 'Failed to link child.');
        return;
      }

      router.push('/parent');
    } catch {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex flex-1 items-center justify-center">
      <div className="flex w-full max-w-sm flex-col gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">
          Link your child
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Enter the parent code from your child&apos;s teacher and your
          child&apos;s nickname.
        </p>

        <input
          type="text"
          placeholder="Parent code (e.g., XYZ789)"
          value={parentCode}
          onChange={(e) => setParentCode(e.target.value.toUpperCase())}
          maxLength={6}
          className="min-h-[44px] rounded-md border border-zinc-300 px-3 py-2.5 text-center text-lg font-mono tracking-widest uppercase dark:border-zinc-700 dark:bg-zinc-900"
        />

        <input
          type="text"
          placeholder="Child's nickname in class"
          value={childName}
          onChange={(e) => setChildName(e.target.value)}
          className="min-h-[44px] rounded-md border border-zinc-300 px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />

        {error && (
          <p className="text-sm text-red-600 dark:text-red-400" role="alert">
            {error}
          </p>
        )}

        <button
          onClick={handleLink}
          disabled={loading}
          className="min-h-[44px] rounded-md bg-zinc-900 px-3 py-2.5 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
        >
          {loading ? 'Linking...' : 'Link child'}
        </button>
      </div>
    </main>
  );
}
