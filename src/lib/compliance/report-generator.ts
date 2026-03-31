import type { SupabaseClient } from '@supabase/supabase-js';

export interface ComplianceReport {
  period: { start: string; end: string };
  generated_at: string;
  platform_metrics: {
    total_users: number;
    users_by_age_bracket: Record<string, number>;
    total_explorations: number;
    total_content_reports: number;
    reports_actioned: number;
    avg_response_time_hours: number;
  };
  safety_metrics: {
    input_blocks: number;
    output_blocks: number;
    pii_detections: number;
    perspective_api_flags: number;
  };
  data_retention: {
    parent_deletion_requests: number;
  };
  parental_consent: {
    total_consents: number;
    consent_method_breakdown: Record<string, number>;
    consent_withdrawals: number;
  };
}

export async function generateComplianceReport(
  supabase: SupabaseClient,
  periodStart: Date,
  periodEnd: Date,
): Promise<ComplianceReport> {
  const start = periodStart.toISOString();
  const end = periodEnd.toISOString();

  // Platform metrics
  const { count: totalUsers } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true });

  const { data: ageBrackets } = await supabase
    .from('profiles')
    .select('age_bracket')
    .not('age_bracket', 'is', null);

  const usersByAge: Record<string, number> = {};
  for (const row of ageBrackets ?? []) {
    const bracket = row.age_bracket as string;
    usersByAge[bracket] = (usersByAge[bracket] ?? 0) + 1;
  }

  const { count: totalExplorations } = await supabase
    .from('exploration_sessions')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', start)
    .lt('created_at', end);

  const { count: totalReports } = await supabase
    .from('content_reports')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', start)
    .lt('created_at', end);

  const { count: actionedReports } = await supabase
    .from('content_reports')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', start)
    .lt('created_at', end)
    .in('status', ['actioned', 'reviewed']);

  // Average response time for reports
  const { data: reviewedReports } = await supabase
    .from('content_reports')
    .select('created_at, reviewed_at')
    .gte('created_at', start)
    .lt('created_at', end)
    .not('reviewed_at', 'is', null);

  let avgResponseHours = 0;
  if (reviewedReports && reviewedReports.length > 0) {
    const totalHours = reviewedReports.reduce((sum, r) => {
      const created = new Date(r.created_at).getTime();
      const reviewed = new Date(r.reviewed_at!).getTime();
      return sum + (reviewed - created) / (1000 * 60 * 60);
    }, 0);
    avgResponseHours = totalHours / reviewedReports.length;
  }

  // Parental consent
  const { count: totalConsents } = await supabase
    .from('parent_child_links')
    .select('*', { count: 'exact', head: true })
    .eq('consent_status', 'granted');

  const { data: consentMethods } = await supabase
    .from('parent_child_links')
    .select('consent_method')
    .eq('consent_status', 'granted');

  const methodBreakdown: Record<string, number> = {};
  for (const row of consentMethods ?? []) {
    const method = (row.consent_method as string) ?? 'unknown';
    methodBreakdown[method] = (methodBreakdown[method] ?? 0) + 1;
  }

  const { count: withdrawals } = await supabase
    .from('consent_audit_log')
    .select('*', { count: 'exact', head: true })
    .eq('action', 'withdrawn')
    .gte('created_at', start)
    .lt('created_at', end);

  // Deletion requests
  const { count: deletionRequests } = await supabase
    .from('consent_audit_log')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', start)
    .lt('created_at', end);

  return {
    period: { start, end },
    generated_at: new Date().toISOString(),
    platform_metrics: {
      total_users: totalUsers ?? 0,
      users_by_age_bracket: usersByAge,
      total_explorations: totalExplorations ?? 0,
      total_content_reports: totalReports ?? 0,
      reports_actioned: actionedReports ?? 0,
      avg_response_time_hours: Math.round(avgResponseHours * 10) / 10,
    },
    safety_metrics: {
      // Safety events are enforced at the API layer (input-filter, output-filter, perspective).
      // These counters require a dedicated safety_events table for accurate tracking.
      // -1 indicates "not yet tracked" rather than "zero events occurred".
      input_blocks: -1,
      output_blocks: -1,
      pii_detections: -1,
      perspective_api_flags: -1,
    },
    data_retention: {
      parent_deletion_requests: deletionRequests ?? 0,
    },
    parental_consent: {
      total_consents: totalConsents ?? 0,
      consent_method_breakdown: methodBreakdown,
      consent_withdrawals: withdrawals ?? 0,
    },
  };
}
