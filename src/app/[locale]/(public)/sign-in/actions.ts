'use server';

import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { rateLimit } from '@/lib/rate-limit';

export type SignInState = {
  error?: string;
} | null;

export async function signIn(
  _prev: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const headerStore = await headers();
  const ip = headerStore.get('x-forwarded-for') ?? 'unknown';
  const { success } = rateLimit(ip, 5, 60_000);

  if (!success) {
    return { error: 'Too many attempts. Please wait a minute.' };
  }

  const email = formData.get('email');
  const password = formData.get('password');

  if (typeof email !== 'string' || !email) {
    return { error: 'Email is required.' };
  }

  if (typeof password !== 'string' || !password) {
    return { error: 'Password is required.' };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: 'Invalid email or password.' };
  }

  redirect('/dashboard');
}
