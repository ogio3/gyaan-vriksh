import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { AgeBracket } from '@/types/database';

const VALID_AGE_BRACKETS: AgeBracket[] = ['10_12', '13_15', '16_17'];

export async function POST(request: Request) {
  const body = (await request.json()) as {
    joinCode?: string;
    displayName?: string;
    ageBracket?: string;
    locale?: string;
  };

  const { joinCode, displayName, ageBracket, locale } = body;

  if (!joinCode || typeof joinCode !== 'string') {
    return NextResponse.json(
      { error: 'Class code is required.' },
      { status: 400 },
    );
  }

  if (!displayName || typeof displayName !== 'string' || !displayName.trim()) {
    return NextResponse.json(
      { error: 'Display name is required.' },
      { status: 400 },
    );
  }

  if (
    !ageBracket ||
    !VALID_AGE_BRACKETS.includes(ageBracket as AgeBracket)
  ) {
    return NextResponse.json(
      { error: 'Valid age bracket is required.' },
      { status: 400 },
    );
  }

  // Use service role to bypass RLS for join flow
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  // Verify class code exists and is active
  const { data: classData, error: classError } = await supabase
    .from('classes')
    .select('id, name, max_students')
    .eq('join_code', joinCode.toUpperCase().trim())
    .eq('is_active', true)
    .single();

  if (classError || !classData) {
    return NextResponse.json(
      { error: 'Invalid or inactive class code.' },
      { status: 404 },
    );
  }

  // Check class capacity
  const { count } = await supabase
    .from('class_memberships')
    .select('*', { count: 'exact', head: true })
    .eq('class_id', classData.id);

  if (count !== null && count >= classData.max_students) {
    return NextResponse.json(
      { error: 'This class is full.' },
      { status: 409 },
    );
  }

  // Create anonymous user
  const { data: authData, error: authError } =
    await supabase.auth.admin.createUser({
      email: `${crypto.randomUUID()}@student.local`,
      email_confirm: true,
      user_metadata: {
        role: 'student',
        display_name: displayName.trim(),
        age_bracket: ageBracket,
        locale: locale ?? 'en',
      },
    });

  if (authError || !authData.user) {
    return NextResponse.json(
      { error: 'Failed to create student account.' },
      { status: 500 },
    );
  }

  // Create class membership (service role, bypassing RLS)
  const { error: membershipError } = await supabase
    .from('class_memberships')
    .insert({
      class_id: classData.id,
      student_id: authData.user.id,
    });

  if (membershipError) {
    // Rollback: delete the created user
    await supabase.auth.admin.deleteUser(authData.user.id);
    return NextResponse.json(
      { error: 'Failed to join class.' },
      { status: 500 },
    );
  }

  // Generate a session for the student
  const { data: sessionData, error: sessionError } =
    await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: authData.user.email!,
    });

  if (sessionError || !sessionData) {
    return NextResponse.json(
      { error: 'Failed to create session.' },
      { status: 500 },
    );
  }

  return NextResponse.json({
    userId: authData.user.id,
    className: classData.name,
    token: sessionData.properties?.hashed_token,
  });
}
