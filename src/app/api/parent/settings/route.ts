import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.user_metadata?.role !== 'parent') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const childId = searchParams.get('childId');

  if (!childId) {
    return NextResponse.json(
      { error: 'childId is required.' },
      { status: 400 },
    );
  }

  const { data, error } = await supabase
    .from('parent_settings')
    .select('*')
    .eq('parent_id', user.id)
    .eq('child_id', childId)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.user_metadata?.role !== 'parent') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = (await request.json()) as {
    childId?: string;
    dailyLimitMinutes?: number;
    allowedCategories?: string[];
    accountPaused?: boolean;
    notificationFrequency?: string;
  };

  if (!body.childId) {
    return NextResponse.json(
      { error: 'childId is required.' },
      { status: 400 },
    );
  }

  // Verify parent-child link
  const { data: link } = await supabase
    .from('parent_child_links')
    .select('id')
    .eq('parent_id', user.id)
    .eq('child_id', body.childId)
    .single();

  if (!link) {
    return NextResponse.json({ error: 'Not authorized.' }, { status: 403 });
  }

  const updates: Record<string, unknown> = {};
  if (body.dailyLimitMinutes !== undefined) {
    updates.daily_limit_minutes = Math.max(0, Math.min(480, body.dailyLimitMinutes));
  }
  if (body.allowedCategories !== undefined) {
    updates.allowed_categories = body.allowedCategories;
  }
  if (body.accountPaused !== undefined) {
    updates.account_paused = body.accountPaused;
  }
  if (body.notificationFrequency !== undefined) {
    if (['realtime', 'daily', 'weekly'].includes(body.notificationFrequency)) {
      updates.notification_frequency = body.notificationFrequency;
    }
  }

  const { data, error } = await supabase
    .from('parent_settings')
    .update(updates)
    .eq('parent_id', user.id)
    .eq('child_id', body.childId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
