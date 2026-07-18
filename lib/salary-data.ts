/**
 * Server-only reader for the bundled NBA contract/cap snapshot.
 *
 * The data is a STATIC bundled CSV (data/nba-salaries-2025-26.csv), not a live
 * feed — the app never claims otherwise. Provenance is carried both in the CSV
 * header comments and in SALARY_SOURCE below, and surfaced in the UI wherever a
 * real dollar figure is shown. Parsed once and cached in module memory.
 */

import { readFileSync } from "node:fs";
import path from "node:path";

export type CapHit = { season: string; amount: number };

export type SalaryRecord = {
  player: string;
  team: string;
  position: string;
  /** Current-season cap hit (first listed season), USD. */
  currentCapHit: number;
  currentSeason: string;
  /** All listed future seasons with a non-zero cap hit. */
  capHits: CapHit[];
  /** Sum of the listed cap hits — remaining guaranteed-or-listed value. */
  remainingValue: number;
  /** Number of seasons with a non-zero cap hit. */
  contractYears: number;
};

export const SALARY_SOURCE = {
  label: "gabriel1200/site_Data",
  url: "https://github.com/gabriel1200/site_Data",
  snapshotDate: "2026-07-17",
  seasonBasis: "2025-26",
} as const;

/** Normalize a player name for tolerant matching against the snapshot. */
export function normalizeName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // strip diacritics
    .toLowerCase()
    .replace(/['.’`]/g, "")
    .replace(/\b(jr|sr|ii|iii|iv|v)\b/g, "") // drop generational suffixes
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

let cache: Map<string, SalaryRecord> | null = null;

function load(): Map<string, SalaryRecord> {
  if (cache) return cache;
  const map = new Map<string, SalaryRecord>();

  let raw: string;
  try {
    raw = readFileSync(
      path.join(process.cwd(), "data", "nba-salaries-2025-26.csv"),
      "utf8",
    );
  } catch {
    cache = map;
    return map;
  }

  const lines = raw
    .split(/\r?\n/)
    .filter((l) => l.trim() && !l.startsWith("#"));
  if (lines.length < 2) {
    cache = map;
    return map;
  }

  const header = lines[0].split(",").map((h) => h.trim());
  const seasonCols = header
    .map((h, i) => ({ h, i }))
    .filter(({ h }) => /^\d{4}-\d{2}$/.test(h));
  const teamCol = header.indexOf("Team");
  const posCol = header.indexOf("Pos");

  for (const line of lines.slice(1)) {
    const cells = line.split(",");
    const player = cells[0]?.trim();
    if (!player) continue;

    const capHits: CapHit[] = [];
    for (const { h, i } of seasonCols) {
      const amount = Number(cells[i]);
      if (Number.isFinite(amount) && amount > 0) capHits.push({ season: h, amount });
    }
    if (capHits.length === 0) continue;

    const record: SalaryRecord = {
      player,
      team: (teamCol >= 0 ? cells[teamCol] : "")?.trim() ?? "",
      position: (posCol >= 0 ? cells[posCol] : "")?.trim() ?? "",
      currentCapHit: capHits[0].amount,
      currentSeason: capHits[0].season,
      capHits,
      remainingValue: capHits.reduce((s, c) => s + c.amount, 0),
      contractYears: capHits.length,
    };
    map.set(normalizeName(player), record);
  }

  cache = map;
  return map;
}

/** Look up a player's contract snapshot by name, or null if not in the CSV. */
export function getSalaryRecord(name: string): SalaryRecord | null {
  if (!name) return null;
  return load().get(normalizeName(name)) ?? null;
}
