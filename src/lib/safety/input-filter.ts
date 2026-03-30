/*
 * Input Filter — Safety Layer 2.
 *
 * Validates and sanitizes user-submitted text before it reaches the AI.
 * This is a server-side guard that runs synchronously (no async calls).
 *
 * Processing order:
 *   1. Empty/whitespace check
 *   2. Length limit (2000 chars from SAFETY_CONFIG)
 *   3. PII detection and redaction
 *
 * Design choice: PII-containing input is ALLOWED (not blocked) after
 * sanitization. Blocking would frustrate users who accidentally include
 * a school name in their passage. Instead, PII is silently replaced with
 * [REDACTED] before reaching the AI, and the piiDetection result is
 * available for logging/analytics.
 */

import { detectPii, type PiiDetectionResult } from './pii-detector';
import { SAFETY_CONFIG } from './config';

export interface InputFilterResult {
  allowed: boolean;
  sanitizedText: string;
  reason?: string;
  piiDetection?: PiiDetectionResult;
}

export function filterInput(text: string): InputFilterResult {
  if (!text || text.trim().length === 0) {
    return { allowed: false, sanitizedText: '', reason: 'empty_input' };
  }

  if (text.length > SAFETY_CONFIG.maxPassageLength) {
    return {
      allowed: false,
      sanitizedText: text.slice(0, SAFETY_CONFIG.maxPassageLength),
      reason: 'input_too_long',
    };
  }

  // PII detection and stripping
  const piiResult = detectPii(text);

  return {
    allowed: true,
    sanitizedText: piiResult.sanitized,
    piiDetection: piiResult,
  };
}
