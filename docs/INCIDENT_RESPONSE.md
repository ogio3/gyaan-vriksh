# Incident Response and Reporting Protocol

§26 — SPEC v2.1

## Incident Classification

| Severity | Definition | Response Time | Notification |
|----------|-----------|---------------|-------------|
| Critical | CSAM detection, child exploitation, data breach exposing PII | Immediate | Law enforcement + TDRA + parents within 24 hours |
| High | Harmful content reaching a child, systematic filter bypass | 4 hours | Teacher + platform admin within 8 hours |
| Medium | Isolated inappropriate content, PII near-miss | 24 hours | Teacher within 48 hours |
| Low | False positive spike, minor UI issue | 72 hours | Logged for monthly review |

## CSAM Reporting Protocol (UAE §10, US Federal Law)

If any content report or automated detection suggests CSAM:
1. IMMEDIATELY block the content
2. Preserve evidence (do NOT delete — legal hold)
3. File report with:
   - NCMEC CyberTipline (US law, 18 USC §2258A)
   - UAE Internet Safety Portal (TDRA)
   - Local law enforcement in deployment jurisdiction
4. Notify school administration
5. Do NOT notify the reporter beyond "Thank you, this has been escalated to the appropriate authorities"
6. Document in incident log with restricted access (legal/compliance team only)

## EU AI Act Incident Reporting (Article 62)

For EU deployments, serious incidents must be reported to the relevant national market surveillance authority within 15 days. A serious incident is one that directly or indirectly leads to:
- Death or serious damage to health
- Serious disruption of critical infrastructure
- Breach of fundamental rights obligations

### Procedure
1. Incident detected → classified per table above
2. If classified as "serious" under EU definition:
   - Report to national authority within 15 days
   - Include: system description, incident description, corrective measures taken
3. Update risk register (docs/RISK_REGISTER.md)
4. Post-incident review within 30 days
5. Publish transparency report (anonymized) in quarterly compliance report

## Incident Log

| Date | Severity | Description | Action Taken | Resolved |
|------|----------|-------------|-------------|----------|
| — | — | No incidents recorded | — | — |
