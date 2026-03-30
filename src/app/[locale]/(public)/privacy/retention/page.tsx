export default function DataRetentionPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-3xl font-semibold tracking-tight">
        Data Retention Policy
      </h1>
      <p className="mt-2 text-sm text-zinc-500">Last Updated: 2026-03-30</p>

      <section className="mt-8 space-y-6 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
        <div>
          <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">
            Purpose
          </h2>
          <p className="mt-2">
            This policy defines how long Gyaan Vriksh retains different
            categories of data and the justification for each retention period.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">
            Retention Schedule
          </h2>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-700">
                  <th className="pb-2 pr-4 font-medium">Data Category</th>
                  <th className="pb-2 pr-4 font-medium">Retention Period</th>
                  <th className="pb-2 pr-4 font-medium">Justification</th>
                  <th className="pb-2 font-medium">Deletion Method</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                <tr>
                  <td className="py-2 pr-4">Student age bracket</td>
                  <td className="py-2 pr-4">Duration of class membership</td>
                  <td className="py-2 pr-4">Age-appropriate content delivery</td>
                  <td className="py-2">Cascade delete on class exit</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">Anonymous UUID</td>
                  <td className="py-2 pr-4">Duration of class membership + 30 days</td>
                  <td className="py-2 pr-4">Session continuity</td>
                  <td className="py-2">Automatic expiry</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">Topic hash (SHA-256)</td>
                  <td className="py-2 pr-4">90 days</td>
                  <td className="py-2 pr-4">Aggregate analytics for teacher dashboard</td>
                  <td className="py-2">Scheduled sweep</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">Exploration branch metadata</td>
                  <td className="py-2 pr-4">90 days</td>
                  <td className="py-2 pr-4">Teacher dashboard analytics</td>
                  <td className="py-2">Scheduled sweep</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">Class aggregate statistics</td>
                  <td className="py-2 pr-4">1 year</td>
                  <td className="py-2 pr-4">Long-term educational insights</td>
                  <td className="py-2">Annual sweep</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">Content reports</td>
                  <td className="py-2 pr-4">1 year or resolution + 90 days</td>
                  <td className="py-2 pr-4">Safety improvement</td>
                  <td className="py-2">Manual + automatic</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">Teacher account</td>
                  <td className="py-2 pr-4">Until deletion requested</td>
                  <td className="py-2 pr-4">Service delivery</td>
                  <td className="py-2">30-day soft delete + hard delete</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">Parent account</td>
                  <td className="py-2 pr-4">Until deletion requested</td>
                  <td className="py-2 pr-4">Parental oversight</td>
                  <td className="py-2">30-day soft delete + hard delete</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">Parental consent records</td>
                  <td className="py-2 pr-4">3 years after consent or age-out</td>
                  <td className="py-2 pr-4">Legal compliance / audit trail</td>
                  <td className="py-2">Automatic after period</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">Compliance reports</td>
                  <td className="py-2 pr-4">5 years</td>
                  <td className="py-2 pr-4">Regulatory audit trail</td>
                  <td className="py-2">Automatic after period</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">AI processing logs</td>
                  <td className="py-2 pr-4">0 (not retained)</td>
                  <td className="py-2 pr-4">N/A — passages are never stored</td>
                  <td className="py-2">Never created</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">IP addresses</td>
                  <td className="py-2 pr-4">0 (not retained)</td>
                  <td className="py-2 pr-4">N/A</td>
                  <td className="py-2">Never collected</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">Device information</td>
                  <td className="py-2 pr-4">0 (not retained)</td>
                  <td className="py-2 pr-4">N/A</td>
                  <td className="py-2">Never collected</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">
            Data Deletion Procedures
          </h2>
          <ul className="mt-2 list-inside list-disc space-y-1">
            <li>Automated: Scheduled sweep deletes expired records daily</li>
            <li>Parent-initiated: One-click deletion, completed within 72 hours</li>
            <li>Student-initiated: Available through teacher or parent</li>
            <li>Regulatory request: Completed within 30 days</li>
          </ul>
        </div>

        <div>
          <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">
            Contact
          </h2>
          <p className="mt-2">
            For questions about data retention, contact the platform
            administrator or your school&apos;s data protection officer.
          </p>
        </div>
      </section>
    </main>
  );
}
