'use client';

import { useActionState } from 'react';
import { signIn, type SignInState } from './actions';

export default function SignInPage() {
  const [state, action, pending] = useActionState<SignInState, FormData>(
    signIn,
    null,
  );

  return (
    <main className="flex flex-1 items-center justify-center">
      <form action={action} className="flex w-full max-w-sm flex-col gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          For teachers and parents
        </p>

        <label htmlFor="email" className="sr-only">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          placeholder="Email"
          autoFocus
          required
          className="min-h-[44px] rounded-md border border-zinc-300 px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />

        <label htmlFor="password" className="sr-only">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          placeholder="Password"
          required
          aria-describedby={state?.error ? 'sign-in-error' : undefined}
          className="min-h-[44px] rounded-md border border-zinc-300 px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />

        {state?.error && (
          <p
            id="sign-in-error"
            className="text-sm text-red-600 dark:text-red-400"
            role="alert"
          >
            {state.error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="min-h-[44px] rounded-md bg-zinc-900 px-3 py-2.5 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
        >
          {pending ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
    </main>
  );
}
