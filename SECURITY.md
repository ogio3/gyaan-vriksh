# Information Security Program

Version: 1.0
COPPA 2025 Mandatory Requirement

## 1. Security Coordinator

The project maintainer serves as Security Coordinator, responsible for overseeing this program. For self-hosted deployments, the hosting organization must designate their own coordinator.

## 2. Annual Risk Assessment

Conducted annually (or after significant changes) covering:
- Dependency vulnerability audit (npm audit)
- API key exposure audit
- Supabase RLS policy review
- AI prompt injection testing (automated test suite)
- Content filter effectiveness review
- Third-party service security review (Anthropic, Google, Vercel)

## 3. Technical Safeguards

- All data encrypted in transit (TLS 1.3)
- Database encryption at rest (Supabase default)
- API keys stored as environment variables, never in code
- Row Level Security on all database tables
- Rate limiting on all API endpoints
- Input sanitization and PII detection on all user inputs
- Content Security Policy headers
- HSTS enforcement
- No client-side storage of sensitive data
- Session tokens: HttpOnly, Secure, SameSite=Lax

## 4. Safeguard Testing

- Automated security tests in CI pipeline (GitHub Actions)
- Prompt injection test suite
- Quarterly manual penetration testing (for funded deployments)
- Dependency updates: monthly manual review

## 5. Annual Program Evaluation

- Published as a GitHub release note annually
- Includes: incidents responded to, vulnerabilities patched, policy changes made, third-party audit results (if applicable)

## 6. Vulnerability Disclosure

- Report vulnerabilities via GitHub Security Advisories
- 90-day disclosure timeline
- Responsible disclosure encouraged
