'use server';

import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { rateLimit } from '@/lib/rate-limit';

export type SignUpState = {
  error?: string;
  success?: boolean;
} | null;

export async function signUp(
  _prev: SignUpState,
  formData: FormData,
): Promise<SignUpState> {
  const headerStore = await headers();
  const ip = headerStore.get('x-forwarded-for') ?? 'unknown';
  const { success } = rateLimit(ip, 3, 60_000);

  if (!success) {
    return { error: 'Too many attempts. Please wait a minute.' };
  }

  const email = formData.get('email');
  const password = formData.get('password');
  const displayName = formData.get('displayName');
  const role = formData.get('role');

  if (typeof email !== 'string' || !email) {
    return { error: 'Email is required.' };
  }

  if (typeof password !== 'string' || password.length < 8) {
    return { error: 'Password must be at least 8 characters.' };
  }

  if (typeof displayName !== 'string' || !displayName.trim()) {
    return { error: 'Display name is required.' };
  }

  if (role !== 'teacher' && role !== 'parent') {
    return { error: 'Please select a role.' };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        role,
        display_name: displayName.trim(),
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  redirect(role === 'teacher' ? '/dashboard' : '/parent');
}
