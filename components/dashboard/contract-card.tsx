"use client";

import { motion } from "framer-motion";
import { FileText, DatabaseZap } from "lucide-react";
import type { SalaryRecord } from "@/lib/salary-data";
import { formatCurrency } from "@/lib/utils";

export type SalarySource = {
  label: string;
  url: string;
  snapshotDate: string;
  seasonBasis: string;
};

/**
 * Real contract dollars from the bundled, dated cap-sheet snapshot. When the
 * player isn't in the snapshot it shows an explicit "no contract data" state
 * — never a fabricated figure. Source + snapshot date are always visible so
 * the number is never mistaken for a live feed.
 */
export function ContractCard({
  record,
  source,
}: {
  record: SalaryRecord | null;
  source: SalarySource;
}) {
  if (!record) {
    return (
      <div className="glass-card relative overflow-hidden" data-testid="contract-card-empty">
        <div className="flex items-center gap-2 border-b border-white/5 px-5 py-3">
          <FileText className="h-4 w-4 text-slate-500" />
          <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-slate-400">
            Contract · No snapshot match
          </span>
        </div>
        <div className="p-4 text-xs leading-relaxed text-slate-400">
          This player is not in the bundled cap-sheet snapshot (
          {source.seasonBasis} basis, sourced from {source.label}). No contract
          dollars are shown rather than inventing one — the simulator&rsquo;s
          financial fields are illustrative defaults.
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
      data-testid="contract-card"
    >
      <div className="flex items-center justify-between border-b border-white/5 px-5 py-3">
        <div className="flex items-center gap-2">
          <DatabaseZap className="h-4 w-4 text-emerald-300" />
          <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-emerald-300/90">
            Contract · Cap Sheet
          </span>
        </div>
        <span className="rounded-md border border-emerald-400/30 bg-emerald-400/10 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.18em] text-emerald-200">
          Real data
        </span>
      </div>

      <div className="p-4">
        <div className="grid grid-cols-3 gap-2 font-mono">
          <CapStat
            label={`Cap ${record.currentSeason}`}
            value={formatCurrency(record.currentCapHit, { compact: true })}
            tone="emerald"
          />
          <CapStat
            label="Remaining"
            value={formatCurrency(record.remainingValue, { compact: true })}
            tone="cyan"
          />
          <CapStat
            label="Years listed"
            value={`${record.contractYears}y`}
            tone="amber"
          />
        </div>

        <div className="mt-3 space-y-1">
          {record.capHits.map((c) => (
            <div
              key={c.season}
              className="flex items-center justify-between rounded-md border border-white/5 bg-white/[0.02] px-2.5 py-1.5 font-mono text-[11px]"
            >
              <span className="text-slate-400">{c.season}</span>
              <span className="tabular-nums text-slate-200">
                {formatCurrency(c.amount, { compact: true })}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-3 font-mono text-[9px] uppercase tracking-[0.18em] text-slate-500">
          Source:{" "}
          <a
            href={source.url}
            className="text-slate-400 underline-offset-2 hover:text-emerald-200 hover:underline"
          >
            {source.label}
          </a>{" "}
          · snapshot {source.snapshotDate} · static, not live
        </div>
      </div>
    </motion.div>
  );
}

function CapStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "emerald" | "cyan" | "amber";
}) {
  const toneCls = {
    emerald: "text-emerald-200 border-emerald-400/30",
    cyan: "text-cyan-200 border-cyan-400/30",
    amber: "text-amber-200 border-amber-400/30",
  }[tone];
  return (
    <div className={`rounded-md border bg-white/[0.03] p-2 ${toneCls}`}>
      <div className="text-[9px] uppercase tracking-[0.18em] text-slate-500">{label}</div>
      <div className="mt-0.5 text-sm tabular-nums">{value}</div>
    </div>
  );
}
