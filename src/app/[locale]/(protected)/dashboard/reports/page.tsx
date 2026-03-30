'use client';

import { useEffect, useState } from 'react';
import type { ContentReport } from '@/types/database';

const PRIORITY_COLORS: Record<string, string> = {
  high: 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/20',
  medium:
    'text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-900/20',
  low: 'text-zinc-600 bg-zinc-50 dark:text-zinc-400 dark:bg-zinc-800',
};

export default function ReportsPage() {
  const [reports, setReports] = useState<ContentReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/reports')
      .then((r) => r.json())
      .then(setReports)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="h-8 w-48 animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-800" />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <h1 className="text-2xl font-semibold tracking-tight">Content Reports</h1>

      {reports.length === 0 ? (
        <p className="text-sm text-zinc-500">No reports yet.</p>
      ) : (
        <div className="divide-y divide-zinc-200 rounded-md border border-zinc-200 dark:divide-zinc-700 dark:border-zinc-700">
          {reports.map((report) => (
            <div key={report.id} className="flex items-start gap-4 p-4">
              <span
                className={`rounded px-2 py-0.5 text-xs font-medium ${PRIORITY_COLORS[report.priority] ?? ''}`}
              >
                {report.priority}
              </span>
              <div className="flex-1">
                <p className="text-sm font-medium">
                  {report.report_type.replace('_', ' ')}
                </p>
                {report.report_text && (
                  <p className="mt-1 text-sm text-zinc-500">
                    {report.report_text}
                  </p>
                )}
                <p className="mt-1 text-xs text-zinc-400">
                  {report.reporter_role} &middot;{' '}
                  {new Date(report.created_at).toLocaleDateString()}
                </p>
              </div>
              <span
                className={`rounded px-2 py-0.5 text-xs ${
                  report.status === 'pending'
                    ? 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400'
                    : 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400'
                }`}
              >
                {report.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
