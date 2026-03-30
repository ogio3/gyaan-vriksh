/*
 * PII Detection — COPPA 2025 compliance layer.
 *
 * Detects personally identifiable information in user input before it
 * reaches the AI model. Covers COPPA 2025's expanded definition of PII
 * including biometric references, government IDs, and school identifiers
 * (not just the traditional email/phone/name).
 *
 * The sanitized output replaces each detection with [REDACTED], preserving
 * the text structure so the AI can still understand the context. Replacements
 * are applied from end-to-start to avoid index shifting.
 *
 * Gotcha: these patterns intentionally cast a wide net. The school_name
 * pattern will match non-school phrases like "College of Cardinals" — false
 * positives are acceptable because the text is sanitized (not blocked).
 *
 * Multilingual: includes Hindi (मेरा नाम), Japanese (私の名前は), and
 * Punjabi (ਮੇਰਾ ਨਾਮ) name-introduction patterns because the app serves
 * Indian and Japanese markets.
 */

export const PII_PATTERNS: Record<string, RegExp> = {
  // Core identifiers
  email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  phone: /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g,
  name_prefix: /\b(my name is|i am|i'm called|they call me|मेरा नाम|私の名前は|ਮੇਰਾ ਨਾਮ)\b/gi,
  address: /\b\d+\s+[a-zA-Z]+\s+(street|st|avenue|ave|road|rd|drive|dr|lane|ln|blvd|way|court|ct)\b/gi,

  // COPPA 2025 expanded: government IDs
  ssn: /\b\d{3}[-.]?\d{2}[-.]?\d{4}\b/g,
  passport: /\b[A-Z]{1,2}\d{6,9}\b/g,
  birth_certificate: /\b(birth certificate|birth cert)\s*(number|no|#)?\s*[:.]?\s*\w+/gi,
  government_id: /\b(driver'?s?\s*license|state\s*id|national\s*id|aadhaar|emirates\s*id|my\s*number)\s*(number|no|#)?\s*[:.]?\s*\w+/gi,

  // COPPA 2025 expanded: biometric references
  biometric_reference: /\b(fingerprint|retina|face\s*scan|voice\s*print|dna|facial\s*recognition)\b/gi,

  // School-specific identifiers
  student_id: /\b(student\s*(id|number)|roll\s*number|enrollment\s*number)\s*[:.]?\s*\w+/gi,
  school_name: /\b(school|academy|institute|college)\s+of\s+\w+/gi,
};

export interface PiiDetectionResult {
  hasPii: boolean;
  detections: { type: string; match: string; index: number }[];
  sanitized: string;
}

// Scan text for all PII patterns and return both the detection results
// and a sanitized version of the text with PII replaced by [REDACTED].
// Gotcha: global RegExp patterns have mutable lastIndex state — we must
// reset it before each exec loop or subsequent calls will miss matches.
export function detectPii(text: string): PiiDetectionResult {
  const detections: PiiDetectionResult['detections'] = [];

  for (const [type, pattern] of Object.entries(PII_PATTERNS)) {
    pattern.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(text)) !== null) {
      detections.push({
        type,
        match: match[0],
        index: match.index,
      });
    }
  }

  let sanitized = text;
  // Sort by index descending so replacing from the end doesn't invalidate
  // earlier match indices. This avoids the need for offset tracking.
  const sorted = [...detections].sort((a, b) => b.index - a.index);
  for (const d of sorted) {
    sanitized =
      sanitized.slice(0, d.index) +
      '[REDACTED]' +
      sanitized.slice(d.index + d.match.length);
  }

  return {
    hasPii: detections.length > 0,
    detections,
    sanitized,
  };
}

// Convenience wrapper when you only need the sanitized text and don't
// care about individual detections.
export function stripPii(text: string): string {
  return detectPii(text).sanitized;
}
