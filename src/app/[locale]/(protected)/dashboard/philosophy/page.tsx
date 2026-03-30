export default function PhilosophyPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-8 p-6">
      <h1 className="text-2xl font-bold tracking-tight">
        Why This App Works This Way
      </h1>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Demo-First Philosophy</h2>
        <p className="text-sm leading-relaxed text-zinc-400">
          The public deployment shows only the demo. No login walls, no
          registration forms. One click, instant AHA. The complete platform
          (classes, dashboard, parental controls) lives in the open-source
          repository for schools to self-host and customize.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Breathing UX, Not Spinners</h2>
        <p className="text-sm leading-relaxed text-zinc-400">
          When AI generates Knowledge Cards, you see a calm breathing
          animation instead of a spinning wheel. This is intentional.
          Waiting should feel like anticipation, not anxiety. The rhythm
          is designed to slow the heart rate, not accelerate it.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Card Rarity (The Curiosity Engine)</h2>
        <p className="text-sm leading-relaxed text-zinc-400">
          Cards have rarity levels (N, R, SR, SSR) judged by AI based on
          how surprising the connection is. This is not gamification — there
          are no points, no streaks, no leaderboards. Rarity exists purely
          to make students think: &ldquo;What else is out there that I
          haven&apos;t found yet?&rdquo;
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Hidden Sprouts (Easter Eggs)</h2>
        <p className="text-sm leading-relaxed text-zinc-400">
          Every word on the landing page hides a secret knowledge seed.
          Children who click curiously discover golden trees that bloom
          directly on the page. This rewards the exact behavior we want
          to encourage: touching everything, exploring without fear,
          following curiosity wherever it leads.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">No Gamification</h2>
        <p className="text-sm leading-relaxed text-zinc-400">
          There are no streaks, no daily login rewards, no leaderboards,
          no virtual currency, no loot boxes. Exploration itself is the
          reward. The tree grows because you&apos;re curious, not because
          the app manipulates you into returning.
        </p>
      </section>

      <section className="rounded-lg border border-zinc-700 p-4 space-y-3">
        <h2 className="text-lg font-semibold">A Note for Teachers</h2>
        <p className="text-sm leading-relaxed text-zinc-400">
          Everything in this app — the prompts, the safety filters, the
          card types, the rarity system — is open source and visible in the
          code. If you want to change how the app works, you have three
          options:
        </p>
        <ol className="list-inside list-decimal text-sm text-zinc-400 space-y-1">
          <li>
            <strong className="text-zinc-200">
              Have your students build it.
            </strong>{' '}
            This is the recommended option. The hidden easter eggs are
            designed so that curious students find the source code on
            GitHub. When they do, they&apos;re one step away from
            understanding how the entire app works. That moment — when a
            child realizes they can read and modify the code behind
            something they use — is more valuable than any lesson plan.
          </li>
          <li>Hire a professional developer.</li>
          <li>Do it yourself (the code is well-documented).</li>
        </ol>
        <p className="text-sm leading-relaxed text-amber-400/80 mt-2">
          If a student finds the source code and comes to you excited
          about it — please, praise them generously. That spark of
          curiosity about how things are made is extraordinarily rare
          and precious. Don&apos;t let it go unnoticed.
        </p>
      </section>

      <section className="rounded-lg border border-amber-800/30 bg-amber-950/20 p-5 space-y-3">
        <h2 className="text-lg font-semibold text-amber-400">
          From the Developer
        </h2>
        <div className="text-sm leading-relaxed text-zinc-300 space-y-3">
          <p>
            I will personally help any child who dreams of becoming an
            <strong> engineer</strong> or starting a
            <strong> game company</strong>. The source code is written so
            that anyone who reads it will find their way to me.
          </p>
          <p>
            Please watch over them quietly and encourage them. If you think
            a child is heading in a wrong direction, please discuss it
            together — policies differ by country and school, and I trust
            your judgment on the ground.
          </p>
          <p>
            If you decide to use this app, I will build it properly. This
            is still an MVP (Minimum Viable Product). I need your concrete
            feedback to make it real. Touch everything, break things, tell
            me what&apos;s wrong. I&apos;m actively looking for people who
            will complain — because complaints are the blueprint for what
            to build next.
          </p>
          <p className="text-zinc-400 italic">
            Send feedback to: hi [at] ogio.dev
          </p>
        </div>
      </section>

      <section className="space-y-2 text-xs text-zinc-500">
        <p>
          This is open source software released under the MIT License.
          Fork it. Change it. Make it yours.
        </p>
        <a
          href="https://github.com/gyaan-vriksh/gyaan-vriksh"
          className="text-blue-500 hover:underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          View source on GitHub
        </a>
      </section>
    </div>
  );
}
