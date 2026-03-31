'use client';

import { useEffect, useState } from 'react';

interface Engineer {
  display_name: string;
  bloom_level_reached: string;
  exploration_count: number;
}

const DEMO_ENGINEERS: Engineer[] = [
  { display_name: 'Curious Cat', bloom_level_reached: 'create', exploration_count: 12 },
  { display_name: 'Code Explorer', bloom_level_reached: 'evaluate', exploration_count: 8 },
];

function EngineersSection() {
  const [engineers, setEngineers] = useState<Engineer[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    fetch('/api/dashboard/engineers')
      .then((r) => {
        if (!r.ok) {
          setIsDemo(true);
          setEngineers(DEMO_ENGINEERS);
          return null;
        }
        return r.json();
      })
      .then((data) => {
        if (data) setEngineers(data);
      })
      .catch(() => {
        setIsDemo(true);
        setEngineers(DEMO_ENGINEERS);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <section className="rounded-lg border border-zinc-700 p-4">
        <div className="h-24 animate-pulse rounded bg-zinc-800" />
      </section>
    );
  }

  if (engineers.length === 0) {
    return (
      <section className="rounded-lg border border-zinc-700 p-4">
        <p className="text-center text-sm text-zinc-500 py-8">
          No engineers discovered yet.
        </p>
        <p className="text-center text-xs text-zinc-600">
          When students find the hidden seeds and explore the source
          code, they will appear here.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-zinc-700 p-4 space-y-3">
      {isDemo && (
        <p className="text-xs text-amber-500">Sample data — connect Supabase for real tracking</p>
      )}
      {engineers.map((eng, i) => (
        <div key={i} className="flex items-center justify-between rounded-md border border-zinc-700 p-3">
          <div>
            <p className="font-medium text-emerald-400">{eng.display_name}</p>
            <p className="text-xs text-zinc-500">
              {eng.exploration_count} explorations
            </p>
          </div>
          <span className="rounded bg-emerald-900 px-2 py-1 text-xs text-emerald-300">
            {eng.bloom_level_reached}
          </span>
        </div>
      ))}
    </section>
  );
}

export default function EngineersPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-8 p-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">
          Future Engineers
        </h1>
        <p className="text-sm text-zinc-400">
          Students who discovered the source code and explored beyond
          what was shown to them.
        </p>
      </div>

      <section className="rounded-lg border border-emerald-800/30 bg-emerald-950/10 p-5 space-y-3">
        <h2 className="text-base font-semibold text-emerald-400">
          How It Works
        </h2>
        <p className="text-sm text-zinc-400">
          This app contains hidden easter eggs (&ldquo;sprouts&rdquo;)
          that reward curiosity. Some students will discover them, follow
          the trail to the GitHub repository, and begin reading the source
          code. When they do, they are taking their first steps as
          engineers.
        </p>
        <p className="text-sm text-zinc-400">
          This page will show students who have found secret seeds and
          explored the source code. As a teacher, you can recognize
          their achievement by assigning them the
          <strong className="text-emerald-300"> Engineer</strong> role —
          acknowledging that they have a special kind of curiosity that
          deserves nurturing.
        </p>
      </section>

      <EngineersSection />

      <section className="rounded-lg border border-amber-800/30 bg-amber-950/10 p-4 space-y-2">
        <p className="text-sm text-amber-400/80">
          <strong>For the teacher who reads this:</strong>
        </p>
        <p className="text-sm text-zinc-400">
          Engineers are special. The child who opens DevTools, who
          views the page source, who follows a link to GitHub and starts
          reading code — that child is not misbehaving. They are doing
          exactly what the world&apos;s best engineers did at their age.
        </p>
        <p className="text-sm text-zinc-400">
          When you see a name appear on this page, please tell them:
          &ldquo;I see what you found. That&apos;s incredible.&rdquo;
          That single sentence can change a life.
        </p>
      </section>
    </div>
  );
}
