// PII detection patterns — COPPA 2025 expanded definitions
// Runs both client-side (convenience) and server-side (safety invariant)

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

export function detectPii(text: string): PiiDetectionResult {
  const detections: PiiDetectionResult['detections'] = [];

  for (const [type, pattern] of Object.entries(PII_PATTERNS)) {
    // Reset lastIndex for global patterns
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
  // Sort by index descending to replace from end (preserves earlier indices)
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

export function stripPii(text: string): string {
  return detectPii(text).sanitized;
}
