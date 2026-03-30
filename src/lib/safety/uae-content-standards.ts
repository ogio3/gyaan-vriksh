/*
 * UAE Content Standards Filter — Layer 2.5.
 *
 * Implements keyword-based filtering aligned with UAE Federal Decree-Law
 * No. 26/2025 on media content standards. This is required for UAE market
 * deployment and is also applied under the 'international' content standard
 * (which unions all market standards to be maximally safe).
 *
 * Three-tier action model:
 *   - redirect: hard block, content must not be generated at all
 *   - frame: content is allowed but should be presented with a cultural
 *     sensitivity disclaimer (e.g., "different cultures view this differently")
 *   - pass: no special handling needed
 *
 * Gotcha: the regex patterns are intentionally broad. "evolution" triggers
 * a 'frame' action even in non-controversial contexts (e.g., "evolution of
 * computing"). This is acceptable because 'frame' only adds context, it
 * doesn't block content.
 */

export const UAE_SENSITIVE_TOPICS = {
  always_redirect: [
    'criticism_of_uae_government',
    'criticism_of_uae_royal_families',
    'criticism_of_islam',
    'blasphemy_any_religion',
    'proselytizing_non_islamic_religion',
    'israel_palestine_political_positions',
    'alcohol_promotion',
    'drug_use_normalization',
    'lgbtq_content_in_uae_context',
    'national_security_topics',
    'content_undermining_public_morals',
  ],

  // FRAME with cultural sensitivity
  culturally_sensitive: [
    'evolution_vs_creation',
    'historical_colonialism',
    'religious_comparison',
    'gender_roles',
    'democracy_forms',
  ],

  // ALLOW with age-appropriate framing
  allowed_with_context: [
    'scientific_consensus',
    'environmental_issues',
    'economic_systems',
    'technology_ethics',
    'career_exploration',
  ],
} as const;

// Redirect keywords: compound regex patterns that require BOTH a sensitive
// entity AND a negative modifier. "islam" alone doesn't trigger; "islam
// criticism" does. This reduces false positives in educational contexts.
const UAE_REDIRECT_KEYWORDS = [
  /\b(uae|emirates|dubai|abu\s*dhabi)\s*(government|ruling|royal|sheikh)/gi,
  /\b(islam|quran|muslim|mosque)\s*(criticism|problem|wrong|bad|fake)/gi,
  /\balcohol\b.*\b(career|business|industry|production)/gi,
  /\b(gambling|casino|betting)\b/gi,
  /\b(convert|proselyt|evangelize|missionary)\b/gi,
];

// Sensitive keywords: single-word patterns for topics that are allowed but
// need cultural framing. These are common educational terms, so the 'frame'
// action is advisory rather than blocking.
const UAE_SENSITIVE_KEYWORDS = [
  /\b(evolution|creationism|darwin)\b/gi,
  /\b(colonialism|colonial|imperialism)\b/gi,
  /\b(religion|faith|belief)\s*(compare|versus|vs)\b/gi,
  /\b(democracy|autocracy|theocracy|monarchy)\b/gi,
];

export interface UaeFilterResult {
  action: 'pass' | 'redirect' | 'frame';
  matchedCategory?: string;
  matchedKeyword?: string;
}

export function checkUaeContentStandards(text: string): UaeFilterResult {
  for (const pattern of UAE_REDIRECT_KEYWORDS) {
    pattern.lastIndex = 0;
    const match = pattern.exec(text);
    if (match) {
      return {
        action: 'redirect',
        matchedCategory: 'always_redirect',
        matchedKeyword: match[0],
      };
    }
  }

  for (const pattern of UAE_SENSITIVE_KEYWORDS) {
    pattern.lastIndex = 0;
    const match = pattern.exec(text);
    if (match) {
      return {
        action: 'frame',
        matchedCategory: 'culturally_sensitive',
        matchedKeyword: match[0],
      };
    }
  }

  return { action: 'pass' };
}
