/*
 * Output Filter — Safety Layer 4.
 *
 * Validates AI-generated content BEFORE it reaches the student.
 * This is the last line of defense — even if the system prompt fails
 * to prevent inappropriate content, this filter catches it.
 *
 * Processing order (fast-to-slow, short-circuit on first failure):
 *   1. Gambling keyword scan (instant, string matching)
 *   2. Substance keyword scan (instant, string matching)
 *   3. UAE content standards (instant, regex matching)
 *   4. Perspective API toxicity check (async, ~200ms)
 *
 * FAIL-SAFE principle: if the Perspective API is down, unavailable, or
 * returns an error, the response is BLOCKED (not passed through). This
 * is a deliberate choice for a children's product — false negatives are
 * far worse than false positives.
 */

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
  // 1. Gambling keyword scan — fast string matching before expensive API calls
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

  // 3. UAE content standards (Layer 2.5). Applied when content standard
  // is 'international' (union of all markets = strictest) or 'uae'.
  // 'redirect' = hard block, 'frame' = advisory (content is allowed but
  // the consuming UI should present it with cultural sensitivity framing).
  if (applyUaeStandards || SAFETY_CONFIG.contentStandards === 'international' || SAFETY_CONFIG.contentStandards === 'uae') {
    const uaeResult = checkUaeContentStandards(text);
    if (uaeResult.action === 'redirect') {
      return {
        allowed: false,
        reason: `uae_redirect: ${uaeResult.matchedKeyword}`,
        uaeAction: 'redirect',
      };
    }
  }

  // 4. Perspective API — the most comprehensive check but also the slowest.
  // Placed last so keyword scans can short-circuit before the network call.
  const toxicityResult = await checkToxicity(text, apiKey);
  if (toxicityResult.blocked) {
    return {
      allowed: false,
      reason: toxicityResult.reason ?? 'toxicity_detected',
    };
  }

  return { allowed: true };
}
