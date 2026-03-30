import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.user_metadata?.role !== 'teacher') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get teacher's classes with student count
  const { data: classes } = await supabase
    .from('classes')
    .select('id, name, is_active, created_at, class_memberships(count)')
    .eq('teacher_id', user.id)
    .order('created_at', { ascending: false });

  // Get recent exploration sessions across all classes
  const classIds = classes?.map((c) => c.id) ?? [];

  let recentSessions: unknown[] = [];
  let totalExplorations = 0;
  let pendingReports = 0;

  if (classIds.length > 0) {
    const { data: sessions } = await supabase
      .from('exploration_sessions')
      .select('id, subject_label, status, bloom_level_reached, created_at')
      .in('class_id', classIds)
      .order('created_at', { ascending: false })
      .limit(20);

    recentSessions = sessions ?? [];

    const { count: explorationCount } = await supabase
      .from('exploration_sessions')
      .select('*', { count: 'exact', head: true })
      .in('class_id', classIds);

    totalExplorations = explorationCount ?? 0;

    const { count: reportCount } = await supabase
      .from('content_reports')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')
      .in(
        'session_id',
        (sessions ?? []).map((s) => (s as { id: string }).id),
      );

    pendingReports = reportCount ?? 0;
  }

  return NextResponse.json({
    classes: classes ?? [],
    recentSessions,
    totalExplorations,
    pendingReports,
  });
}
