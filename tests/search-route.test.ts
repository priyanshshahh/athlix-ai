import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { GET } from "@/app/api/players/search/route";

const KEY = "test-bdl-key";

function jsonResponse(body: unknown, ok = true, status = 200) {
  return { ok, status, json: async () => body } as unknown as Response;
}

// Each test uses a distinct client IP so the module-level rate limiter
// (shared across imports) does not bleed between cases.
function req(q: string, ip: string) {
  return new Request(`http://localhost/api/players/search?q=${encodeURIComponent(q)}`, {
    headers: { "x-forwarded-for": ip },
  });
}

beforeEach(() => {
  process.env.BALLDONTLIE_API_KEY = KEY;
});

afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.BALLDONTLIE_API_KEY;
});

describe("GET /api/players/search", () => {
  it("returns 503 when the API key is not configured", async () => {
    delete process.env.BALLDONTLIE_API_KEY;
    const res = await GET(req("curry", "10.0.0.1"));
    expect(res.status).toBe(503);
    expect((await res.json()).error).toBe("live_search_unavailable");
  });

  it("returns 400 for a query shorter than two characters", async () => {
    const res = await GET(req("a", "10.0.0.2"));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("invalid_query");
  });

  it("returns mapped, slugified players on the happy path", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        jsonResponse({
          data: [
            {
              id: 115,
              first_name: "Stephen",
              last_name: "Curry",
              position: "G",
              team: { id: 10, abbreviation: "GSW", full_name: "Golden State Warriors" },
            },
          ],
        }),
      ),
    );
    const res = await GET(req("curry", "10.0.0.3"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.source).toBe("balldontlie");
    expect(body.data[0]).toMatchObject({
      id: 115,
      name: "Stephen Curry",
      slug: "stephen-curry",
      team: { abbreviation: "GSW" },
    });
  });

  it("rate-limits a client that exceeds the window", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ data: [] })));
    const ip = "10.0.0.99";
    let last: Response | undefined;
    for (let i = 0; i < 31; i++) {
      last = await GET(req("curry", ip));
    }
    expect(last!.status).toBe(429);
    expect(last!.headers.get("Retry-After")).toBeTruthy();
  });
});
