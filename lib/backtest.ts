/**
 * Server-only backtest of the ATHLIX collapse heuristic against real careers
 * in the bundled per-season stats snapshot.
 *
 * The point is honesty: run the engine's collapse signal over historical
 * player-seasons and measure whether it actually separates real production
 * declines from non-declines — reporting precision/recall as they fall, not
 * as we'd like them. Documented caveats (all material):
 *
 *  - The stats snapshot has no injury or contract data, so injury severity is
 *    PROXIED from games played (fewer games -> higher proxy) and contract /
 *    salary inputs are held neutral. The heuristic is therefore tested on its
 *    age + availability mechanism, not its full input surface.
 *  - "Decline" is defined on scoring only (see below); it is a proxy for
 *    career/earnings collapse, not the thing itself.
 *  - collapseProb depends only on simulator inputs (not profile financials),
 *    so a neutral default profile is sufficient here.
 */

import { simulate, DEFAULT_SCENARIO_PROFILE } from "./scenario-engine";
import { STATS_SOURCE, type PlayerSeason } from "./player-stats";
import { readFileSync } from "node:fs";
import path from "node:path";
import { normalizeName } from "./salary-data";

export type BacktestResult = {
  threshold: number;
  n: number;
  positives: number; // actual declines
  baseRate: number;
  tp: number;
  fp: number;
  fn: number;
  tn: number;
  precision: number;
  recall: number;
  f1: number;
  accuracy: number;
  /** Recall of a trivial "flag everyone over 31" baseline, for context. */
  ageOnlyPrecision: number;
  ageOnlyRecall: number;
  source: typeof STATS_SOURCE;
  params: {
    minGp: number;
    minPts: number;
    declineFraction: number;
    futureWindow: number;
    lastEligibleStartYear: number;
    injuryProxy: string;
  };
};

const MIN_GP = 40; // a rotation player
const MIN_PTS = 8; // relevant scorer
const DECLINE_FRACTION = 0.7; // future best pts below 70% of now = decline
const FUTURE_WINDOW = 3; // seasons ahead to observe
const LAST_START_YEAR = 2019; // need 3 future seasons within a set ending 2022-23

const startYear = (season: string): number => Number(season.slice(0, 4));

/** Availability-based injury proxy (0-100): fewer games -> higher severity. */
function injuryProxyFromGp(gp: number): number {
  return Math.max(0, Math.min(100, Math.round((1 - gp / 72) * 100)));
}

function loadRaw(): PlayerSeason[] {
  let raw = "";
  try {
    raw = readFileSync(
      path.join(process.cwd(), "data", "nba-player-seasons.csv"),
      "utf8",
    );
  } catch {
    return [];
  }
  const lines = raw.split(/\r?\n/).filter((l) => l.trim() && !l.startsWith("#"));
  const header = lines[0].split(",");
  const idx = (n: string) => header.indexOf(n);
  const c = {
    player: idx("player_name"),
    team: idx("team"),
    age: idx("age"),
    gp: idx("gp"),
    pts: idx("pts"),
    reb: idx("reb"),
    ast: idx("ast"),
    net: idx("net_rating"),
    usg: idx("usg_pct"),
    ts: idx("ts_pct"),
    astp: idx("ast_pct"),
    season: idx("season"),
  };
  const out: PlayerSeason[] = [];
  for (const line of lines.slice(1)) {
    const f = line.split(",");
    out.push({
      player: f[c.player],
      team: f[c.team],
      age: Number(f[c.age]),
      gp: Number(f[c.gp]),
      pts: Number(f[c.pts]),
      reb: Number(f[c.reb]),
      ast: Number(f[c.ast]),
      netRating: Number(f[c.net]),
      usgPct: Number(f[c.usg]),
      tsPct: Number(f[c.ts]),
      astPct: Number(f[c.astp]),
      season: f[c.season],
    });
  }
  return out;
}

type Sample = { collapseProb: number; declined: boolean; ageOver31: boolean };

let samplesCache: Sample[] | null = null;

/** Build the labelled (prediction-score, ground-truth) samples once. */
function buildSamples(): Sample[] {
  if (samplesCache) return samplesCache;

  const rows = loadRaw();
  const byPlayer = new Map<string, PlayerSeason[]>();
  for (const r of rows) {
    if (!r.player || !Number.isFinite(r.pts)) continue;
    const k = normalizeName(r.player);
    const arr = byPlayer.get(k);
    if (arr) arr.push(r);
    else byPlayer.set(k, [r]);
  }

  const samples: Sample[] = [];
  for (const seasons of byPlayer.values()) {
    for (const s of seasons) {
      const y = startYear(s.season);
      if (s.gp < MIN_GP || s.pts < MIN_PTS) continue;
      if (y > LAST_START_YEAR) continue;

      // Ground truth: best scoring over the next FUTURE_WINDOW seasons.
      const future = seasons.filter((o) => {
        const oy = startYear(o.season);
        return oy > y && oy <= y + FUTURE_WINDOW;
      });
      const futureBestPts = future.length
        ? Math.max(...future.map((o) => o.pts))
        : 0; // no future season = out of the (rotation) picture
      const declined = futureBestPts < DECLINE_FRACTION * s.pts;

      // Prediction score: the engine collapse signal at this season.
      const collapseProb = simulate(DEFAULT_SCENARIO_PROFILE, {
        age: Math.round(s.age),
        injurySeverity: injuryProxyFromGp(s.gp),
        contractDurationYrs: 3,
        salaryExposure: 50,
      }).collapseProb;

      samples.push({ collapseProb, declined, ageOver31: s.age > 31 });
    }
  }
  samplesCache = samples;
  return samples;
}

/** Classify the cached samples at a collapse-probability threshold. */
export function runBacktest(threshold = 30): BacktestResult {
  const samples = buildSamples();

  let tp = 0,
    fp = 0,
    fn = 0,
    tn = 0,
    positives = 0,
    ageTp = 0,
    ageFp = 0;
  const n = samples.length;

  for (const s of samples) {
    const predicted = s.collapseProb >= threshold;
    if (s.declined) positives++;
    if (predicted && s.declined) tp++;
    else if (predicted && !s.declined) fp++;
    else if (!predicted && s.declined) fn++;
    else tn++;
    if (s.ageOver31 && s.declined) ageTp++;
    else if (s.ageOver31 && !s.declined) ageFp++;
  }

  const precision = tp + fp > 0 ? tp / (tp + fp) : 0;
  const recall = positives > 0 ? tp / positives : 0;
  const f1 =
    precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;

  return {
    threshold,
    n,
    positives,
    baseRate: n > 0 ? positives / n : 0,
    tp,
    fp,
    fn,
    tn,
    precision,
    recall,
    f1,
    accuracy: n > 0 ? (tp + tn) / n : 0,
    ageOnlyPrecision: ageTp + ageFp > 0 ? ageTp / (ageTp + ageFp) : 0,
    ageOnlyRecall: positives > 0 ? ageTp / positives : 0,
    source: STATS_SOURCE,
    params: {
      minGp: MIN_GP,
      minPts: MIN_PTS,
      declineFraction: DECLINE_FRACTION,
      futureWindow: FUTURE_WINDOW,
      lastEligibleStartYear: LAST_START_YEAR,
      injuryProxy: "clamp(round((1 - gp/72) * 100), 0, 100)",
    },
  };
}

/** Precision/recall/F1 across a set of thresholds (an ROC-ish sweep). */
export function runBacktestSweep(
  thresholds: number[] = [20, 25, 30, 35, 40, 45],
): BacktestResult[] {
  return thresholds.map((t) => runBacktest(t));
}
