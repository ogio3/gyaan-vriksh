export type ContentStandard = 'international' | 'uae' | 'eu' | 'us' | 'custom';

export const SAFETY_CONFIG = {
  // Set via environment variable — 'international' applies the union of all standards (strictest)
  contentStandards: (process.env.CONTENT_STANDARDS || 'international') as ContentStandard,

  // Perspective API thresholds (0.0 - 1.0)
  perspectiveThresholds: {
    toxicity: 0.7,
    severeToxicity: 0.5,
    insult: 0.7,
    threat: 0.5,
    sexuallyExplicit: 0.5,
  },

  // Input limits
  maxPassageLength: 2000,
  maxReportTextLength: 200,

  // Gambling keywords — triggers output regeneration
  gamblingKeywords: [
    'casino', 'betting', 'loot box', 'gacha', 'slot machine',
    'gambling', 'poker', 'blackjack', 'roulette', 'lottery',
    'sports betting', 'bookmaker', 'wager', 'jackpot',
    'cryptocurrency day trading', 'crypto trading',
  ],

  // Substance keywords — triggers output regeneration
  substanceKeywords: [
    'alcohol production', 'brewery', 'distillery', 'winery',
    'tobacco industry', 'cigarette manufacturing',
    'recreational drug', 'cannabis industry',
  ],
} as const;
