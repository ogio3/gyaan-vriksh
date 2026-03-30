# AI Risk Management Register

Article 9 — EU AI Act Regulation 2024/1689

| Risk ID | Category | Description | Likelihood | Impact | Mitigation | Status |
|---------|----------|-------------|------------|--------|------------|--------|
| R-001 | Content | AI generates age-inappropriate content | Medium | High | 4-layer filter + age tiers + content-tiers.ts | Active |
| R-002 | Privacy | Student PII leaks through AI output | Low | Critical | PII detector (input + output) + system prompt | Active |
| R-003 | Bias | Career paths reflect cultural/gender bias | Medium | Medium | Prompt diversity requirements + audit | Active |
| R-004 | Accuracy | AI generates factually incorrect career data | Medium | Medium | Disclaimer + teacher review + report button | Active |
| R-005 | Safety | Prompt injection bypasses content filters | Low | High | Input filter + output filter + Perspective API | Active |
| R-006 | Dependency | AI provider changes terms/pricing | Medium | Medium | Multi-provider support (Claude/Ollama) | Active |
| R-007 | Engagement | Students develop compulsive usage | Low | Medium | Daily limits by age + no gamification | Active |
| R-008 | Equity | Non-English speakers get lower quality | Medium | High | Multi-language prompts + quality testing | Active |

## Review Schedule

- Quarterly review by project maintainer
- Immediate review after any incident (see INCIDENT_RESPONSE.md)
- Annual comprehensive reassessment
