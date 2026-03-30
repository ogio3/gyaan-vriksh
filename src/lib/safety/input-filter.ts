// Input filter — Layer 2: PII detection + length validation + keyword blocklist
// Runs server-side before sending to AI API

import { detectPii, type PiiDetectionResult } from './pii-detector';
import { SAFETY_CONFIG } from './config';

export interface InputFilterResult {
  allowed: boolean;
  sanitizedText: string;
  reason?: string;
  piiDetection?: PiiDetectionResult;
}

export function filterInput(text: string): InputFilterResult {
  // Length check
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
