import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Find students who reached 'evaluate' or 'create' bloom levels
  const { data: sessions } = await supabase
    .from('exploration_sessions')
    .select('student_id, bloom_level_reached')
    .in('bloom_level_reached', ['evaluate', 'create']);

  if (!sessions || sessions.length === 0) {
    return NextResponse.json([]);
  }

  // Group by student and count explorations
  const studentMap = new Map<string, { bloom: string; count: number }>();
  for (const s of sessions) {
    const existing = studentMap.get(s.student_id);
    if (!existing || (s.bloom_level_reached === 'create' && existing.bloom !== 'create')) {
      studentMap.set(s.student_id, {
        bloom: s.bloom_level_reached!,
        count: (existing?.count ?? 0) + 1,
      });
    } else {
      existing.count++;
    }
  }

  // Fetch display names
  const studentIds = Array.from(studentMap.keys());
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, display_name')
    .in('id', studentIds);

  const engineers = (profiles ?? []).map((p) => ({
    display_name: p.display_name,
    bloom_level_reached: studentMap.get(p.id)?.bloom ?? 'evaluate',
    exploration_count: studentMap.get(p.id)?.count ?? 0,
  }));

  return NextResponse.json(engineers);
}
