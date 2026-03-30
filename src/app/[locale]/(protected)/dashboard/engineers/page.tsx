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

      <section className="rounded-lg border border-zinc-700 p-4">
        <p className="text-center text-sm text-zinc-500 py-8">
          No engineers discovered yet.
        </p>
        <p className="text-center text-xs text-zinc-600">
          When students find the hidden seeds and explore the source
          code, they will appear here. This feature requires the full
          platform with Supabase.
        </p>
      </section>

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
