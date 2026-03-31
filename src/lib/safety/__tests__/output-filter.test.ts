import { describe, it, expect } from 'vitest';
import { filterOutput } from '../output-filter';

describe('filterOutput', () => {
  it('allows clean educational content', async () => {
    // No Perspective API key = fail-open in test environment
    const result = await filterOutput('Plants use photosynthesis to turn light into energy.', '');
    expect(result.allowed).toBe(true);
  });

  it('blocks gambling keywords', async () => {
    const result = await filterOutput('You could become a casino dealer as a career path.', '');
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('gambling_keyword');
  });

  it('blocks substance keywords', async () => {
    const result = await filterOutput('Consider a career in alcohol production and brewery management.', '');
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('substance_keyword');
  });

  it('blocks loot box references', async () => {
    const result = await filterOutput('This game uses a gacha system for rewards.', '');
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('gambling_keyword');
  });

  it('allows chemistry content mentioning alcohol', async () => {
    // "alcohol" alone is NOT in substance keywords, only "alcohol production"
    const result = await filterOutput('Ethyl alcohol is used in chemistry experiments.', '');
    expect(result.allowed).toBe(true);
  });
});
