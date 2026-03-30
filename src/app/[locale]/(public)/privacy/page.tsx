import Link from 'next/link';

export default function PrivacyNoticePage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-3xl font-semibold tracking-tight">
        Privacy Notice for Parents and Guardians
      </h1>

      <section className="mt-8 space-y-6 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
        <div>
          <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">
            What We Collect
          </h2>
          <ul className="mt-2 list-inside list-disc space-y-1">
            <li>Your child&apos;s age bracket (not birth date)</li>
            <li>A randomly generated anonymous ID</li>
            <li>A display nickname (not their real name)</li>
            <li>
              Which subjects they explored (topic labels only, not the text they
              typed)
            </li>
          </ul>
        </div>

        <div>
          <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">
            Who Processes Data
          </h2>
          <ul className="mt-2 list-inside list-disc space-y-1">
            <li>
              <strong>Anthropic (Claude AI)</strong>: Processes textbook passages
              in real-time for educational analysis. Passages are NOT stored or
              used for AI training.
            </li>
            <li>
              <strong>Google (Perspective API)</strong>: Checks AI responses for
              harmful content. Receives text snippets only, no personal
              identifiers.
            </li>
            <li>
              <strong>Vercel</strong>: Hosts the application. Processes HTTP
              requests.
            </li>
          </ul>
        </div>

        <div>
          <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">
            How Long We Keep Data
          </h2>
          <p className="mt-2">
            See our{' '}
            <Link
              href="/privacy/retention"
              className="text-blue-600 underline hover:text-blue-700"
            >
              Data Retention Policy
            </Link>{' '}
            for full details.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">
            Your Rights
          </h2>
          <ul className="mt-2 list-inside list-disc space-y-1">
            <li>
              View your child&apos;s data: Available in the parent dashboard
            </li>
            <li>
              Delete your child&apos;s data: One-click deletion, completed in 72
              hours
            </li>
            <li>
              Withdraw consent: Removes all data and deactivates the account
            </li>
            <li>
              Consent for service does not equal consent for analytics sharing —
              you can use the service without allowing aggregate data to appear
              in teacher dashboards
            </li>
          </ul>
        </div>

        <div>
          <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">
            We Do NOT
          </h2>
          <ul className="mt-2 list-inside list-disc space-y-1">
            <li>Show advertising of any kind</li>
            <li>Share data with advertisers</li>
            <li>Use data to train AI models</li>
            <li>Sell or rent personal information</li>
            <li>Track across other websites or apps</li>
            <li>Collect IP addresses, device info, or location</li>
          </ul>
        </div>

        <div>
          <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">
            AI-Generated Content Disclosure
          </h2>
          <p className="mt-2">
            Your child&apos;s textbook passages are sent to Anthropic&apos;s
            Claude AI for analysis. These passages are processed in real-time
            and are NOT stored, retained, or used to train AI models.
            Anthropic&apos;s data processing agreement confirms zero-retention
            for API inputs.
          </p>
        </div>
      </section>
    </main>
  );
}
