import { z } from "zod";
import { searchPlayers, isConfigured, BdlError } from "@/lib/balldontlie";
import { createRateLimiter, clientKey } from "@/lib/rate-limit";
import { slugify } from "@/lib/utils";

export const runtime = "nodejs";

const querySchema = z
  .string()
  .trim()
  .min(2, "query must be at least 2 characters")
  .max(40, "query too long");

// 30 searches/minute per client — generous for typing, hostile to loops.
const limiter = createRateLimiter(30, 60_000);

export async function GET(req: Request) {
  const limit = limiter(clientKey(req));
  if (!limit.ok) {
    return Response.json(
      { error: "rate_limited", retryAfterSeconds: limit.retryAfterSeconds },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
    );
  }

  if (!isConfigured()) {
    return Response.json(
      { error: "live_search_unavailable", detail: "BALLDONTLIE_API_KEY not set" },
      { status: 503 },
    );
  }

  const raw = new URL(req.url).searchParams.get("q") ?? "";
  const parsed = querySchema.safeParse(raw);
  if (!parsed.success) {
    return Response.json(
      { error: "invalid_query", detail: parsed.error.issues[0]?.message },
      { status: 400 },
    );
  }

  try {
    const players = await searchPlayers(parsed.data, 8);
    return Response.json({
      data: players.map((p) => ({
        id: p.id,
        name: `${p.first_name} ${p.last_name}`,
        slug: slugify(`${p.first_name} ${p.last_name}`),
        position: p.position || null,
        team: p.team
          ? { id: p.team.id, abbreviation: p.team.abbreviation, fullName: p.team.full_name }
          : null,
      })),
      source: "balldontlie",
    });
  } catch (err) {
    const status = err instanceof BdlError && err.status === 429 ? 429 : 502;
    return Response.json({ error: "upstream_error" }, { status });
  }
}
