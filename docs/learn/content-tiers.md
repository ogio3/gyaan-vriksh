# Content Tiers — Age-Based Safety Architecture

Gyaan Vriksh serves students aged 10-17. Different age groups need different
levels of content complexity, topic sensitivity, and usage limits. The
content-tiers system enforces these boundaries at every AI interaction.

## Three Tiers

| Parameter | Ages 10-12 | Ages 13-15 | Ages 16-17 |
|-----------|-----------|-----------|-----------|
| **Max Bloom Level** | Apply | Evaluate | Create |
| **Language** | Simple (Grade 5-6) | Moderate (Grade 7-9) | Advanced (Grade 10-12) |
| **Tree Depth** | 2 levels | 4 levels | Unlimited |
| **Daily Explorations** | 5 | 10 | 15 |
| **Salary Display** | Simplified | Full ranges | Detailed |
| **Topic Exclusions** | Economic inequality, detailed violence, political controversy | Graphic violence, explicit political | None |

## How It Works

### 1. Age Detection
When a student joins a class, they provide their birth year and month.
The system computes their age bracket and stores it in their profile.

### 2. System Prompt Injection
Each AI request includes an age-appropriate system prompt that instructs
Claude to:
- Use vocabulary appropriate for the student's reading level
- Limit Bloom's taxonomy depth (younger students get "remember" and
  "understand" level content, not "evaluate" and "create")
- Avoid excluded topics entirely
- Format salary information according to the tier's display mode

### 3. Depth Enforcement
The tree expansion API checks the current depth against the tier's
`maxDepth`. If a student has reached their maximum depth, the "tap to
explore" hint disappears and further expansion is blocked.

### 4. Daily Limits
Each student has a daily exploration counter tracked in the
`daily_usage` table. When the limit is reached, the explore button
is disabled with a message explaining when they can explore again.

## Bloom's Taxonomy Levels

The six levels, from simplest to most complex:

1. **Remember** — Recall facts and basic concepts
2. **Understand** — Explain ideas or concepts
3. **Apply** — Use information in new situations
4. **Analyze** — Draw connections among ideas
5. **Evaluate** — Justify a stance or decision
6. **Create** — Produce new or original work

Younger students are guided toward lower levels not because they can't
think deeply, but because the AI-generated content at higher levels
assumes more background knowledge and uses more complex language.

## Implementation

- Tier definitions: `src/lib/safety/content-tiers.ts`
- System prompt builder: `src/lib/safety/system-prompts.ts`
- Age bracket computation: `src/app/[locale]/(public)/join/page.tsx`
- Daily usage tracking: `supabase/migrations/00001_v2_foundation.sql` → `daily_usage` table
