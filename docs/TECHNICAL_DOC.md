# Technical Documentation

Article 11 / Annex IV — EU AI Act Regulation 2024/1689

## 1. General Description

Gyaan Vriksh is an educational AI exploration platform for students aged 10-17. Students paste textbook passages, and Claude AI generates "exploration branches" — career paths, deeper topics, cross-disciplinary connections, and thought-provoking questions organized as an interactive knowledge tree.

## 2. Intended Purpose

- Expand student curiosity from textbook passages
- Help students discover career paths connected to academic topics
- Support teachers with aggregate engagement analytics
- NOT intended for: grading, assessment, admission decisions, or performance evaluation

## 3. System Architecture

```
Client (Next.js 16 + React 19)
  ↓ HTTPS
Proxy (session refresh + role routing)
  ↓
API Routes (Node.js)
  ├── Input Filter (PII detection + length validation)
  ├── Claude API (Anthropic, streaming structured output)
  ├── Output Filter (Perspective API + keyword scan + UAE standards)
  └── Database (Supabase PostgreSQL + RLS)
```

## 4. Data Requirements

- **Input**: Textbook passages (max 2,000 chars), PII-stripped before processing
- **Output**: Structured exploration branches (JSON with branch type, label, summary, Bloom level)
- **Storage**: Only metadata stored (passage hash, topic labels, branch metadata)
- **No training data**: The platform does not train or fine-tune any AI models

## 5. Risk Management

See [RISK_REGISTER.md](RISK_REGISTER.md) for the complete risk register.

## 6. Human Oversight

See [HUMAN_OVERSIGHT.md](HUMAN_OVERSIGHT.md) for the oversight architecture.

## 7. Accuracy and Robustness Metrics

- Career salary data: ±20% of actual market rates (verified quarterly)
- Bloom's taxonomy classification: Manual audit sample quarterly (target: >80% agreement)
- Content age-appropriateness: Manual audit sample quarterly (target: >95% appropriate)
- Prompt injection resistance: Automated test suite (target: >99% block rate)
- PII detection: Automated test suite (target: >99% detection rate)
- Perspective API fallback: If unavailable, block responses entirely (fail-safe)

## 8. Known Limitations

- AI-generated content may contain factual errors
- Lower quality output for non-English languages (Hindi, Punjabi, Japanese)
- Age bracket is self-reported (no independent verification mechanism)
- Screenshot prevention (ShareGuard) is a deterrent, not a guarantee

## 9. Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-03-30 | Initial v2.1 technical documentation | Project maintainer |
