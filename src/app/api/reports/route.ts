import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { stripPii } from '@/lib/safety/pii-detector';
import { SAFETY_CONFIG } from '@/lib/safety/config';
import type { ContentReportType, ReportPriority } from '@/types/database';

const PRIORITY_MAP: Record<ContentReportType, ReportPriority> = {
  age_inappropriate: 'high',
  uncomfortable: 'high',
  incorrect: 'medium',
  other: 'low',
};

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = (await request.json()) as {
    sessionId?: string;
    branchId?: string;
    reportType?: string;
    reportText?: string;
  };

  if (
    !body.reportType ||
    !['age_inappropriate', 'incorrect', 'uncomfortable', 'other'].includes(
      body.reportType,
    )
  ) {
    return NextResponse.json(
      { error: 'Valid report type is required.' },
      { status: 400 },
    );
  }

  const reportType = body.reportType as ContentReportType;
  const reporterRole = user.user_metadata?.role ?? 'student';
  let reportText = body.reportText ?? null;

  // PII strip and length limit on report text
  if (reportText) {
    reportText = stripPii(reportText).slice(
      0,
      SAFETY_CONFIG.maxReportTextLength,
    );
  }

  const { data, error } = await supabase
    .from('content_reports')
    .insert({
      session_id: body.sessionId ?? null,
      branch_id: body.branchId ?? null,
      reporter_id: user.id,
      reporter_role: reporterRole,
      report_type: reportType,
      report_text: reportText,
      priority: PRIORITY_MAP[reportType],
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.user_metadata?.role !== 'teacher') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get reports for sessions in teacher's classes
  const { data: classes } = await supabase
    .from('classes')
    .select('id')
    .eq('teacher_id', user.id);

  const classIds = classes?.map((c) => c.id) ?? [];
  if (classIds.length === 0) {
    return NextResponse.json([]);
  }

  const { data: sessions } = await supabase
    .from('exploration_sessions')
    .select('id')
    .in('class_id', classIds);

  const sessionIds = sessions?.map((s) => s.id) ?? [];
  if (sessionIds.length === 0) {
    return NextResponse.json([]);
  }

  const { data: reports, error } = await supabase
    .from('content_reports')
    .select('*')
    .in('session_id', sessionIds)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(reports);
}
