export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds: number;
}

export interface RateLimiter {
  check: (key: string, now?: number) => RateLimitResult;
}

/**
 * Sliding-window limiter kept in memory. Good for one process per app (PM2 fork mode).
 * Old keys are evicted first once `maxKeys` is reached, so memory stays bounded.
 */
export function createRateLimiter({
  limit,
  windowMs,
  maxKeys = 10_000,
}: {
  limit: number;
  windowMs: number;
  maxKeys?: number;
}): RateLimiter {
  const hits = new Map<string, number[]>();
  return {
    check(key, now = Date.now()) {
      const recent = (hits.get(key) ?? []).filter((timestamp) => now - timestamp < windowMs);
      hits.delete(key);
      if (recent.length >= limit) {
        hits.set(key, recent);
        const oldest = recent[0] ?? now;
        return {
          allowed: false,
          retryAfterSeconds: Math.max(1, Math.ceil((windowMs - (now - oldest)) / 1000)),
        };
      }
      hits.set(key, [...recent, now]);
      if (hits.size > maxKeys) {
        const stalest = hits.keys().next().value;
        if (stalest !== undefined) hits.delete(stalest);
      }
      return { allowed: true, retryAfterSeconds: 0 };
    },
  };
}

/** Visitor IP as seen by Cloudflare. Safe because the app only listens on 127.0.0.1 behind the tunnel. */
export function clientKey(headers: Headers): string {
  return (
    headers.get('cf-connecting-ip') ??
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    'local'
  );
}
