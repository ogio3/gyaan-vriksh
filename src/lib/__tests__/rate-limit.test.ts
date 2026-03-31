import { describe, it, expect } from 'vitest';
import { rateLimit } from '../rate-limit';

describe('rateLimit', () => {
  it('allows requests within limit', () => {
    const key = `test-allow-${Date.now()}`;
    const result = rateLimit(key, 5, 60000);
    expect(result.success).toBe(true);
  });

  it('blocks requests exceeding limit', () => {
    const key = `test-block-${Date.now()}`;
    for (let i = 0; i < 3; i++) {
      rateLimit(key, 3, 60000);
    }
    const result = rateLimit(key, 3, 60000);
    expect(result.success).toBe(false);
  });

  it('resets after window expires', async () => {
    const key = `test-reset-${Date.now()}`;
    for (let i = 0; i < 3; i++) {
      rateLimit(key, 3, 10); // 10ms window
    }
    // Wait for window to expire
    await new Promise((resolve) => setTimeout(resolve, 20));
    const result = rateLimit(key, 3, 10);
    expect(result.success).toBe(true);
  });

  it('treats different keys independently', () => {
    const key1 = `test-key1-${Date.now()}`;
    const key2 = `test-key2-${Date.now()}`;
    for (let i = 0; i < 3; i++) {
      rateLimit(key1, 3, 60000);
    }
    const result = rateLimit(key2, 3, 60000);
    expect(result.success).toBe(true);
  });
});
