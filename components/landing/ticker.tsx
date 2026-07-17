"use client";

import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Activity,
  Skull,
} from "lucide-react";

type TickerItem = {
  label: string;
  value: string;
  trend: "up" | "down" | "alert";
  tag?: string;
};

const ITEMS: TickerItem[] = [
  { label: "ZION.NOP", value: "−12.4% wealth Δ", trend: "down", tag: "INJ" },
  { label: "JA.MEM", value: "behavioral vol 78", trend: "alert", tag: "BHV" },
  { label: "BS.BKN", value: "retire collapse 91%", trend: "down", tag: "RET" },
  { label: "LB.CHI", value: "cartilage degen ↑", trend: "alert", tag: "INJ" },
  { label: "AD.DAL", value: "+2.1% stability", trend: "up", tag: "STB" },
  { label: "LBJ.LAL", value: "age-curve inflection", trend: "alert", tag: "AGE" },
  { label: "KD.HOU", value: "endorsement floor solid", trend: "up", tag: "END" },
  { label: "EMBIID.PHI", value: "load failure risk 84", trend: "down", tag: "INJ" },
  { label: "TATUM.BOS", value: "+5.6% terminal NW", trend: "up", tag: "NW" },
  { label: "WEMBY.SAS", value: "stability 92/100", trend: "up", tag: "STB" },
  { label: "CONTRACT.RISK", value: "NBA-wide premium ↑1.8%", trend: "alert", tag: "MKT" },
  { label: "INJ.INDEX", value: "soft-tissue 0.34σ", trend: "down", tag: "MKT" },
  { label: "RETIRE.LIQ", value: "tier-1 cohort −4.2%", trend: "down", tag: "MKT" },
];

function Icon({ trend }: { trend: TickerItem["trend"] }) {
  if (trend === "up") return <TrendingUp className="h-3 w-3 text-emerald-300" />;
  if (trend === "down") return <TrendingDown className="h-3 w-3 text-rose-300" />;
  return <AlertTriangle className="h-3 w-3 text-amber-300" />;
}

function Tag({ tag }: { tag?: string }) {
  if (!tag) return null;
  return (
    <span className="rounded-sm bg-white/[0.04] border border-white/10 px-1.5 py-px text-[9px] font-mono text-slate-400 uppercase tracking-[0.18em]">
      {tag}
    </span>
  );
}

export function Ticker() {
  const items = [...ITEMS, ...ITEMS];
  return (
    <div className="relative w-full overflow-hidden border-y border-white/5 bg-gradient-to-r from-black/40 via-[#06091a]/60 to-black/40 backdrop-blur">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-32 bg-gradient-to-r from-[#050816] to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-32 bg-gradient-to-l from-[#050816] to-transparent" />

      <div className="flex items-center gap-2 px-4 py-2 border-b border-white/5 bg-black/30">
        <span className="status-dot" />
        <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-cyan-200/80">
          ATHLIX::SAMPLE_TICKER
        </span>
        <span className="ml-2 flex items-center gap-1 font-mono text-[10px] text-slate-500">
          <Activity className="h-3 w-3" />
          Illustrative values · not a live market feed
        </span>
        <span className="ml-auto flex items-center gap-1 font-mono text-[10px] text-slate-500">
          <Skull className="h-3 w-3 text-rose-300" />
          Demo strip
        </span>
      </div>

      <motion.div
        className="flex items-center gap-8 py-3 whitespace-nowrap will-change-transform"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 65, repeat: Infinity, ease: "linear" }}
      >
        {items.map((it, idx) => (
          <div
            key={idx}
            className="flex items-center gap-2 font-mono text-[11px]"
          >
            <span className="text-slate-400 tracking-[0.18em]">{it.label}</span>
            <Tag tag={it.tag} />
            <Icon trend={it.trend} />
            <span
              className={
                it.trend === "up"
                  ? "text-emerald-200"
                  : it.trend === "down"
                  ? "text-rose-200"
                  : "text-amber-200"
              }
            >
              {it.value}
            </span>
            <span className="text-slate-700">·</span>
          </div>
        ))}
      </motion.div>
    </div>
  );
}
