"use client";

import { motion } from "framer-motion";
import {
  Brain,
  LineChart,
  ShieldAlert,
  Activity,
  Cpu,
  Gauge,
} from "lucide-react";

const FEATURES = [
  {
    icon: Brain,
    title: "Career Collapse Forecast",
    body: "Multi-vector model surfaces inflection points where wealth velocity is projected to decouple from cohort peers.",
    tag: "ML",
    color: "from-cyan-500/20 to-sky-500/10",
  },
  {
    icon: LineChart,
    title: "Wealth Trajectory Modeling",
    body: "Live Monte-Carlo projections recompute lifetime earnings, retirement liquidity, and terminal net worth under stress.",
    tag: "QUANT",
    color: "from-violet-500/20 to-fuchsia-500/10",
  },
  {
    icon: ShieldAlert,
    title: "Contract Instability Index",
    body: "Quantifies re-signing probability, guarantee exposure, and option-year value erosion in real time.",
    tag: "CTR",
    color: "from-rose-500/20 to-amber-500/10",
  },
  {
    icon: Activity,
    title: "Injury-Linked Earning Decay",
    body: "Soft-tissue, load-failure and behavioral signal fusion forecasts revenue compression with sub-quarter latency.",
    tag: "INJ",
    color: "from-emerald-500/20 to-teal-500/10",
  },
  {
    icon: Cpu,
    title: "ATHLIX Intelligence",
    body: "Conversational quant analyst purpose-built for athlete capital. Ask for thesis, scenario, or peer benchmark — instant answer.",
    tag: "AI",
    color: "from-cyan-500/20 to-violet-500/10",
  },
  {
    icon: Gauge,
    title: "Cohort Benchmark Engine",
    body: "Cross-references each athlete against 1,400+ historical wealth arcs to anchor percentile and outlier risk.",
    tag: "BMRK",
    color: "from-amber-500/20 to-rose-500/10",
  },
];

export function FeatureGrid() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {FEATURES.map((f, i) => {
        const Icon = f.icon;
        return (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ delay: i * 0.07, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="group glass-card relative p-5 overflow-hidden"
          >
            <div
              className={`pointer-events-none absolute -inset-px rounded-[18px] opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-br ${f.color}`}
              style={{ filter: "blur(20px)" }}
            />
            <div className="relative flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-cyan-400/30 bg-cyan-400/10 shadow-[0_0_24px_-6px_rgba(0,229,255,0.5)]">
                <Icon className="h-5 w-5 text-cyan-200" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-medium text-slate-100">
                    {f.title}
                  </h3>
                  <span className="rounded-md border border-white/10 bg-white/[0.04] px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.18em] text-cyan-200/80">
                    {f.tag}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">
                  {f.body}
                </p>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
