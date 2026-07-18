/**
 * Server-only reader + comparable-players (k-NN) engine over the bundled
 * per-season box-stats snapshot (data/nba-player-seasons.csv).
 *
 * Static bundled data, not a live feed. The engine standardizes a handful of
 * per-game / rate stats (z-score over the population) and finds the nearest
 * historical player-seasons by Euclidean distance in that standardized space.
 * The distance and similarity helpers are pure and unit-tested.
 */

import { readFileSync } from "node:fs";
import path from "node:path";
import { normalizeName } from "./salary-data";

export type PlayerSeason = {
  player: string;
  team: string;
  age: number;
  gp: number;
  pts: number;
  reb: number;
  ast: number;
  netRating: number;
  usgPct: number;
  tsPct: number;
  astPct: number;
  season: string;
};

export type Comparable = PlayerSeason & {
  /** Euclidean distance in standardized feature space (0 = identical). */
  distance: number;
  /** 0–100 similarity score derived from the distance. */
  similarity: number;
};

export const STATS_SOURCE = {
  label: "Kaggle NBA Players (all_seasons.csv)",
  url: "https://github.com/Malakkserag/all-seasons-dataset-analysis",
  snapshotDate: "2026-07-17",
  coverage: "1996-97 – 2022-23",
} as const;

/** Feature order used for the distance computation. */
const FEATURES = [
  "pts",
  "reb",
  "ast",
  "netRating",
  "usgPct",
  "tsPct",
  "astPct",
] as const;

/** Minimum games played to be a comparable — filters tiny-sample noise. */
const MIN_GP = 20;

/** Scale for turning a standardized distance into a 0–100 similarity. */
const SIM_SCALE = 6;

/** Pure Euclidean distance with per-feature inverse-std weighting (z-score). */
export function standardizedDistance(
  a: readonly number[],
  b: readonly number[],
  invStd: readonly number[],
): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const d = (a[i] - b[i]) * invStd[i];
    sum += d * d;
  }
  return Math.sqrt(sum);
}

/** Monotonic map from distance (>=0) to a 0–100 similarity (0 -> 100). */
export function similarityFromDistance(distance: number): number {
  return Math.round(100 * Math.exp(-Math.max(0, distance) / SIM_SCALE));
}

function toVector(s: PlayerSeason): number[] {
  return FEATURES.map((f) => s[f] as number);
}

type Loaded = {
  seasons: PlayerSeason[];
  invStd: number[];
  byPlayer: Map<string, PlayerSeason[]>;
};

let cache: Loaded | null = null;

function load(): Loaded {
  if (cache) return cache;
  const seasons: PlayerSeason[] = [];
  const byPlayer = new Map<string, PlayerSeason[]>();

  let raw = "";
  try {
    raw = readFileSync(
      path.join(process.cwd(), "data", "nba-player-seasons.csv"),
      "utf8",
    );
  } catch {
    cache = { seasons, invStd: FEATURES.map(() => 1), byPlayer };
    return cache;
  }

  const lines = raw.split(/\r?\n/).filter((l) => l.trim() && !l.startsWith("#"));
  const header = lines[0].split(",");
  const col = (name: string) => header.indexOf(name);
  const ci = {
    player: col("player_name"),
    team: col("team"),
    age: col("age"),
    gp: col("gp"),
    pts: col("pts"),
    reb: col("reb"),
    ast: col("ast"),
    net: col("net_rating"),
    usg: col("usg_pct"),
    ts: col("ts_pct"),
    astp: col("ast_pct"),
    season: col("season"),
  };

  for (const line of lines.slice(1)) {
    const c = line.split(",");
    const s: PlayerSeason = {
      player: c[ci.player],
      team: c[ci.team],
      age: Number(c[ci.age]),
      gp: Number(c[ci.gp]),
      pts: Number(c[ci.pts]),
      reb: Number(c[ci.reb]),
      ast: Number(c[ci.ast]),
      netRating: Number(c[ci.net]),
      usgPct: Number(c[ci.usg]),
      tsPct: Number(c[ci.ts]),
      astPct: Number(c[ci.astp]),
      season: c[ci.season],
    };
    if (!s.player || !Number.isFinite(s.pts)) continue;
    seasons.push(s);
    const key = normalizeName(s.player);
    const arr = byPlayer.get(key);
    if (arr) arr.push(s);
    else byPlayer.set(key, [s]);
  }

  // Per-feature std over the eligible population (mean cancels in the diff).
  const pool = seasons.filter((s) => s.gp >= MIN_GP);
  const invStd = FEATURES.map((f) => {
    const xs = pool.map((s) => s[f] as number);
    const mean = xs.reduce((a, b) => a + b, 0) / (xs.length || 1);
    const variance =
      xs.reduce((a, b) => a + (b - mean) * (b - mean), 0) / (xs.length || 1);
    const std = Math.sqrt(variance);
    return std > 0 ? 1 / std : 0;
  });

  cache = { seasons, invStd, byPlayer };
  return cache;
}

/** Most recent season row for a player, or null if not in the snapshot. */
export function getLatestSeason(name: string): PlayerSeason | null {
  if (!name) return null;
  const rows = load().byPlayer.get(normalizeName(name));
  if (!rows || rows.length === 0) return null;
  return [...rows].sort((a, b) => b.season.localeCompare(a.season))[0];
}

/**
 * Top-k comparable player-seasons to a query season, nearest first, one row
 * per distinct comparable player (their closest season is kept).
 */
export function findComparables(query: PlayerSeason, k = 5): Comparable[] {
  const { seasons, invStd } = load();
  const qKey = normalizeName(query.player);
  const qv = toVector(query);

  const scored = seasons
    .filter((s) => s.gp >= MIN_GP && normalizeName(s.player) !== qKey)
    .map((s) => ({ s, distance: standardizedDistance(qv, toVector(s), invStd) }))
    .sort((a, b) => a.distance - b.distance);

  const out: Comparable[] = [];
  const seen = new Set<string>();
  for (const { s, distance } of scored) {
    const key = normalizeName(s.player);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ ...s, distance, similarity: similarityFromDistance(distance) });
    if (out.length >= k) break;
  }
  return out;
}

/** Convenience: comparables for a player by name (uses their latest season). */
export function getComparablesForName(name: string, k = 5): {
  query: PlayerSeason | null;
  comparables: Comparable[];
} {
  const query = getLatestSeason(name);
  if (!query) return { query: null, comparables: [] };
  return { query, comparables: findComparables(query, k) };
}
