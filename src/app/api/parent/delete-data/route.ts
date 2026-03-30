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

  const { childId } = (await request.json()) as { childId?: string };

  if (!childId) {
    return NextResponse.json(
      { error: 'childId is required.' },
      { status: 400 },
    );
  }

  // Verify parent-child link
  const { data: link } = await supabase
    .from('parent_child_links')
    .select('id, consent_status')
    .eq('parent_id', user.id)
    .eq('child_id', childId)
    .single();

  if (!link) {
    return NextResponse.json({ error: 'Not authorized.' }, { status: 403 });
  }

  const serviceClient = await createServiceClient();

  // Delete all child data using service role (cascading through FK)
  // Order: branches -> sessions -> memberships -> daily_usage -> reports -> settings -> link -> profile -> auth user
  await serviceClient.from('exploration_branches').delete().in(
    'session_id',
    (
      await serviceClient
        .from('exploration_sessions')
        .select('id')
        .eq('student_id', childId)
    ).data?.map((s) => s.id) ?? [],
  );
  await serviceClient
    .from('exploration_sessions')
    .delete()
    .eq('student_id', childId);
  await serviceClient
    .from('daily_usage')
    .delete()
    .eq('student_id', childId);
  await serviceClient
    .from('class_memberships')
    .delete()
    .eq('student_id', childId);
  await serviceClient
    .from('parent_settings')
    .delete()
    .eq('child_id', childId);
  await serviceClient
    .from('parent_child_links')
    .delete()
    .eq('child_id', childId);

  // Log the deletion in consent audit
  await serviceClient.from('consent_audit_log').insert({
    parent_id: user.id,
    child_id: childId,
    action: 'withdrawn',
    consent_details: { reason: 'parent_data_deletion_request' },
  });

  // Delete the child's auth user (cascades to profiles via FK)
  await serviceClient.auth.admin.deleteUser(childId);

  return NextResponse.json({
    deleted: true,
    message: 'All child data has been permanently deleted.',
  });
}
