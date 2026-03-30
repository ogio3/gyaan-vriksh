import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateComplianceReport } from '@/lib/compliance/report-generator';

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Only teachers and admins can generate reports
  if (!user || !['teacher', 'admin'].includes(user.user_metadata?.role ?? '')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const period = searchParams.get('period') ?? 'monthly';

  const now = new Date();
  let periodStart: Date;

  switch (period) {
    case 'quarterly':
      periodStart = new Date(now.getFullYear(), now.getMonth() - 3, 1);
      break;
    case 'annually':
      periodStart = new Date(now.getFullYear() - 1, now.getMonth(), 1);
      break;
    case 'monthly':
    default:
      periodStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      break;
  }

  const report = await generateComplianceReport(supabase, periodStart, now);

  return NextResponse.json(report);
}
