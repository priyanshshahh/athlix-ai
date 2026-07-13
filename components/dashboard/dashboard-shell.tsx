"use client";

import * as React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  Sparkles,
  ArrowLeft,
  Wallet,
  Activity,
  Skull,
  ShieldAlert,
  Brain,
  Gauge,
} from "lucide-react";
import {
  defaultInputsFor,
  simulate,
  type SimulatorInputs,
} from "@/lib/scenario-engine";
import type { PlayerProfile } from "@/data/players";
import type { LiveStats } from "@/lib/live-stats";
import { PlayerHero } from "@/components/dashboard/player-hero";
import { LiveStatsCard } from "@/components/dashboard/live-stats-card";
import { StabilityScore } from "@/components/dashboard/stability-score";
import { RiskDialCard } from "@/components/dashboard/risk-dial-card";
import { Simulator } from "@/components/dashboard/simulator";
import { WealthChart } from "@/components/charts/wealth-chart";
import { RiskRadar } from "@/components/charts/risk-radar";
import { ChatPanel } from "@/components/ai/chat-panel";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { formatCurrency } from "@/lib/utils";

export function DashboardShell({
  player,
  live = null,
}: {
  player: PlayerProfile;
  live?: LiveStats | null;
}) {
  const defaults = React.useMemo(() => defaultInputsFor(player), [player]);
  const [inputs, setInputs] = React.useState<SimulatorInputs>(defaults);

  const sim = React.useMemo(() => simulate(player, inputs), [player, inputs]);

  const aiContext = React.useMemo(
    () =>
      `Player: ${player.name} (${player.team}, ${player.position}). Stability: ${sim.stabilityScore}/100. Collapse probability: ${sim.collapseProb.toFixed(1)}%. Cohort percentile: ${sim.cohortPercentile}th. Inputs — age: ${inputs.age}, injury severity: ${inputs.injurySeverity}%, contract duration: ${inputs.contractDurationYrs}y, salary exposure: ${inputs.salaryExposure}%. Terminal NW projected: ${formatCurrency(sim.terminalNetWorth, { compact: true })}. Flash flags: ${sim.flashFlags.join(", ")}.`,
    [player, sim, inputs],
  );

  return (
    <div className="relative">
      {/* Top navigation strip */}
      <div className="border-b border-white/5 bg-black/30 backdrop-blur">
        <div className="mx-auto flex max-w-[1600px] items-center gap-3 px-6 py-2.5">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.22em] text-slate-400 hover:text-cyan-200 transition"
          >
            <ArrowLeft className="h-3 w-3" />
            Terminal home
          </Link>
          <span className="h-3 w-px bg-white/10" />
          <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-cyan-300/70">
            DASHBOARD · {player.signature}
          </span>
          <span className="ml-auto flex items-center gap-2 font-mono text-[10px] text-slate-500">
            <span className="status-dot" />
            {live ? "LIVE FEED · BALLDONTLIE" : "SCENARIO MODE · SIM ONLY"}
            <span className="h-3 w-px bg-white/10" />
            <Link
              href="/methodology"
              className="text-slate-400 underline-offset-2 hover:text-cyan-200 hover:underline"
            >
              Methodology
            </Link>
          </span>
        </div>
      </div>

      <div className="mx-auto max-w-[1600px] px-6 py-6">
        {/* TOP ROW: hero + stability score */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="grid gap-4 lg:grid-cols-[1.7fr_1fr]"
        >
          <PlayerHero player={player} />
          <div className="glass-card-strong relative overflow-hidden">
            <div className="pointer-events-none absolute inset-0 grid-overlay-fine opacity-40" />
            <div className="pointer-events-none absolute inset-0 scanline" />
            <div className="relative flex h-full flex-col items-center justify-center p-5">
              <StabilityScore
                score={sim.stabilityScore}
                delta={sim.stabilityScore - player.stabilityScore}
              />
              <div className="mt-5 grid w-full grid-cols-3 gap-2">
                <KeyStat
                  icon={<Skull className="h-3.5 w-3.5 text-rose-300" />}
                  label="Collapse"
                  value={`${sim.collapseProb.toFixed(0)}%`}
                  tone="rose"
                />
                <KeyStat
                  icon={<Gauge className="h-3.5 w-3.5 text-cyan-300" />}
                  label="Percentile"
                  value={`${sim.cohortPercentile}th`}
                  tone="cyan"
                />
                <KeyStat
                  icon={<Wallet className="h-3.5 w-3.5 text-amber-300" />}
                  label="Term NW"
                  value={formatCurrency(sim.terminalNetWorth, { compact: true })}
                  tone="amber"
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* DIAL ROW */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5, ease: "easeOut" }}
          className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5"
        >
          {sim.dials.map((d, i) => (
            <RiskDialCard key={d.label} dial={d} index={i} />
          ))}
        </motion.div>

        {/* MAIN GRID */}
        <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_360px]">
          {/* LEFT: charts + insights */}
          <div className="space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.45 }}
              className="glass-card relative overflow-hidden"
            >
              <div className="flex items-center justify-between border-b border-white/5 px-5 py-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-cyan-300" />
                  <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-cyan-300/80">
                    Wealth Trajectory · ATHLIX projected vs. cohort baseline
                  </span>
                </div>
                <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.22em] text-slate-400">
                  <Legend dot="bg-cyan-300" label="Projected" />
                  <Legend dot="bg-violet-300" label="Baseline" />
                  <Legend dot="bg-rose-300" label="Collapse" />
                </div>
              </div>
              <div className="p-2 pt-3">
                <WealthChart
                  data={sim.wealthCurve}
                  retirementCliffYr={sim.retirementCliffYr}
                />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.45 }}
              className="grid gap-4 lg:grid-cols-[1fr_1fr]"
            >
              {/* Radar */}
              <div className="glass-card relative overflow-hidden">
                <div className="flex items-center justify-between border-b border-white/5 px-5 py-3">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4 text-cyan-300" />
                    <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-cyan-300/80">
                      Risk Exposure Radar
                    </span>
                  </div>
                </div>
                <div className="p-2">
                  <RiskRadar buckets={sim.buckets} />
                </div>
              </div>

              {/* Buckets bars */}
              <div className="glass-card relative overflow-hidden">
                <div className="flex items-center justify-between border-b border-white/5 px-5 py-3">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-cyan-300" />
                    <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-cyan-300/80">
                      Exposure Decomposition
                    </span>
                  </div>
                </div>
                <div className="space-y-3 p-5">
                  {sim.buckets.map((b, i) => (
                    <div key={b.category}>
                      <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.22em]">
                        <span className="text-slate-300">{b.category}</span>
                        <span
                          className={`tabular-nums ${
                            b.exposure > 70
                              ? "text-rose-300"
                              : b.exposure > 45
                              ? "text-amber-300"
                              : "text-cyan-300"
                          }`}
                        >
                          {b.exposure}
                          <span className="text-slate-500"> / {b.baseline}</span>
                        </span>
                      </div>
                      <div className="mt-1.5 relative h-1.5 w-full overflow-hidden rounded-full bg-white/[0.05]">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${b.exposure}%` }}
                          transition={{ duration: 0.6, delay: i * 0.05 }}
                          className={`absolute inset-y-0 left-0 ${
                            b.exposure > 70
                              ? "bg-gradient-to-r from-rose-400 to-amber-400"
                              : b.exposure > 45
                              ? "bg-gradient-to-r from-amber-400 to-cyan-400"
                              : "bg-gradient-to-r from-cyan-400 to-emerald-400"
                          } shadow-[0_0_14px_rgba(0,229,255,0.45)]`}
                        />
                        <div
                          className="absolute inset-y-0 w-px bg-violet-300/80"
                          style={{ left: `${b.baseline}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Insights + flash flags */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.45 }}
              className="grid gap-4 lg:grid-cols-[1.4fr_1fr]"
            >
              <div className="glass-card relative overflow-hidden">
                <div className="flex items-center justify-between border-b border-white/5 px-5 py-3">
                  <div className="flex items-center gap-2">
                    <Brain className="h-4 w-4 text-cyan-300" />
                    <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-cyan-300/80">
                      Engine Insights · live recompute
                    </span>
                  </div>
                  <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-emerald-300">
                    auto-refresh
                  </span>
                </div>
                <ul className="divide-y divide-white/5">
                  {sim.insights.map((ins, i) => (
                    <motion.li
                      key={ins}
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex items-start gap-3 px-5 py-3"
                    >
                      <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_10px_rgba(0,229,255,0.8)]" />
                      <span className="text-sm leading-relaxed text-slate-300">
                        {ins}
                      </span>
                    </motion.li>
                  ))}
                </ul>
              </div>

              <div className="glass-card relative overflow-hidden">
                <div className="flex items-center justify-between border-b border-white/5 px-5 py-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-rose-300" />
                    <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-rose-300/90">
                      Flash Flags
                    </span>
                  </div>
                </div>
                <div className="space-y-2 p-5">
                  {sim.flashFlags.length === 0 && (
                    <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-emerald-300">
                      ▲ No active flags
                    </div>
                  )}
                  {sim.flashFlags.map((flag) => (
                    <div
                      key={flag}
                      className="flex items-center gap-2 rounded-md border border-rose-400/30 bg-rose-400/[0.06] px-3 py-2 font-mono text-[11px] uppercase tracking-[0.18em] text-rose-200"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-rose-300 animate-pulse" />
                      {flag}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>

          {/* RIGHT: simulator + tabs */}
          <motion.aside
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15, duration: 0.5 }}
            className="space-y-4"
          >
            <LiveStatsCard live={live} />

            <Simulator inputs={inputs} setInputs={setInputs} defaults={defaults} />

            <div className="glass-card relative overflow-hidden">
              <div className="flex items-center justify-between border-b border-white/5 px-5 py-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-cyan-300" />
                  <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-cyan-300/80">
                    Engine Outputs
                  </span>
                </div>
              </div>
              <div className="p-4">
                <Tabs defaultValue="output">
                  <TabsList className="w-full">
                    <TabsTrigger value="output" className="flex-1">
                      Output
                    </TabsTrigger>
                    <TabsTrigger value="exposure" className="flex-1">
                      Exposure
                    </TabsTrigger>
                    <TabsTrigger value="retire" className="flex-1">
                      Retire
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="output">
                    <ReadoutRow label="Stability score" value={`${sim.stabilityScore} / 100`} />
                    <ReadoutRow label="Collapse prob" value={`${sim.collapseProb.toFixed(1)}%`} tone="rose" />
                    <ReadoutRow label="Cohort percentile" value={`${sim.cohortPercentile}th`} tone="cyan" />
                    <ReadoutRow
                      label="Peak NW"
                      value={formatCurrency(sim.peakNetWorth, { compact: true })}
                      tone="emerald"
                    />
                    <ReadoutRow
                      label="Terminal NW"
                      value={formatCurrency(sim.terminalNetWorth, { compact: true })}
                      tone="amber"
                    />
                  </TabsContent>
                  <TabsContent value="exposure">
                    {sim.dials.map((d) => (
                      <ReadoutRow
                        key={d.label}
                        label={d.label}
                        value={`${d.value} (${d.tier})`}
                        tone={
                          d.tier === "CRITICAL"
                            ? "rose"
                            : d.tier === "VOLATILE"
                            ? "amber"
                            : d.tier === "ELEVATED"
                            ? "cyan"
                            : "emerald"
                        }
                      />
                    ))}
                  </TabsContent>
                  <TabsContent value="retire">
                    <ReadoutRow
                      label="Cliff age"
                      value={`${sim.retirementCliffYr} yr`}
                      tone="rose"
                    />
                    <ReadoutRow
                      label="Endorse decay rate"
                      value={`${(2 + inputs.injurySeverity * 0.04).toFixed(2)}% / qtr`}
                      tone="amber"
                    />
                    <ReadoutRow
                      label="Liquidity hedge"
                      value={`${Math.round(100 - sim.stabilityScore * 0.9)} bps`}
                      tone="cyan"
                    />
                    <ReadoutRow
                      label="Post-career income tier"
                      value={
                        sim.cohortPercentile > 70
                          ? "TOP DECILE"
                          : sim.cohortPercentile > 40
                          ? "MID COHORT"
                          : "BOTTOM TIER"
                      }
                      tone="emerald"
                    />
                  </TabsContent>
                </Tabs>
              </div>
            </div>

            <div className="glass-card relative overflow-hidden p-4">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-cyan-300/80">
                  Cohort Index
                </span>
                <TrendingDown className="h-4 w-4 text-rose-300" />
              </div>
              <div className="mt-2 flex items-end justify-between">
                <span className="text-3xl font-semibold text-holographic tabular-nums">
                  {sim.cohortPercentile}
                  <span className="text-base text-slate-400">th</span>
                </span>
                <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-slate-400">
                  vs. synthetic cohort curve
                </span>
              </div>
              <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.05]">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${sim.cohortPercentile}%` }}
                  transition={{ duration: 0.9, ease: "easeOut" }}
                  className="h-full bg-gradient-to-r from-rose-400 via-amber-300 to-emerald-300"
                />
              </div>
            </div>
          </motion.aside>
        </div>
      </div>

      <ChatPanel playerName={player.name} context={aiContext} />
    </div>
  );
}

function KeyStat({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone: "rose" | "cyan" | "amber" | "emerald";
}) {
  const toneCls = {
    rose: "text-rose-200 border-rose-400/30",
    cyan: "text-cyan-200 border-cyan-400/30",
    amber: "text-amber-200 border-amber-400/30",
    emerald: "text-emerald-200 border-emerald-400/30",
  }[tone];
  return (
    <div className={`rounded-md border bg-white/[0.03] p-2 ${toneCls}`}>
      <div className="flex items-center justify-between font-mono text-[9px] uppercase tracking-[0.22em] text-slate-400">
        <span>{label}</span>
        {icon}
      </div>
      <div className="mt-1 font-mono text-sm tabular-nums">{value}</div>
    </div>
  );
}

function Legend({ dot, label }: { dot: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
      {label}
    </span>
  );
}

function ReadoutRow({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "rose" | "cyan" | "amber" | "emerald" | "violet";
}) {
  const toneCls = {
    rose: "text-rose-200",
    cyan: "text-cyan-200",
    amber: "text-amber-200",
    emerald: "text-emerald-200",
    violet: "text-violet-200",
  };
  const cls = tone ? toneCls[tone] : "text-slate-100";
  return (
    <div className="flex items-center justify-between border-b border-white/5 py-2 last:border-b-0">
      <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-slate-400">
        {label}
      </span>
      <span className={`font-mono text-xs tabular-nums ${cls}`}>{value}</span>
    </div>
  );
}
