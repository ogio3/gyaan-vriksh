/*
 * Age-Based Content Tiers — maps age brackets to content constraints.
 *
 * Three tiers cover the target user base (10-17 year olds):
 *   - 10-12: Simplified language, no salary numbers, max 2 depth levels,
 *            excludes politically controversial and violent topics
 *   - 13-15: Moderate language, full salary ranges, 4 depth levels
 *   - 16-17: Advanced language, unlimited depth, no topic exclusions
 *
 * under_10 and adult brackets return null (no tier) because:
 *   - under_10: product is not designed for this age group (COPPA risk)
 *   - adult: no content restrictions needed
 *
 * Bloom's taxonomy levels control cognitive complexity:
 *   remember < understand < apply < analyze < evaluate < create
 *   Younger students get lower max levels to keep content accessible.
 */

import type { AgeBracket, BloomLevel } from '@/types/database';

export interface ContentTier {
  maxBloomLevel: BloomLevel;
  salaryDisplay: 'simplified' | 'full' | 'detailed';
  maxDepth: number;
  dailyLimit: number;
  excludeTopics: string[];
  languageComplexity: 'simple' | 'moderate' | 'advanced';
}

export const CONTENT_TIERS: Record<'10_12' | '13_15' | '16_17', ContentTier> = {
  '10_12': {
    maxBloomLevel: 'apply',
    salaryDisplay: 'simplified',
    maxDepth: 2,
    dailyLimit: 5,
    excludeTopics: ['economic_inequality', 'detailed_violence', 'political_controversy'],
    languageComplexity: 'simple', // Flesch-Kincaid grade 5-6
  },
  '13_15': {
    maxBloomLevel: 'evaluate',
    salaryDisplay: 'full',
    maxDepth: 4,
    dailyLimit: 10,
    excludeTopics: ['graphic_violence', 'explicit_political'],
    languageComplexity: 'moderate', // Flesch-Kincaid grade 7-9
  },
  '16_17': {
    maxBloomLevel: 'create',
    salaryDisplay: 'detailed',
    maxDepth: -1, // unlimited
    dailyLimit: 15,
    excludeTopics: [],
    languageComplexity: 'advanced', // Flesch-Kincaid grade 10-12
  },
} as const;

export function getContentTier(ageBracket: AgeBracket | null): ContentTier | null {
  if (!ageBracket || ageBracket === 'under_10' || ageBracket === 'adult') {
    return null;
  }
  return CONTENT_TIERS[ageBracket];
}
