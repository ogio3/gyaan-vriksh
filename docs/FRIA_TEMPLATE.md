# Fundamental Rights Impact Assessment (FRIA) Template

Article 27 — EU AI Act Regulation 2024/1689

This template is provided for deployers (schools, institutions) to complete when deploying Gyaan Vriksh in EU jurisdictions.

## 1. AI System Identification

- **System name**: Gyaan Vriksh (ज्ञान वृक्ष)
- **Provider**: [Project maintainer / hosting organization]
- **Version**: 2.1
- **Classification**: Likely not high-risk (Article 6(3) exemption — broad pattern detection without profiling)

## 2. Intended Use

- **Purpose**: Educational exploration of textbook topics via AI-generated branches
- **Target users**: Students aged 10-17, teachers, parents
- **Deployment context**: [School name, jurisdiction]

## 3. Fundamental Rights Assessment

### Right to Education (Article 14 EU Charter)
- **Impact**: Positive — enhances educational exploration
- **Risk**: AI errors could mislead students
- **Mitigation**: AI disclaimer on all outputs, teacher oversight, report mechanism

### Right to Privacy (Article 7 EU Charter)
- **Impact**: Minimal data collection (anonymous IDs, no PII stored)
- **Risk**: Potential PII in student-entered passages
- **Mitigation**: Client + server PII detection, zero-storage for passage text

### Rights of the Child (Article 24 EU Charter)
- **Impact**: Age-tiered content protections, parental controls
- **Risk**: Age self-reporting inaccuracy
- **Mitigation**: Content tiers with age-appropriate restrictions

### Non-Discrimination (Article 21 EU Charter)
- **Impact**: Career exploration across all fields
- **Risk**: AI bias in career suggestions (gender, cultural)
- **Mitigation**: Prompt diversity requirements, bias monitoring

## 4. Deployer Actions

- [ ] Complete this template before deployment
- [ ] Designate a local compliance officer
- [ ] Conduct annual review
- [ ] Report serious incidents within 15 days (Article 62)
