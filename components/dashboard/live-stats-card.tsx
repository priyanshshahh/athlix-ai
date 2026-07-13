"use client";

import { motion } from "framer-motion";
import { Database, WifiOff } from "lucide-react";
import type { LiveStats } from "@/lib/live-stats";

/**
 * Renders the real-data panel: player bio + recent team results fetched
 * server-side from BALLDONTLIE. When `live` is null the card shows an
 * explicit offline state instead of placeholder numbers.
 */
export function LiveStatsCard({ live }: { live: LiveStats | null }) {
  if (!live) {
    return (
      <div className="glass-card relative overflow-hidden" data-testid="live-stats-offline">
        <div className="flex items-center gap-2 border-b border-white/5 px-5 py-3">
          <WifiOff className="h-4 w-4 text-slate-500" />
          <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-slate-400">
            Live Feed · Offline
          </span>
        </div>
        <div className="p-4 text-xs leading-relaxed text-slate-400">
          BALLDONTLIE feed unavailable (no API key configured or request
          failed). The terminal is running in scenario mode — all figures
          below come from the deterministic simulator, not live data.
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="glass-card relative overflow-hidden"
      data-testid="live-stats-card"
    >
      <div className="flex items-center justify-between border-b border-white/5 px-5 py-3">
        <div className="flex items-center gap-2">
          <Database className="h-4 w-4 text-emerald-300" />
          <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-emerald-300/90">
            Live Feed · BALLDONTLIE
          </span>
        </div>
        <span className="rounded-md border border-emerald-400/30 bg-emerald-400/10 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.18em] text-emerald-200">
          Real data
        </span>
      </div>

      <div className="p-4">
        <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
          <BioRow label="Team" value={live.player.team?.fullName ?? "Free agent"} />
          <BioRow label="Position" value={live.player.position ?? "—"} />
          <BioRow label="College" value={live.player.college ?? "—"} />
          <BioRow label="Country" value={live.player.country ?? "—"} />
          <BioRow
            label="Draft"
            value={live.player.draftYear ? String(live.player.draftYear) : "Undrafted"}
          />
          <BioRow label="Season" value={`${live.season}-${(live.season + 1) % 100}`} />
        </div>

        {live.recentGames.length > 0 && (
          <>
            <div className="mt-4 mb-2 font-mono text-[10px] uppercase tracking-[0.28em] text-slate-400">
              Recent team results
            </div>
            <div className="space-y-1.5">
              {live.recentGames.map((g) => (
                <div
                  key={`${g.date}-${g.opponent}`}
                  className="flex items-center justify-between rounded-md border border-white/5 bg-white/[0.02] px-2.5 py-1.5 font-mono text-[11px]"
                >
                  <span className="text-slate-400">{g.date}</span>
                  <span className="text-slate-300">
                    {g.home ? "vs" : "@"} {g.opponent}
                    {g.postseason ? " · PO" : ""}
                  </span>
                  <span
                    className={`tabular-nums ${g.won ? "text-emerald-300" : "text-rose-300"}`}
                  >
                    {g.won ? "W" : "L"} {g.teamScore}–{g.opponentScore}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}

        <div className="mt-3 font-mono text-[9px] uppercase tracking-[0.18em] text-slate-500">
          Source: balldontlie.io · fetched {live.fetchedAt.slice(0, 16).replace("T", " ")} UTC
        </div>
      </div>
    </motion.div>
  );
}

function BioRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-white/5 bg-white/[0.02] px-2.5 py-1.5">
      <div className="text-[9px] uppercase tracking-[0.22em] text-slate-500">{label}</div>
      <div className="mt-0.5 truncate text-slate-200">{value}</div>
    </div>
  );
}
