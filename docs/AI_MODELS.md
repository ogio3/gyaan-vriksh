# AI Model Data Governance

Article 10 — EU AI Act Regulation 2024/1689

## Claude Sonnet 4 (Primary)

- **Provider**: Anthropic
- **Model ID**: claude-sonnet-4-20250514
- **Training data**: Proprietary (see Anthropic's model card)
- **Our usage**: API only, zero-retention agreement
- **Bias considerations**: English-centric training may produce lower quality for Hindi/Arabic/Japanese
- **Mitigation**: Language-specific quality testing, locale-aware prompting, fallback to translated templates

## Perspective API

- **Provider**: Google Jigsaw
- **Supported languages**: 18 (including Arabic, Hindi)
- **Known limitations**: Lower accuracy for code-mixed language (Hinglish, Spanglish)
- **Mitigation**: Combined with system prompt filtering, not sole safety layer
- **Fail-safe**: If API unavailable, block AI responses entirely

## Data Flow

```
Student input → PII detection (client) → PII detection (server) → Claude API → Perspective API → Output filter → Student
```

- Student passages are processed transiently by Claude API
- No student data is stored by Anthropic (zero-retention API agreement)
- Perspective API receives text snippets only, no identifiers
- Passage text is NEVER stored in our database (only SHA-256 hash + PII-stripped preview)
