const tokenCache = new Map<string, number[]>();

export function checkRateLimit(identifier: string, limit: number = 10, windowMs: number = 60000): boolean {
  const now = Date.now();
  const windowStart = now - windowMs;

  let timestamps = tokenCache.get(identifier) ?? [];
  timestamps = timestamps.filter(t => t > windowStart);

  if (timestamps.length >= limit) {
    return false;
  }

  timestamps.push(now);
  tokenCache.set(identifier, timestamps);

  // Lazy cleanup: clear old entries occasionally
  if (Math.random() < 0.05) {
    for (const [key, times] of tokenCache.entries()) {
      const validTimes = times.filter(t => t > windowStart);
      if (validTimes.length === 0) {
        tokenCache.delete(key);
      } else {
        tokenCache.set(key, validTimes);
      }
    }
  }

  return true;
}
