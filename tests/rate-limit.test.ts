import { describe, it, expect, afterEach } from "vitest";
import { createRateLimiter, clientKey } from "@/lib/rate-limit";

describe("createRateLimiter", () => {
  it("allows requests up to the limit", () => {
    const check = createRateLimiter(3, 60_000);
    expect(check("ip", 1000).ok).toBe(true);
    expect(check("ip", 1001).ok).toBe(true);
    expect(check("ip", 1002).ok).toBe(true);
  });

  it("blocks the request that exceeds the limit", () => {
    const check = createRateLimiter(2, 60_000);
    check("ip", 1000);
    check("ip", 1001);
    const blocked = check("ip", 1002);
    expect(blocked.ok).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("reports decreasing remaining budget", () => {
    const check = createRateLimiter(3, 60_000);
    expect(check("ip", 0).remaining).toBe(2);
    expect(check("ip", 1).remaining).toBe(1);
    expect(check("ip", 2).remaining).toBe(0);
  });

  it("slides the window so old hits expire", () => {
    const check = createRateLimiter(1, 1000);
    expect(check("ip", 0).ok).toBe(true);
    expect(check("ip", 500).ok).toBe(false); // still inside window
    expect(check("ip", 1500).ok).toBe(true); // first hit aged out
  });

  it("isolates buckets per key", () => {
    const check = createRateLimiter(1, 60_000);
    expect(check("a", 0).ok).toBe(true);
    expect(check("b", 0).ok).toBe(true); // different key, own budget
    expect(check("a", 1).ok).toBe(false);
  });
});

describe("clientKey", () => {
  afterEach(() => {
    delete process.env.TRUSTED_PROXY_HOPS;
  });

  it("reads the leftmost untrusted hop when TRUSTED_PROXY_HOPS is set", () => {
    // chain = [client, edge]; one trusted hop → client is the entry before it.
    process.env.TRUSTED_PROXY_HOPS = "1";
    const req = new Request("http://x", {
      headers: { "x-forwarded-for": "1.2.3.4, 5.6.7.8" },
    });
    expect(clientKey(req)).toBe("xff:1.2.3.4");
  });

  it("does NOT trust the leftmost x-forwarded-for entry without a proxy config", () => {
    // No TRUSTED_PROXY_HOPS: the client-settable leftmost value must not win.
    const req = new Request("http://x", {
      headers: { "x-forwarded-for": "1.2.3.4, 5.6.7.8", "user-agent": "Mozilla/5.0" },
    });
    const key = clientKey(req);
    expect(key).not.toBe("1.2.3.4");
    expect(key.startsWith("cmp:5.6.7.8|")).toBe(true);
  });

  it("prefers a platform-set x-real-ip over an untrusted forwarded chain", () => {
    const req = new Request("http://x", {
      headers: { "x-forwarded-for": "1.2.3.4", "x-real-ip": "9.9.9.9" },
    });
    expect(clientKey(req)).toBe("rip:9.9.9.9");
  });

  it("clamps to the leftmost hop when trusted hops exceed the chain length", () => {
    process.env.TRUSTED_PROXY_HOPS = "5";
    const req = new Request("http://x", {
      headers: { "x-forwarded-for": "1.2.3.4, 5.6.7.8" },
    });
    expect(clientKey(req)).toBe("xff:1.2.3.4");
  });

  it("defaults to anonymous when no ip headers are present", () => {
    expect(clientKey(new Request("http://x"))).toBe("anonymous");
  });
});
