const BASE_URL = "https://api.balldontlie.io/v1";

export type BdlPlayer = {
  id: number;
  first_name: string;
  last_name: string;
  position: string | null;
  height: string | null;
  weight: string | null;
  jersey_number: string | null;
  team?: {
    id: number;
    abbreviation: string;
    full_name: string;
    name: string;
    city: string;
  };
};

export type BdlPlayerListResponse = {
  data: BdlPlayer[];
  meta?: { next_cursor?: number | null; per_page?: number };
};

/**
 * Search BALLDONTLIE players by name fragment.
 * Public endpoint; API key is recommended (free at balldontlie.io).
 */
export async function searchPlayers(
  query: string,
): Promise<BdlPlayerListResponse> {
  if (!query || query.trim().length < 2) {
    return { data: [] };
  }
  try {
    const res = await fetch(
      `${BASE_URL}/players?search=${encodeURIComponent(query)}&per_page=8`,
      {
        headers: {
          Authorization: process.env.NEXT_PUBLIC_BALLDONTLIE_API_KEY || "",
        },
        cache: "no-store",
      },
    );

    if (!res.ok) return { data: [] };
    return (await res.json()) as BdlPlayerListResponse;
  } catch {
    return { data: [] };
  }
}
