"use client";

import { motion } from "framer-motion";
import { Users, GitCompare } from "lucide-react";
import type { PlayerSeason, Comparable } from "@/lib/player-stats";

export type StatsSource = {
  label: string;
  url: string;
  snapshotDate: string;
  coverage: string;
};

/**
 * Comparable-players engine output: the top-k historical player-seasons most
 * similar to the query, by k-NN over standardized box stats. Real data from
 * the bundled per-season snapshot; when the player isn't in it, an explicit
 * empty state rather than a fabricated comp.
 */
export function ComparablesCard({
  query,
  comparables,
  source,
}: {
  query: PlayerSeason | null;
  comparables: Comparable[];
  source: StatsSource;
}) {
  return (
    <div className="glass-card relative overflow-hidden">
      <div className="flex items-center justify-between border-b border-white/5 px-5 py-3">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-cyan-300" />
          <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-cyan-300/80">
            Comparable Players · k-NN
          </span>
        </div>
        {query && (
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-400">
            vs. {query.season} · {query.pts}p/{query.reb}r/{query.ast}a
          </span>
        )}
      </div>

      {!query || comparables.length === 0 ? (
        <div className="p-4 text-xs leading-relaxed text-slate-400">
          No comparables — this player has no season in the bundled stats
          snapshot ({source.coverage}). Nearest-neighbor comps run on real
          historical box stats only, never invented.
        </div>
      ) : (
        <div className="p-4">
          <div className="space-y-1.5">
            {comparables.map((c, i) => (
              <motion.div
                key={`${c.player}-${c.season}`}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-3 rounded-md border border-white/5 bg-white/[0.02] px-3 py-2"
              >
                <div className="flex h-8 w-11 shrink-0 items-center justify-center rounded-md border border-cyan-400/30 bg-cyan-400/[0.06] font-mono text-[11px] tabular-nums text-cyan-200">
                  {c.similarity}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm text-slate-100">
                    {c.player}{" "}
                    <span className="font-mono text-[10px] text-slate-500">
                      {c.season} · {c.team}
                    </span>
                  </div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">
                    {c.pts}p · {c.reb}r · {c.ast}a · {Math.round(c.usgPct * 100)}% usg
                  </div>
                </div>
                <GitCompare className="h-3.5 w-3.5 shrink-0 text-slate-500" />
              </motion.div>
            ))}
          </div>
          <div className="mt-3 font-mono text-[9px] uppercase tracking-[0.18em] text-slate-500">
            Similarity = standardized-stat distance (pts/reb/ast/net/usg/ts/ast%). Source:{" "}
            <a
              href={source.url}
              className="text-slate-400 underline-offset-2 hover:text-cyan-200 hover:underline"
            >
              {source.label}
            </a>{" "}
            · snapshot {source.snapshotDate}
          </div>
        </div>
      )}
    </div>
  );
}
