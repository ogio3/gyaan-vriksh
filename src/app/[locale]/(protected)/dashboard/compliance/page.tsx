export default function CompliancePage() {
  return (
    <div className="mx-auto max-w-2xl space-y-8 p-6">
      <div className="rounded-lg border-2 border-red-700/50 bg-red-950/20 p-5 space-y-3">
        <h1 className="text-xl font-bold text-red-400">
          Regulatory Compliance — Important Notice
        </h1>
        <p className="text-sm font-semibold text-red-300">
          This platform&apos;s compliance implementation is INCOMPLETE and
          has NOT been verified by legal professionals. Before deploying
          in any jurisdiction, you MUST consult with qualified legal
          counsel.
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">
          COPPA 2025 (United States)
        </h2>
        <p className="text-sm text-zinc-400">
          The Children&apos;s Online Privacy Protection Act requires
          verifiable parental consent before collecting data from children
          under 13. Our implementation includes consent flows and data
          minimization, but the FTC&apos;s enforcement standards evolve
          and specific verification methods (credit card micro-charge,
          government ID, KBA) have not been independently audited.
        </p>
        <div className="rounded border border-amber-800/30 bg-amber-950/10 p-3">
          <p className="text-xs text-amber-400">
            Status: Implementation exists but evidence of compliance
            (legal review, FTC Safe Harbor certification) has NOT been
            obtained. Architecture may need significant changes based
            on legal counsel&apos;s recommendations.
          </p>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">
          UAE Federal Decree-Law No. 26/2025
        </h2>
        <p className="text-sm text-zinc-400">
          The UAE child protection law mandates age verification, content
          filtering aligned with UAE media standards, ISP cooperation,
          parental controls, and anti-sharentism protections. Implementing
          regulations from TDRA have not yet been published.
        </p>
        <div className="rounded border border-amber-800/30 bg-amber-950/10 p-3">
          <p className="text-xs text-amber-400">
            Status: Content filtering and age gate implemented, but TDRA
            technical standards (expected before Jan 2027) may require
            significant architectural changes. Cultural sensitivity
            filters need review by UAE-based educators.
          </p>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">
          EU AI Act (Regulation 2024/1689)
        </h2>
        <p className="text-sm text-zinc-400">
          Classification as high-risk (Annex III, Category 3) depends on
          whether the platform is deemed to &ldquo;influence educational
          outcomes.&rdquo; We position as a non-assessment exploration
          tool, but regulators may classify differently.
        </p>
        <div className="rounded border border-amber-800/30 bg-amber-950/10 p-3">
          <p className="text-xs text-amber-400">
            Status: Documentation (Risk Register, Technical Doc, FRIA
            template) prepared proactively. No conformity assessment
            conducted. CEN-CENELEC harmonized standards not yet published.
          </p>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">
          Japan APPI (個人情報保護法)
        </h2>
        <p className="text-sm text-zinc-400">
          Japan&apos;s Act on Protection of Personal Information requires
          purpose limitation and cross-border transfer safeguards. Our
          data minimization (anonymous IDs, no PII storage) is designed
          to comply, but has not been reviewed by Japanese legal counsel.
        </p>
        <div className="rounded border border-amber-800/30 bg-amber-950/10 p-3">
          <p className="text-xs text-amber-400">
            Status: Architecture designed for compliance. No legal review
            conducted for Japan-specific deployment requirements.
          </p>
        </div>
      </section>

      <section className="rounded-lg border border-zinc-700 p-4 space-y-3">
        <h2 className="text-base font-semibold">
          Why Everything Is Open
        </h2>
        <p className="text-sm text-zinc-400">
          Every prompt, every filter, every safety mechanism is visible
          in the source code. This is intentional. Compliance cannot be
          achieved through obscurity — it requires transparency,
          review, and collaboration with experts in each jurisdiction.
        </p>
        <p className="text-sm text-zinc-400">
          If you are a school administrator, legal professional, or
          regulatory expert: your review and feedback would be invaluable.
          This is an MVP. The architecture is designed to be adapted
          per-jurisdiction, not to be one-size-fits-all.
        </p>
        <p className="text-xs text-zinc-500 mt-2">
          Contact: hi [at] ogio.dev
        </p>
      </section>
    </div>
  );
}
