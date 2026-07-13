/**
 * Minimal in-memory sliding-window rate limiter.
 *
 * Suitable for a single-instance Vercel/Node deployment at demo scale —
 * state lives in module memory, so limits reset on cold start and are
 * per-instance. For multi-instance production use, swap for a shared store
 * (e.g. Upstash Redis).
 */

type Bucket = number[];

const MAX_TRACKED_KEYS = 5000;

export type RateLimitResult = {
  ok: boolean;
  remaining: number;
  retryAfterSeconds: number;
};

export function createRateLimiter(limit: number, windowMs: number) {
  const buckets = new Map<string, Bucket>();

  return function check(key: string, now: number = Date.now()): RateLimitResult {
    const cutoff = now - windowMs;
    const bucket = (buckets.get(key) ?? []).filter((t) => t > cutoff);

    if (bucket.length >= limit) {
      const oldest = bucket[0];
      buckets.set(key, bucket);
      return {
        ok: false,
        remaining: 0,
        retryAfterSeconds: Math.max(1, Math.ceil((oldest + windowMs - now) / 1000)),
      };
    }

    bucket.push(now);
    buckets.set(key, bucket);

    // Bound memory: drop oldest keys if the map grows unreasonably.
    if (buckets.size > MAX_TRACKED_KEYS) {
      const firstKey = buckets.keys().next().value;
      if (firstKey !== undefined) buckets.delete(firstKey);
    }

    return {
      ok: true,
      remaining: limit - bucket.length,
      retryAfterSeconds: 0,
    };
  };
}

/** Extract a stable client key from a request (best effort behind proxies). */
export function clientKey(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "anonymous";
}
