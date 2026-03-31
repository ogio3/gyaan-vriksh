import { describe, it, expect } from 'vitest';
import { getContentTier, CONTENT_TIERS } from '../content-tiers';

describe('getContentTier', () => {
  it('returns null for under_10', () => {
    expect(getContentTier('under_10')).toBeNull();
  });

  it('returns null for adult', () => {
    expect(getContentTier('adult')).toBeNull();
  });

  it('returns correct tier for 10-12', () => {
    const tier = getContentTier('10_12');
    expect(tier).not.toBeNull();
    expect(tier!.maxDepth).toBe(2);
    expect(tier!.dailyLimit).toBe(5);
    expect(tier!.maxBloomLevel).toBe('apply');
    expect(tier!.languageComplexity).toBe('simple');
  });

  it('returns correct tier for 13-15', () => {
    const tier = getContentTier('13_15');
    expect(tier).not.toBeNull();
    expect(tier!.maxDepth).toBe(4);
    expect(tier!.dailyLimit).toBe(10);
    expect(tier!.maxBloomLevel).toBe('evaluate');
  });

  it('returns correct tier for 16-17', () => {
    const tier = getContentTier('16_17');
    expect(tier).not.toBeNull();
    expect(tier!.maxDepth).toBe(-1); // unlimited
    expect(tier!.dailyLimit).toBe(15);
    expect(tier!.maxBloomLevel).toBe('create');
  });

  it('has topic exclusions for younger tiers', () => {
    expect(CONTENT_TIERS['10_12'].excludeTopics.length).toBeGreaterThan(0);
    expect(CONTENT_TIERS['16_17'].excludeTopics.length).toBe(0);
  });
});
