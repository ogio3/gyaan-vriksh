// Output filter — Layer 4: Perspective API + keyword scan
// FAIL-SAFE: Perspective API unavailable = block response

import { checkToxicity } from './perspective';
import { SAFETY_CONFIG } from './config';
import { checkUaeContentStandards } from './uae-content-standards';

export interface OutputFilterResult {
  allowed: boolean;
  reason?: string;
  uaeAction?: 'pass' | 'redirect' | 'frame';
}

export async function filterOutput(
  text: string,
  apiKey: string,
  applyUaeStandards: boolean = true,
): Promise<OutputFilterResult> {
  // 1. Gambling keyword scan
  const textLower = text.toLowerCase();
  for (const keyword of SAFETY_CONFIG.gamblingKeywords) {
    if (textLower.includes(keyword.toLowerCase())) {
      return { allowed: false, reason: `gambling_keyword: ${keyword}` };
    }
  }

  // 2. Substance keyword scan
  for (const keyword of SAFETY_CONFIG.substanceKeywords) {
    if (textLower.includes(keyword.toLowerCase())) {
      return { allowed: false, reason: `substance_keyword: ${keyword}` };
    }
  }

  // 3. UAE content standards (Layer 2.5)
  if (applyUaeStandards || SAFETY_CONFIG.contentStandards === 'international' || SAFETY_CONFIG.contentStandards === 'uae') {
    const uaeResult = checkUaeContentStandards(text);
    if (uaeResult.action === 'redirect') {
      return {
        allowed: false,
        reason: `uae_redirect: ${uaeResult.matchedKeyword}`,
        uaeAction: 'redirect',
      };
    }
    // 'frame' is advisory — content is allowed but should be presented with cultural sensitivity
  }

  // 4. Perspective API toxicity check (fail-safe)
  const toxicityResult = await checkToxicity(text, apiKey);
  if (toxicityResult.blocked) {
    return {
      allowed: false,
      reason: toxicityResult.reason ?? 'toxicity_detected',
    };
  }

  return { allowed: true };
}
