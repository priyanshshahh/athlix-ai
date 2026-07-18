import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  searchPlayers,
  getRecentTeamGames,
  isConfigured,
  currentSeason,
  BdlError,
} from "@/lib/balldontlie";

const KEY = "test-bdl-key";

function jsonResponse(body: unknown, ok = true, status = 200) {
  return {
    ok,
    status,
    json: async () => body,
  } as unknown as Response;
}

beforeEach(() => {
  process.env.BALLDONTLIE_API_KEY = KEY;
});

afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.BALLDONTLIE_API_KEY;
});

describe("isConfigured", () => {
  it("is true when the key is set and false when absent", () => {
    expect(isConfigured()).toBe(true);
    delete process.env.BALLDONTLIE_API_KEY;
    expect(isConfigured()).toBe(false);
  });
});

describe("currentSeason", () => {
  it("labels a season by its starting year (October onward)", () => {
    expect(currentSeason(new Date("2025-11-15T00:00:00Z"))).toBe(2025);
  });

  it("assigns pre-October months to the prior season", () => {
    expect(currentSeason(new Date("2025-03-15T00:00:00Z"))).toBe(2024);
  });
});

describe("searchPlayers", () => {
  it("short-circuits queries under two characters without hitting the API", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    expect(await searchPlayers("a")).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("sends the Authorization header and returns player data", async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse({ data: [{ id: 1, first_name: "Stephen", last_name: "Curry" }] }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const players = await searchPlayers("curry");
    expect(players).toHaveLength(1);
    expect(players[0].last_name).toBe("Curry");

    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toContain("search=curry");
    expect(init?.headers).toMatchObject({ Authorization: KEY });
  });

  it("throws BdlError with the upstream status on a non-ok response", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({}, false, 429)));
    await expect(searchPlayers("curry")).rejects.toBeInstanceOf(BdlError);
  });

  it("throws when the API key is not configured", async () => {
    delete process.env.BALLDONTLIE_API_KEY;
    vi.stubGlobal("fetch", vi.fn());
    await expect(searchPlayers("curry")).rejects.toBeInstanceOf(BdlError);
  });
});

describe("getRecentTeamGames", () => {
  it("keeps only Final games and sorts them newest-first", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        jsonResponse({
          data: [
            { id: 1, date: "2025-11-01", status: "Final" },
            { id: 2, date: "2025-11-05", status: "Final" },
            { id: 3, date: "2025-11-06", status: "In Progress" },
          ],
        }),
      ),
    );

    const games = await getRecentTeamGames(14, 5, 2025);
    expect(games.map((g) => g.id)).toEqual([2, 1]);
  });
});
