"use client";

import { motion } from "framer-motion";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import { simulate, defaultInputsFor } from "@/lib/scenario-engine";
import { tierFromScore, tierStyle } from "@/lib/risk-tiers";
import { getPlayerBySlug } from "@/data/players";
import { ShieldAlert, Activity, Skull } from "lucide-react";

// Preview renders the deterministic simulator on the real Zion profile so the
// numbers shown here match what the live terminal produces for the same inputs.
const ZION = getPlayerBySlug("zion-williamson")!;
const sim = simulate(ZION, defaultInputsFor(ZION));

const lastPoint = sim.wealthCurve[sim.wealthCurve.length - 1];
const cohortDeltaPct = (
  (lastPoint.projected / lastPoint.baseline - 1) *
  100
).toFixed(1);
const injuryDial = sim.dials.find((d) => d.label === "Injury Risk")?.value ?? 0;
const retireDial =
  sim.dials.find((d) => d.label === "Retirement Collapse")?.value ?? 0;
const stabilityTier =
  sim.dials.find((d) => d.label === "Career Stability")?.tier ?? "STABLE";

// Contract exposure: genuinely computed from the same engine (the
// "Contract instability" bucket), not a hardcoded label. Tone follows the
// tier its inverted-severity maps to.
const contractExposure =
  sim.buckets.find((b) => b.category === "Contract instability")?.exposure ?? 0;
const contractTone = tierStyle(tierFromScore(100 - contractExposure)).tone;

export function DashboardPreview() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40, rotateX: 12 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{ delay: 0.6, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      style={{ perspective: "1200px" }}
      className="relative w-full max-w-5xl mx-auto"
    >
      <div className="relative glass-card-strong overflow-hidden">
        <div className="pointer-events-none absolute inset-0 grid-overlay-fine opacity-50" />
        <div className="scanline pointer-events-none absolute inset-0" />

        {/* Faux window chrome */}
        <div className="flex items-center justify-between border-b border-white/5 bg-black/30 px-4 py-2.5 backdrop-blur">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-400/80 shadow-[0_0_8px_rgba(251,113,133,0.7)]" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-300/80 shadow-[0_0_8px_rgba(251,191,36,0.6)]" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80 shadow-[0_0_8px_rgba(52,211,153,0.7)]" />
            <span className="ml-3 font-mono text-[10px] uppercase tracking-[0.32em] text-slate-400">
              ATHLIX::TERMINAL — Zion Williamson · NOP
            </span>
          </div>
          <span className="font-mono text-[10px] text-cyan-300/70 tracking-[0.22em]">
            PREVIEW
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-[1.2fr_1fr]">
          {/* Wealth trajectory */}
          <div className="rounded-xl border border-white/10 bg-black/30 p-4">
            <div className="mb-2 flex items-center justify-between">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.32em] text-cyan-300/70">
                  Wealth Trajectory
                </div>
                <div className="text-sm text-slate-200">
                  Projected vs. Cohort Baseline
                </div>
              </div>
              <div className="text-right">
                <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-rose-300">
                  Δ vs. cohort
                </div>
                <div className="font-mono text-sm text-rose-200">
                  {cohortDeltaPct}%
                </div>
              </div>
            </div>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={sim.wealthCurve}>
                  <defs>
                    <linearGradient id="pv-proj" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.7} />
                      <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="pv-base" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#a855f7" stopOpacity={0.45} />
                      <stop offset="100%" stopColor="#a855f7" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="age" tickLine={false} axisLine={false} />
                  <YAxis hide />
                  <Area
                    type="monotone"
                    dataKey="baseline"
                    stroke="#c4b5fd"
                    strokeWidth={1.6}
                    strokeDasharray="3 3"
                    fill="url(#pv-base)"
                    isAnimationActive={false}
                  />
                  <Area
                    type="monotone"
                    dataKey="projected"
                    stroke="#22d3ee"
                    strokeWidth={2}
                    fill="url(#pv-proj)"
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Stability dial */}
          <div className="rounded-xl border border-white/10 bg-black/30 p-4">
            <div className="font-mono text-[10px] uppercase tracking-[0.32em] text-cyan-300/70">
              Career Stability
            </div>
            <div className="mt-2 flex items-end gap-3">
              <div className="text-5xl font-semibold tracking-tight neon-text-rose tabular-nums">
                {sim.stabilityScore}
              </div>
              <div className="pb-1.5 font-mono text-xs text-slate-400">
                / 100
              </div>
              <div
                className={`ml-auto rounded-md border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.22em] ${tierStyle(stabilityTier).pill}`}
              >
                {stabilityTier}
              </div>
            </div>
            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${sim.stabilityScore}%` }}
                transition={{ delay: 1, duration: 1.4, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-rose-400 via-amber-300 to-emerald-300"
              />
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2">
              <PreviewStat
                icon={<Activity className="h-3.5 w-3.5 text-rose-300" />}
                label="INJ"
                value={String(injuryDial)}
                tone="rose"
              />
              <PreviewStat
                icon={<Skull className="h-3.5 w-3.5 text-rose-300" />}
                label="RET"
                value={`${retireDial}%`}
                tone="rose"
              />
              <PreviewStat
                icon={<ShieldAlert className="h-3.5 w-3.5 text-amber-300" />}
                label="CTR"
                value={String(contractExposure)}
                tone={contractTone}
              />
            </div>

            <div className="mt-4 space-y-1.5">
              {sim.flashFlags.slice(0, 3).map((flag) => (
                <div
                  key={flag}
                  className="flex items-center gap-2 rounded-md border border-rose-400/20 bg-rose-400/[0.04] px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-rose-200"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-rose-300 animate-pulse" />
                  {flag}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom glow */}
      <div className="pointer-events-none absolute -bottom-12 left-1/2 h-32 w-3/4 -translate-x-1/2 rounded-full bg-cyan-400/30 blur-3xl" />
    </motion.div>
  );
}

function PreviewStat({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone: "rose" | "amber" | "cyan" | "emerald";
}) {
  const toneCls =
    tone === "rose"
      ? "border-rose-400/30 text-rose-200"
      : tone === "amber"
      ? "border-amber-400/30 text-amber-200"
      : tone === "cyan"
      ? "border-cyan-400/30 text-cyan-200"
      : "border-emerald-400/30 text-emerald-200";
  return (
    <div className={`rounded-md border bg-white/[0.03] p-2 ${toneCls}`}>
      <div className="flex items-center justify-between font-mono text-[9px] uppercase tracking-[0.18em] text-slate-400">
        <span>{label}</span>
        {icon}
      </div>
      <div className="mt-0.5 font-mono text-sm tabular-nums">{value}</div>
    </div>
  );
}
