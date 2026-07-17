import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { POST } from "@/app/api/chat/route";

function req(body: unknown, ip: string, raw = false) {
  return new Request("http://localhost/api/chat", {
    method: "POST",
    headers: { "x-forwarded-for": ip, "content-type": "application/json" },
    body: raw ? (body as string) : JSON.stringify(body),
  });
}

const validBody = {
  messages: [{ role: "user", parts: [{ type: "text", text: "collapse risk?" }] }],
  context: "Player: Test. Stability: 40/100.",
};

let savedKey: string | undefined;

beforeEach(() => {
  savedKey = process.env.OPENROUTER_API_KEY;
  delete process.env.OPENROUTER_API_KEY; // keep tests offline (demo path)
});

afterEach(() => {
  if (savedKey !== undefined) process.env.OPENROUTER_API_KEY = savedKey;
});

describe("POST /api/chat", () => {
  it("returns 400 on a non-JSON body", async () => {
    const res = await POST(req("{not json", "11.0.0.1", true));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("invalid_json");
  });

  it("returns 400 when messages is empty", async () => {
    const res = await POST(req({ messages: [] }, "11.0.0.2"));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("invalid_request");
  });

  it("returns 400 when a message role is invalid", async () => {
    const res = await POST(
      req({ messages: [{ role: "wizard", parts: [] }] }, "11.0.0.3"),
    );
    expect(res.status).toBe(400);
  });

  it("streams a labeled demo response when no OpenRouter key is set", async () => {
    const res = await POST(req(validBody, "11.0.0.4"));
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain("text/plain");

    // Reconstruct the streamed message from the SSE text-delta events
    // (the payload is chunked, so assert on the reassembled content).
    const raw = await res.text();
    const message = raw
      .split("\n")
      .filter((l) => l.startsWith("data: "))
      .map((l) => l.slice(6))
      .filter((l) => l !== "[DONE]")
      .map((l) => JSON.parse(l))
      .filter((e) => e.type === "text-delta")
      .map((e) => e.delta)
      .join("");

    expect(message).toContain("DEMO MODE");
    expect(message).toContain("no OPENROUTER_API_KEY set");
  });

  it("rate-limits a client that exceeds the window", async () => {
    const ip = "11.0.0.99";
    let last: Response | undefined;
    for (let i = 0; i < 21; i++) {
      last = await POST(req(validBody, ip));
    }
    expect(last!.status).toBe(429);
    expect(last!.headers.get("Retry-After")).toBeTruthy();
  });
});
