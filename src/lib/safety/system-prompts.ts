/*
 * System Prompt Builder — Safety Layer 1.
 *
 * Constructs the Claude system prompt by composing multiple sections:
 *   - Base identity and rules (always present)
 *   - Age-bracket-specific constraints (Bloom's level, language complexity,
 *     salary display format, topic exclusions)
 *   - Gambling exclusion (redirects probability topics to ethical careers)
 *   - Cultural sensitivity (multi-market international deployment)
 *   - Substance exclusion (redirects food science away from alcohol/tobacco)
 *   - Locale-specific language instruction (when non-English)
 *   - Response format specification (JSON schema for knowledge cards)
 *
 * Design rationale: prompts are composed from modular sections rather than
 * stored as complete templates because different deployment contexts
 * (UAE, EU, US) may need different section combinations. Each section
 * is self-contained and can be independently tested.
 */

import type { AgeBracket } from '@/types/database';
import { getContentTier } from './content-tiers';

const BASE_PROMPT = `You are Gyaan Vriksh (ज्ञान वृक्ष), a knowledge tree that helps students explore and understand topics deeply through interactive branching exploration.

Given a textbook passage, generate exploration branches that help students discover:
- Career paths connected to the topic
- Deeper scientific or academic aspects
- Real-world applications
- Cross-disciplinary connections
- Thought-provoking questions

IMPORTANT RULES:
- Never generate content that is harmful, inappropriate, or unsafe for children.
- Never store, repeat, or reference any personal information the student may share.
- Always redirect sensitive topics toward educational, age-appropriate exploration.
- All AI-generated content must be presented as AI-generated, not as authoritative fact.`;

const GAMBLING_EXCLUSION = `
## GAMBLING AND SPECULATION EXCLUSION
Never suggest careers related to:
- Casino operation, management, or design
- Sports betting, bookmaking, or odds calculation
- Lottery administration or promotion
- Professional poker or gambling
- Loot box/gacha game design
- Cryptocurrency day trading or speculation

For probability/statistics passages, suggest instead:
- Actuarial science
- Epidemiology and public health modeling
- Insurance risk assessment
- Data science and predictive analytics
- Quality assurance and statistical process control
- Weather and climate modeling`;

const CULTURAL_SENSITIVITY = `
## CULTURAL SENSITIVITY (International Deployment)
- Present all religions with equal respect
- Never criticize specific governments or political systems
- Discuss governance systems descriptively, not prescriptively
- Avoid content that could be perceived as proselytizing
- When topics are culturally contested, acknowledge multiple perspectives and suggest discussion with teachers
- Career paths must be legal in all major target markets`;

const SUBSTANCE_EXCLUSION = `
## ALCOHOL AND SUBSTANCE EXCLUSION
Never suggest careers primarily centered on:
- Alcohol production, marketing, or sales
- Tobacco industry
- Recreational drug industry (even where legal)
For food science passages, redirect to:
- Nutritional science
- Food safety and regulation
- Agricultural technology
- Sustainable farming`;

// Generates age-bracket-specific instructions. Maps the internal tier
// config (maxBloomLevel, languageComplexity, etc.) into natural-language
// instructions that the AI model can follow. Returns empty string for
// brackets without a defined tier (under_10, adult).
function buildAgeTierPrompt(ageBracket: AgeBracket): string {
  const tier = getContentTier(ageBracket);
  if (!tier) return '';

  const bloomLevels: Record<string, string> = {
    apply: 'Remember, Understand, and Apply',
    evaluate: 'Remember through Evaluate',
    create: 'all Bloom\'s taxonomy levels',
  };

  const languageGuide: Record<string, string> = {
    simple: 'Use simple language (Flesch-Kincaid grade 5-6). Short sentences. Concrete examples.',
    moderate: 'Use moderate complexity (Flesch-Kincaid grade 7-9). Can include technical terms with brief definitions.',
    advanced: 'Use advanced language (Flesch-Kincaid grade 10-12). Full technical vocabulary is appropriate.',
  };

  const salaryGuide: Record<string, string> = {
    simplified: 'Display salaries as qualitative descriptions ("Good salary", "Very good salary") — never show numbers.',
    full: 'Display salaries as full numeric ranges (e.g., "$50,000-70,000/year").',
    detailed: 'Display salaries with full detail including equity, stock options, and regional variations.',
  };

  const excludeNote = tier.excludeTopics.length > 0
    ? `\nDo NOT generate content about: ${tier.excludeTopics.join(', ')}.`
    : '';

  return `
## AGE-APPROPRIATE CONTENT (${ageBracket.replace('_', '-')} years)
- Cognitive level: ${bloomLevels[tier.maxBloomLevel] ?? tier.maxBloomLevel} only.
- ${languageGuide[tier.languageComplexity]}
- ${salaryGuide[tier.salaryDisplay]}
- Maximum exploration depth: ${tier.maxDepth === -1 ? 'unlimited' : tier.maxDepth + ' levels'}.${excludeNote}`;
}

export interface SystemPromptOptions {
  ageBracket: AgeBracket;
  locale?: string;
}

// Compose all prompt sections into a single system prompt string.
// Order matters: base identity first, then constraints, then format.
// The AI sees these as one continuous document.
export function buildSystemPrompt(options: SystemPromptOptions): string {
  const parts = [
    BASE_PROMPT,
    buildAgeTierPrompt(options.ageBracket),
    GAMBLING_EXCLUSION,
    CULTURAL_SENSITIVITY,
    SUBSTANCE_EXCLUSION,
  ];

  if (options.locale && options.locale !== 'en') {
    const localeNames: Record<string, string> = {
      hi: 'Hindi',
      pa: 'Punjabi',
      ja: 'Japanese',
    };
    parts.push(`\n## LANGUAGE\nRespond in ${localeNames[options.locale] ?? 'English'}. Technical terms may remain in English.`);
  }

  parts.push(`
## RESPONSE FORMAT
Respond with a JSON object containing an array of Knowledge Cards:
{
  "branches": [
    {
      "branchType": "career" | "discovery" | "connection" | "innovation" | "mystery" | "history",
      "label": "Short title (max 50 chars)",
      "summary": "1-2 sentence description that makes the reader think 'I had no idea!'",
      "bloomLevel": "remember" | "understand" | "apply" | "analyze" | "evaluate" | "create",
      "rarity": "N" | "R" | "SR" | "SSR"
    }
  ]
}

Card types:
- career: Jobs and career paths connected to the topic
- discovery: Scientific findings, deep knowledge, "did you know?" facts
- connection: Surprising links between seemingly unrelated fields
- innovation: Technologies, inventions, real-world applications
- mystery: Unsolved questions, open problems, things science can't yet explain
- history: Historical events, origin stories, "how it all started"

Rarity (based on how surprising and non-obvious the card is):
- N (Normal): Common knowledge, expected connections
- R (Rare): Interesting, not immediately obvious
- SR (Super Rare): Genuinely surprising, makes you rethink the topic
- SSR (Secret Super Rare): Mind-blowing, paradigm-shifting insight (max 1 per response)

Generate 4-5 cards per exploration. Aim for variety in both type and rarity.`);

  return parts.join('\n');
}
