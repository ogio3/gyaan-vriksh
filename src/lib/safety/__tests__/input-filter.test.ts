import { describe, it, expect } from 'vitest';
import { filterInput } from '../input-filter';

describe('filterInput', () => {
  it('allows normal educational text', () => {
    const result = filterInput('Photosynthesis converts sunlight into energy.');
    expect(result.allowed).toBe(true);
    expect(result.sanitizedText).toBe('Photosynthesis converts sunlight into energy.');
  });

  it('rejects empty input', () => {
    const result = filterInput('');
    expect(result.allowed).toBe(false);
  });

  it('rejects input exceeding max length', () => {
    const longText = 'a'.repeat(2001);
    const result = filterInput(longText);
    expect(result.allowed).toBe(false);
  });

  it('redacts email addresses', () => {
    const result = filterInput('Contact me at john@example.com for more info.');
    expect(result.allowed).toBe(true);
    expect(result.sanitizedText).not.toContain('john@example.com');
    expect(result.sanitizedText).toContain('[REDACTED]');
  });

  it('redacts phone numbers', () => {
    const result = filterInput('Call me at 555-123-4567 for help.');
    expect(result.allowed).toBe(true);
    expect(result.sanitizedText).not.toContain('555-123-4567');
  });

  it('allows educational content with numbers', () => {
    const result = filterInput('The Earth is approximately 4.5 billion years old.');
    expect(result.allowed).toBe(true);
  });
});
