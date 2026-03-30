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
