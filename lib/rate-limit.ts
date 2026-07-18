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

/**
 * Extract a rate-limit key from a request.
 *
 * `X-Forwarded-For` is client-settable and MUST NOT be trusted blindly: an
 * attacker can prepend arbitrary entries, so keying on the leftmost value lets
 * them mint a fresh bucket per request. Each trusted proxy in front of the app
 * APPENDS the address it received the connection from, so those verified
 * entries sit at the *right* end of the chain. Therefore:
 *
 *  - Set `TRUSTED_PROXY_HOPS` to the number of trusted reverse proxies / edge
 *    layers in front of this app (Vercel's edge = 1, bare origin = 0). With N
 *    trusted hops the verified client is the Nth entry from the right —
 *    `chain[chain.length - N]`. Everything to its left is attacker-controllable
 *    and ignored. Example: `XFF: <forged>, <realIP>` behind one trusted edge
 *    (N=1) resolves to `<realIP>` (index length-1), never `<forged>`.
 *  - With no trusted hops configured we do not trust XFF at all. We prefer a
 *    platform-set `X-Real-IP`, else fall back to a composite of the *rightmost*
 *    XFF hop (closest to us) plus a User-Agent fragment, so at least it isn't a
 *    trivially-rotating fresh bucket.
 *
 * Residual limitation (documented in docs/CODE-AUDIT.md): a client hitting the
 * origin directly, bypassing every trusted proxy, still controls all these
 * headers and can rotate the key. The in-memory limiter is a demo-scale best
 * effort, not a security boundary — for hard guarantees put a real edge/WAF
 * limiter in front and set TRUSTED_PROXY_HOPS to match.
 */
export function clientKey(req: Request): string {
  const rawHops = Number.parseInt(process.env.TRUSTED_PROXY_HOPS ?? "", 10);
  const trustedHops = Number.isFinite(rawHops) && rawHops > 0 ? rawHops : 0;

  const xff = req.headers.get("x-forwarded-for");
  const chain = xff
    ? xff.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  if (trustedHops > 0 && chain.length > 0) {
    // Nth-from-the-right verified entry; clamp to the outermost if the
    // configured hop count exceeds the chain we actually received.
    const idx = Math.max(0, chain.length - trustedHops);
    return `xff:${chain[idx]}`;
  }

  const realIp = req.headers.get("x-real-ip");
  if (realIp) return `rip:${realIp.trim()}`;

  if (chain.length > 0) {
    const ua = req.headers.get("user-agent") ?? "ua?";
    return `cmp:${chain[chain.length - 1]}|${ua.slice(0, 40)}`;
  }

  return "anonymous";
}
