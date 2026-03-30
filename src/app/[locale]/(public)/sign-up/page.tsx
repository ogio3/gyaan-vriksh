'use client';

import { useActionState } from 'react';
import { signUp, type SignUpState } from './actions';

export default function SignUpPage() {
  const [state, action, pending] = useActionState<SignUpState, FormData>(
    signUp,
    null,
  );

  return (
    <main className="flex flex-1 items-center justify-center">
      <form action={action} className="flex w-full max-w-sm flex-col gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Create account</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          For teachers and parents
        </p>

        <fieldset className="flex gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="role"
              value="teacher"
              defaultChecked
              className="accent-blue-600"
            />
            Teacher
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="role"
              value="parent"
              className="accent-blue-600"
            />
            Parent
          </label>
        </fieldset>

        <input
          name="displayName"
          type="text"
          placeholder="Display name"
          required
          className="min-h-[44px] rounded-md border border-zinc-300 px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />

        <input
          name="email"
          type="email"
          placeholder="Email"
          required
          className="min-h-[44px] rounded-md border border-zinc-300 px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />

        <input
          name="password"
          type="password"
          placeholder="Password (min 8 characters)"
          required
          minLength={8}
          aria-describedby={state?.error ? 'sign-up-error' : undefined}
          className="min-h-[44px] rounded-md border border-zinc-300 px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />

        {state?.error && (
          <p
            id="sign-up-error"
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
          {pending ? 'Creating account...' : 'Create account'}
        </button>
      </form>
    </main>
  );
}
