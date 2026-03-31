// In-process rate limiter. Entries are evicted when expired.
// Note: In serverless environments (Vercel), each instance has its own Map.
// For production, replace with Redis/Upstash KV for shared state.
const attempts = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): { success: boolean } {
  const now = Date.now();

  // Evict expired entries to prevent memory leak
  if (attempts.size > 1000) {
    for (const [k, v] of attempts) {
      if (now > v.resetAt) attempts.delete(k);
    }
  }

  const entry = attempts.get(key);

  if (!entry || now > entry.resetAt) {
    attempts.set(key, { count: 1, resetAt: now + windowMs });
    return { success: true };
  }

  if (entry.count >= limit) {
    return { success: false };
  }

  entry.count++;
  return { success: true };
}
