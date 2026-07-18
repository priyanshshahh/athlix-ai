"use client";

import { motion } from "framer-motion";
import type { RiskDial } from "@/lib/scenario-engine";
import { tierStyle } from "@/lib/risk-tiers";

export function RiskDialCard({ dial, index = 0 }: { dial: RiskDial; index?: number }) {
  const t = tierStyle(dial.tier);
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, duration: 0.4, ease: "easeOut" }}
      className="glass-card group relative p-4"
    >
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-slate-400">
          {dial.label}
        </span>
        <span
          className={`rounded-md border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.22em] ${t.textSoft} ${t.border} bg-white/[0.03]`}
        >
          {dial.tier}
        </span>
      </div>
      <div className="mt-3 flex items-end gap-2">
        <div
          className={`text-3xl font-semibold tabular-nums leading-none ${t.textSoft}`}
          style={{ textShadow: "0 0 18px currentColor" }}
        >
          {dial.value}
        </div>
        <span className="pb-1 font-mono text-[10px] text-slate-500">/100</span>
        <span
          className={`pb-1 ml-auto font-mono text-[10px] tabular-nums ${
            dial.delta >= 0 ? "text-emerald-300" : "text-rose-300"
          }`}
        >
          {dial.delta >= 0 ? "▲" : "▼"} {Math.abs(dial.delta)}
        </span>
      </div>
      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.05]">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${dial.value}%` }}
          transition={{ duration: 0.7, ease: "easeOut", delay: 0.1 + index * 0.05 }}
          className={`h-full bg-gradient-to-r ${t.bar} shadow-[0_0_14px_rgba(0,229,255,0.4)]`}
        />
      </div>
    </motion.div>
  );
}
