/**
 * Server-side BALLDONTLIE client.
 *
 * The API key is read from `BALLDONTLIE_API_KEY` (server env only) and is
 * never shipped to the browser — all access goes through route handlers or
 * server components. Free-tier endpoints used: /players, /players/:id,
 * /teams, /games. (Per-player stat lines and season averages require a paid
 * tier and are intentionally not called.)
 */

const BASE_URL = "https://api.balldontlie.io/v1";

export type BdlTeam = {
  id: number;
  conference: string;
  division: string;
  city: string;
  name: string;
  full_name: string;
  abbreviation: string;
};

export type BdlPlayer = {
  id: number;
  first_name: string;
  last_name: string;
  position: string | null;
  height: string | null;
  weight: string | null;
  jersey_number: string | null;
  college: string | null;
  country: string | null;
  draft_year: number | null;
  draft_round: number | null;
  draft_number: number | null;
  team?: BdlTeam;
};

export type BdlGame = {
  id: number;
  date: string;
  season: number;
  status: string;
  period: number;
  postseason: boolean;
  home_team_score: number;
  visitor_team_score: number;
  home_team: BdlTeam;
  visitor_team: BdlTeam;
};

type BdlList<T> = {
  data: T[];
  meta?: { next_cursor?: number | null; per_page?: number };
};

export class BdlError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "BdlError";
    this.status = status;
  }
}

export function isConfigured(): boolean {
  return Boolean(process.env.BALLDONTLIE_API_KEY);
}

/**
 * Upstream fetch timeout. A slow/hanging BALLDONTLIE response should fail
 * fast into the app's explicit offline/null states rather than blocking the
 * request until the platform function limit. Surfaced as a 504 BdlError so
 * callers handle it exactly like any other upstream failure.
 */
const BDL_TIMEOUT_MS = 6000;

async function bdlFetch<T>(
  path: string,
  params: Record<string, string | number | Array<string | number>>,
  revalidateSeconds = 300,
): Promise<T> {
  const key = process.env.BALLDONTLIE_API_KEY;
  if (!key) {
    throw new BdlError(0, "BALLDONTLIE_API_KEY is not configured");
  }

  const url = new URL(`${BASE_URL}${path}`);
  for (const [k, v] of Object.entries(params)) {
    if (Array.isArray(v)) {
      for (const item of v) url.searchParams.append(k, String(item));
    } else {
      url.searchParams.set(k, String(v));
    }
  }

  let res: Response;
  try {
    res = await fetch(url.toString(), {
      headers: { Authorization: key },
      next: { revalidate: revalidateSeconds },
      signal: AbortSignal.timeout(BDL_TIMEOUT_MS),
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === "TimeoutError") {
      throw new BdlError(504, `BALLDONTLIE ${path} timed out after ${BDL_TIMEOUT_MS}ms`);
    }
    throw err;
  }

  if (!res.ok) {
    throw new BdlError(res.status, `BALLDONTLIE ${path} -> ${res.status}`);
  }
  return (await res.json()) as T;
}

/** Search active + historical NBA players by name fragment (live API). */
export async function searchPlayers(
  query: string,
  perPage = 8,
): Promise<BdlPlayer[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  const res = await bdlFetch<BdlList<BdlPlayer>>("/players", {
    search: q,
    per_page: perPage,
  });
  return res.data;
}

/** Fetch a single player by BALLDONTLIE id. Returns null on 404. */
export async function getPlayer(id: number): Promise<BdlPlayer | null> {
  try {
    const res = await bdlFetch<{ data: BdlPlayer }>(`/players/${id}`, {});
    return res.data;
  } catch (err) {
    if (err instanceof BdlError && err.status === 404) return null;
    throw err;
  }
}

/**
 * NBA season for a given date: seasons are labeled by their starting year
 * (October through June). July–September belong to the season just ended.
 */
export function currentSeason(now: Date = new Date()): number {
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth() + 1;
  return month >= 10 ? year : year - 1;
}

/**
 * Most recent completed games for a team in the current season,
 * newest first. Real results from the BALLDONTLIE /games endpoint.
 */
export async function getRecentTeamGames(
  teamId: number,
  limit = 5,
  season = currentSeason(),
): Promise<BdlGame[]> {
  const res = await bdlFetch<BdlList<BdlGame>>("/games", {
    "seasons[]": season,
    "team_ids[]": teamId,
    per_page: 100,
  });
  return res.data
    .filter((g) => g.status === "Final")
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, limit);
}
