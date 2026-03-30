/*
 * Safety Configuration — Central constants for all safety layers.
 *
 * All thresholds and keyword lists are defined here rather than scattered
 * across individual filter modules. This makes audit and adjustment easy
 * (a compliance reviewer only needs to check this one file).
 *
 * Content standard defaults to 'international' which applies the union
 * (strictest) of all market-specific standards. Override via the
 * CONTENT_STANDARDS environment variable for market-specific deployments.
 */

export type ContentStandard = 'international' | 'uae' | 'eu' | 'us' | 'custom';

export const SAFETY_CONFIG = {
  contentStandards: (process.env.CONTENT_STANDARDS || 'international') as ContentStandard,

  // Perspective API thresholds: 0.0 (no toxicity) to 1.0 (maximum toxicity).
  // Thresholds are intentionally conservative for a children's product.
  // severeToxicity and threat at 0.5 = very sensitive; toxicity and insult
  // at 0.7 = moderate (avoids blocking legitimate academic content about war, etc.).
  perspectiveThresholds: {
    toxicity: 0.7,
    severeToxicity: 0.5,
    insult: 0.7,
    threat: 0.5,
    sexuallyExplicit: 0.5,
  },

  // Input limits — 2000 chars is roughly one textbook paragraph.
  // Longer passages degrade AI output quality and increase cost.
  maxPassageLength: 2000,
  // Content reports from students/teachers/parents
  maxReportTextLength: 200,

  // Gambling keywords — if any appear in AI output, the response is blocked.
  // Includes both obvious terms (casino, roulette) and subtle ones
  // (loot box, gacha) that normalize gambling mechanics in gaming.
  gamblingKeywords: [
    'casino', 'betting', 'loot box', 'gacha', 'slot machine',
    'gambling', 'poker', 'blackjack', 'roulette', 'lottery',
    'sports betting', 'bookmaker', 'wager', 'jackpot',
    'cryptocurrency day trading', 'crypto trading',
  ],

  // Substance keywords — blocks career suggestions in alcohol/tobacco/drug
  // industries. Note: "alcohol" alone is NOT blocked (it appears in chemistry
  // contexts); only compound phrases like "alcohol production" trigger this.
  substanceKeywords: [
    'alcohol production', 'brewery', 'distillery', 'winery',
    'tobacco industry', 'cigarette manufacturing',
    'recreational drug', 'cannabis industry',
  ],
} as const;
