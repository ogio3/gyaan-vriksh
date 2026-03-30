'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Step = 'code' | 'age' | 'name';
type AgeBracket = 'under_10' | '10_12' | '13_15' | '16_17';

function computeAgeBracket(year: number, month: number): AgeBracket {
  const now = new Date();
  const birthDate = new Date(year, month - 1);
  let age = now.getFullYear() - birthDate.getFullYear();
  const monthDiff = now.getMonth() - birthDate.getMonth();
  if (monthDiff < 0) age--;

  if (age < 10) return 'under_10';
  if (age <= 12) return '10_12';
  if (age <= 15) return '13_15';
  return '16_17';
}

export default function JoinPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('code');
  const [joinCode, setJoinCode] = useState('');
  const [birthMonth, setBirthMonth] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [ageBracket, setAgeBracket] = useState<AgeBracket | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function handleAgeSubmit() {
    const month = parseInt(birthMonth, 10);
    const year = parseInt(birthYear, 10);

    if (!month || !year || month < 1 || month > 12) {
      setError('Please enter a valid month and year.');
      return;
    }

    const bracket = computeAgeBracket(year, month);

    if (bracket === 'under_10') {
      setError(
        'This app is designed for ages 10-15. Please ask a parent or teacher for help.',
      );
      return;
    }

    setAgeBracket(bracket);
    setError('');
    setStep('name');
  }

  async function handleJoin() {
    if (!displayName.trim()) {
      setError('Please choose a nickname.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/student-join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          joinCode: joinCode.toUpperCase().trim(),
          displayName: displayName.trim(),
          ageBracket,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? 'Failed to join. Please try again.');
        return;
      }

      router.push('/explore');
    } catch {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex flex-1 items-center justify-center">
      <div className="flex w-full max-w-sm flex-col gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Join a class</h1>

        {step === 'code' && (
          <>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Enter the class code from your teacher
            </p>
            <input
              type="text"
              placeholder="Class code (e.g., ABC123)"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              maxLength={6}
              className="min-h-[44px] rounded-md border border-zinc-300 px-3 py-2.5 text-center text-lg font-mono tracking-widest uppercase dark:border-zinc-700 dark:bg-zinc-900"
            />
            {error && (
              <p className="text-sm text-red-600 dark:text-red-400" role="alert">
                {error}
              </p>
            )}
            <button
              onClick={() => {
                if (joinCode.trim().length !== 6) {
                  setError('Please enter a 6-character class code.');
                  return;
                }
                setError('');
                setStep('age');
              }}
              className="min-h-[44px] rounded-md bg-zinc-900 px-3 py-2.5 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
            >
              Next
            </button>
          </>
        )}

        {step === 'age' && (
          <>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              How old are you?
            </p>
            <div className="flex gap-3">
              <select
                value={birthMonth}
                onChange={(e) => setBirthMonth(e.target.value)}
                className="min-h-[44px] flex-1 rounded-md border border-zinc-300 px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              >
                <option value="">Month</option>
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {new Date(2000, i).toLocaleString('en', { month: 'long' })}
                  </option>
                ))}
              </select>
              <input
                type="number"
                placeholder="Year"
                value={birthYear}
                onChange={(e) => setBirthYear(e.target.value)}
                min={2000}
                max={new Date().getFullYear()}
                className="min-h-[44px] w-24 rounded-md border border-zinc-300 px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              />
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              Only your age range is saved. Your birth date is never stored.
            </p>
            {error && (
              <p className="text-sm text-red-600 dark:text-red-400" role="alert">
                {error}
              </p>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setError('');
                  setStep('code');
                }}
                className="min-h-[44px] flex-1 rounded-md border border-zinc-300 px-3 py-2.5 text-sm dark:border-zinc-700"
              >
                Back
              </button>
              <button
                onClick={handleAgeSubmit}
                className="min-h-[44px] flex-1 rounded-md bg-zinc-900 px-3 py-2.5 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
              >
                Next
              </button>
            </div>
          </>
        )}

        {step === 'name' && (
          <>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Choose a nickname (not your real name)
            </p>
            <input
              type="text"
              placeholder="Nickname"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={30}
              className="min-h-[44px] rounded-md border border-zinc-300 px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            />
            {error && (
              <p className="text-sm text-red-600 dark:text-red-400" role="alert">
                {error}
              </p>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setError('');
                  setStep('age');
                }}
                className="min-h-[44px] flex-1 rounded-md border border-zinc-300 px-3 py-2.5 text-sm dark:border-zinc-700"
              >
                Back
              </button>
              <button
                onClick={handleJoin}
                disabled={loading}
                className="min-h-[44px] flex-1 rounded-md bg-zinc-900 px-3 py-2.5 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
              >
                {loading ? 'Joining...' : 'Join class'}
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
