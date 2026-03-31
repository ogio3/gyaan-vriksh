'use client';

import { useEffect, useState } from 'react';

interface SessionEntry {
  id: string;
  subject_label: string | null;
  passage_preview: string | null;
  status: string;
  bloom_level_reached: string | null;
  branch_count: number;
  max_depth_reached: number;
  created_at: string;
}

const DEMO_SESSIONS: SessionEntry[] = [
  {
    id: 'demo-1',
    subject_label: 'Photosynthesis and Solar Energy',
    passage_preview: 'Photosynthesis is the process by which green plants...',
    status: 'completed',
    bloom_level_reached: 'analyze',
    branch_count: 5,
    max_depth_reached: 2,
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'demo-2',
    subject_label: 'The Water Cycle and Climate',
    passage_preview: 'The water cycle describes the continuous movement...',
    status: 'completed',
    bloom_level_reached: 'understand',
    branch_count: 4,
    max_depth_reached: 1,
    created_at: new Date(Date.now() - 172800000).toISOString(),
  },
  {
    id: 'demo-3',
    subject_label: 'Ancient Egyptian Mathematics',
    passage_preview: 'The ancient Egyptians developed a decimal system...',
    status: 'completed',
    bloom_level_reached: 'evaluate',
    branch_count: 6,
    max_depth_reached: 3,
    created_at: new Date(Date.now() - 259200000).toISOString(),
  },
];

const BLOOM_COLORS: Record<string, string> = {
  remember: 'bg-zinc-200 dark:bg-zinc-700',
  understand: 'bg-blue-100 dark:bg-blue-900',
  apply: 'bg-green-100 dark:bg-green-900',
  analyze: 'bg-amber-100 dark:bg-amber-900',
  evaluate: 'bg-purple-100 dark:bg-purple-900',
  create: 'bg-red-100 dark:bg-red-900',
};

export default function HistoryPage() {
  const [sessions, setSessions] = useState<SessionEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    fetch('/api/explore/history')
      .then((r) => {
        if (r.status === 401 || r.status === 404) {
          // Demo mode — show sample data
          setIsDemo(true);
          setSessions(DEMO_SESSIONS);
          return null;
        }
        return r.json();
      })
      .then((data) => {
        if (data && Array.isArray(data)) setSessions(data);
      })
      .catch(() => {
        setIsDemo(true);
        setSessions(DEMO_SESSIONS);
      })
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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">
          Exploration History
        </h1>
        {isDemo && (
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs text-amber-700 dark:bg-amber-900 dark:text-amber-300">
            Sample data
          </span>
        )}
      </div>

      {sessions.length === 0 ? (
        <p className="text-sm text-zinc-500">
          No explorations yet. Start exploring to see your history here.
        </p>
      ) : (
        <div className="divide-y divide-zinc-200 rounded-md border border-zinc-200 dark:divide-zinc-700 dark:border-zinc-700">
          {sessions.map((session) => (
            <div key={session.id} className="flex items-center gap-4 p-4">
              <div className="flex-1">
                <p className="font-medium">
                  {session.subject_label ?? session.passage_preview?.slice(0, 60) ?? 'Untitled'}
                </p>
                <div className="mt-1 flex items-center gap-2">
                  {session.bloom_level_reached && (
                    <span className={`rounded px-2 py-0.5 text-xs ${BLOOM_COLORS[session.bloom_level_reached] ?? ''}`}>
                      {session.bloom_level_reached}
                    </span>
                  )}
                  <span className="text-xs text-zinc-400">
                    {session.branch_count} branches &middot; depth {session.max_depth_reached}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs text-zinc-400">
                  {new Date(session.created_at).toLocaleDateString()}
                </span>
                <p className={`text-xs ${session.status === 'completed' ? 'text-green-600 dark:text-green-400' : 'text-zinc-400'}`}>
                  {session.status}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
