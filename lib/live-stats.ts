import {
  getPlayer,
  searchPlayers,
  getRecentTeamGames,
  isConfigured,
  currentSeason,
  type BdlPlayer,
} from "./balldontlie";

/**
 * Server-side assembly of the real-data panel shown on player pages.
 * Everything in `LiveStats` comes straight from the BALLDONTLIE API
 * (free tier: player bio + team game results). If the API is unreachable
 * or unkeyed we return null and the UI shows an explicit offline state —
 * numbers are never invented.
 */

export type LivePlayerBio = {
  id: number;
  name: string;
  position: string | null;
  height: string | null;
  weight: string | null;
  jersey: string | null;
  college: string | null;
  country: string | null;
  draftYear: number | null;
  team: {
    id: number;
    abbreviation: string;
    fullName: string;
    conference: string;
    division: string;
  } | null;
};

export type LiveGame = {
  date: string;
  opponent: string;
  home: boolean;
  teamScore: number;
  opponentScore: number;
  won: boolean;
  postseason: boolean;
};

export type LiveStats = {
  source: "balldontlie";
  fetchedAt: string;
  season: number;
  player: LivePlayerBio;
  recentGames: LiveGame[];
};

function toBio(p: BdlPlayer): LivePlayerBio {
  return {
    id: p.id,
    name: `${p.first_name} ${p.last_name}`,
    position: p.position || null,
    height: p.height,
    weight: p.weight,
    jersey: p.jersey_number,
    college: p.college,
    country: p.country,
    draftYear: p.draft_year,
    team: p.team
      ? {
          id: p.team.id,
          abbreviation: p.team.abbreviation,
          fullName: p.team.full_name,
          conference: p.team.conference,
          division: p.team.division,
        }
      : null,
  };
}

export async function getLiveStats(opts: {
  bdlId?: number;
  name?: string;
}): Promise<LiveStats | null> {
  if (!isConfigured()) return null;

  try {
    let player: BdlPlayer | null = null;

    if (opts.bdlId && Number.isFinite(opts.bdlId)) {
      player = await getPlayer(opts.bdlId);
    }
    if (!player && opts.name) {
      const candidates = await searchPlayers(opts.name, 4);
      const target = opts.name.trim().toLowerCase();
      player =
        candidates.find(
          (c) => `${c.first_name} ${c.last_name}`.toLowerCase() === target,
        ) ??
        candidates[0] ??
        null;
    }
    if (!player) return null;

    const season = currentSeason();
    let recentGames: LiveGame[] = [];
    if (player.team) {
      const teamId = player.team.id;
      const games = await getRecentTeamGames(teamId, 5, season);
      recentGames = games.map((g) => {
        const home = g.home_team.id === teamId;
        const teamScore = home ? g.home_team_score : g.visitor_team_score;
        const opponentScore = home ? g.visitor_team_score : g.home_team_score;
        return {
          date: g.date.slice(0, 10),
          opponent: home
            ? g.visitor_team.abbreviation
            : g.home_team.abbreviation,
          home,
          teamScore,
          opponentScore,
          won: teamScore > opponentScore,
          postseason: g.postseason,
        };
      });
    }

    return {
      source: "balldontlie",
      fetchedAt: new Date().toISOString(),
      season,
      player: toBio(player),
      recentGames,
    };
  } catch {
    return null;
  }
}
