// UAE Federal Decree-Law No. 26/2025 — Media Content Standards filter
// Layer 2.5: sits between system prompt (Layer 1) and output filter (Layer 4)

export const UAE_SENSITIVE_TOPICS = {
  // ALWAYS redirect — never generate content on these
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

// Keywords that indicate content may touch UAE-sensitive topics
const UAE_REDIRECT_KEYWORDS = [
  /\b(uae|emirates|dubai|abu\s*dhabi)\s*(government|ruling|royal|sheikh)/gi,
  /\b(islam|quran|muslim|mosque)\s*(criticism|problem|wrong|bad|fake)/gi,
  /\balcohol\b.*\b(career|business|industry|production)/gi,
  /\b(gambling|casino|betting)\b/gi,
  /\b(convert|proselyt|evangelize|missionary)\b/gi,
];

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
