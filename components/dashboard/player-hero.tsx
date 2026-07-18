"use client";

import { motion } from "framer-motion";
import {
  User2,
  Trophy,
  Ruler,
  Weight,
  CalendarClock,
  Wallet,
  ScrollText,
  Shield,
} from "lucide-react";
import type { PlayerProfile } from "@/data/players";
import { formatCurrency } from "@/lib/utils";

export function PlayerHero({
  player,
  financialsNote,
}: {
  player: PlayerProfile;
  financialsNote?: string;
}) {
  return (
    <div className="glass-card-strong relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 grid-overlay-fine opacity-40" />
      <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-cyan-400/15 blur-3xl" />
      <div className="pointer-events-none absolute -left-20 -bottom-20 h-72 w-72 rounded-full bg-violet-400/15 blur-3xl" />

      <div className="relative grid grid-cols-1 gap-5 p-5 md:grid-cols-[auto_1fr]">
        {/* Avatar placeholder */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="relative flex h-32 w-32 shrink-0 items-center justify-center rounded-2xl border border-cyan-400/30 bg-gradient-to-br from-cyan-500/15 via-slate-900/60 to-violet-500/15 shadow-[0_0_60px_-16px_rgba(0,229,255,0.6)] md:h-40 md:w-40"
        >
          <div className="absolute inset-0 rounded-2xl scanline pointer-events-none" />
          <div className="relative text-center">
            <User2 className="mx-auto h-12 w-12 text-cyan-200/80" />
            <div className="mt-2 font-mono text-[10px] uppercase tracking-[0.22em] text-cyan-300/70">
              {player.teamAbbr} {player.jersey}
            </div>
          </div>
          <div className="absolute -top-2 -right-2 rounded-md border border-emerald-400/40 bg-emerald-400/10 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.22em] text-emerald-200 shadow-[0_0_18px_rgba(52,211,153,0.4)]">
            ACTIVE
          </div>
        </motion.div>

        <div className="flex flex-col justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-cyan-300/70">
                {player.signature}
              </span>
              <span className="h-3 w-px bg-white/15" />
              <span className="rounded-md border border-cyan-400/30 bg-cyan-400/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.22em] text-cyan-200">
                {player.team}
              </span>
              <span className="rounded-md border border-violet-400/30 bg-violet-400/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.22em] text-violet-200">
                {player.position}
              </span>
            </div>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-100 md:text-4xl">
              {player.name}
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-400">
              {player.thesis}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
            <Stat
              icon={<Ruler className="h-3.5 w-3.5 text-cyan-300" />}
              label="Height"
              value={player.heightFt}
            />
            <Stat
              icon={<Weight className="h-3.5 w-3.5 text-cyan-300" />}
              label="Weight"
              value={`${player.weightLbs} lbs`}
            />
            <Stat
              icon={<CalendarClock className="h-3.5 w-3.5 text-cyan-300" />}
              label="Age · Pro"
              value={`${player.ageYears}y · ${player.yearsPro}y`}
            />
            <Stat
              icon={<Trophy className="h-3.5 w-3.5 text-amber-300" />}
              label="Position"
              value={player.position}
            />
            <Stat
              icon={<Wallet className="h-3.5 w-3.5 text-emerald-300" />}
              label="Contract Value"
              value={formatCurrency(player.estContractValueUsd, { compact: true })}
              tone="emerald"
            />
            <Stat
              icon={<ScrollText className="h-3.5 w-3.5 text-violet-300" />}
              label="Base Salary"
              value={formatCurrency(player.baseSalaryUsd, { compact: true })}
              tone="violet"
            />
            <Stat
              icon={<Shield className="h-3.5 w-3.5 text-cyan-300" />}
              label="Guaranteed"
              value={formatCurrency(player.guaranteedUsd, { compact: true })}
            />
            <Stat
              icon={<Trophy className="h-3.5 w-3.5 text-amber-300" />}
              label="Endorsements"
              value={formatCurrency(player.endorsementsUsd, { compact: true })}
              tone="amber"
            />
          </div>

          {financialsNote && (
            <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-slate-500 leading-relaxed">
              {financialsNote}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone?: "cyan" | "violet" | "emerald" | "amber" | "rose";
}) {
  const toneCls: Record<NonNullable<typeof tone>, string> = {
    cyan: "text-cyan-100",
    violet: "text-violet-100",
    emerald: "text-emerald-100",
    amber: "text-amber-100",
    rose: "text-rose-100",
  };
  const cls = tone ? toneCls[tone] : "text-slate-100";
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] p-2.5">
      <div className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.22em] text-slate-400">
        {icon}
        {label}
      </div>
      <div className={`mt-1 font-mono text-sm tabular-nums ${cls}`}>{value}</div>
    </div>
  );
}
