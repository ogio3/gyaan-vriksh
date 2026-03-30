import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

function generateJoinCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.user_metadata?.role !== 'teacher') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('classes')
    .select(
      `
      *,
      class_memberships(count)
    `,
    )
    .eq('teacher_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.user_metadata?.role !== 'teacher') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = (await request.json()) as { name?: string; maxStudents?: number };

  if (!body.name || typeof body.name !== 'string' || !body.name.trim()) {
    return NextResponse.json(
      { error: 'Class name is required.' },
      { status: 400 },
    );
  }

  const { data, error } = await supabase
    .from('classes')
    .insert({
      teacher_id: user.id,
      name: body.name.trim(),
      join_code: generateJoinCode(),
      parent_code: generateJoinCode(),
      max_students: body.maxStudents ?? 50,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
