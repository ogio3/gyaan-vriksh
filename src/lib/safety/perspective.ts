// Google Perspective API client — content toxicity checking
// FAIL-SAFE: if API unavailable, block response (never pass through)

import { SAFETY_CONFIG } from './config';

interface PerspectiveScore {
  value: number;
}

interface PerspectiveResponse {
  attributeScores: Record<string, { summaryScore: PerspectiveScore }>;
}

export interface ToxicityResult {
  blocked: boolean;
  reason?: string;
  scores?: Record<string, number>;
}

const PERSPECTIVE_ENDPOINT =
  'https://commentanalyzer.googleapis.com/v1alpha1/comments:analyze';

export async function checkToxicity(
  text: string,
  apiKey: string,
): Promise<ToxicityResult> {
  if (!apiKey) {
    // No API key = fail safe
    return { blocked: true, reason: 'safety_service_not_configured' };
  }

  const attributes = Object.keys(SAFETY_CONFIG.perspectiveThresholds);

  try {
    const response = await fetch(`${PERSPECTIVE_ENDPOINT}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        comment: { text },
        languages: ['en', 'hi', 'ar', 'ja'],
        requestedAttributes: Object.fromEntries(
          attributes.map((attr) => [attr.toUpperCase(), {}]),
        ),
      }),
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      // API error = fail safe
      return { blocked: true, reason: 'safety_service_error' };
    }

    const data = (await response.json()) as PerspectiveResponse;
    const scores: Record<string, number> = {};

    for (const attr of attributes) {
      const key = attr.toUpperCase();
      const score = data.attributeScores?.[key]?.summaryScore?.value ?? 0;
      scores[attr] = score;
    }

    // Check each attribute against its threshold
    const thresholds = SAFETY_CONFIG.perspectiveThresholds;
    for (const [attr, threshold] of Object.entries(thresholds)) {
      if ((scores[attr] ?? 0) >= threshold) {
        return {
          blocked: true,
          reason: `${attr}_threshold_exceeded`,
          scores,
        };
      }
    }

    return { blocked: false, scores };
  } catch {
    // Network error, timeout = fail safe
    return { blocked: true, reason: 'safety_service_unavailable' };
  }
}
