import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.user_metadata?.role !== 'parent') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { parentCode, childDisplayName } = (await request.json()) as {
    parentCode?: string;
    childDisplayName?: string;
  };

  if (!parentCode || !childDisplayName) {
    return NextResponse.json(
      { error: 'Parent code and child name are required.' },
      { status: 400 },
    );
  }

  const serviceClient = await createServiceClient();

  // Find class by parent code
  const { data: classData } = await serviceClient
    .from('classes')
    .select('id')
    .eq('parent_code', parentCode.toUpperCase().trim())
    .eq('is_active', true)
    .single();

  if (!classData) {
    return NextResponse.json(
      { error: 'Invalid parent code.' },
      { status: 404 },
    );
  }

  // Find child in class by display name
  const { data: memberships } = await serviceClient
    .from('class_memberships')
    .select('student_id, profiles!inner(id, display_name)')
    .eq('class_id', classData.id);

  const match = memberships?.find((m) => {
    const profile = m.profiles as unknown as { display_name: string };
    return (
      profile.display_name.toLowerCase() ===
      childDisplayName.trim().toLowerCase()
    );
  });

  if (!match) {
    return NextResponse.json(
      { error: 'No student with that nickname found in this class.' },
      { status: 404 },
    );
  }

  // Create parent-child link (pending consent)
  const { error: linkError } = await serviceClient
    .from('parent_child_links')
    .insert({
      parent_id: user.id,
      child_id: match.student_id,
      consent_status: 'pending',
    });

  if (linkError) {
    if (linkError.code === '23505') {
      return NextResponse.json(
        { error: 'This child is already linked to your account.' },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: linkError.message }, { status: 500 });
  }

  // Create default parent settings
  await serviceClient.from('parent_settings').insert({
    parent_id: user.id,
    child_id: match.student_id,
  });

  return NextResponse.json({ linked: true }, { status: 201 });
}
