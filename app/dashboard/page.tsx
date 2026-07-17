import Link from "next/link";
import { ArrowRight, Hexagon } from "lucide-react";
import { Atmosphere } from "@/components/landing/atmosphere";
import { TopBar } from "@/components/landing/topbar";
import { PLAYERS } from "@/data/players";
import { formatCurrency } from "@/lib/utils";

export default function DashboardIndex() {
  return (
    <div className="relative min-h-screen">
      <Atmosphere />
      <div className="relative z-10">
        <TopBar />

        <div className="mx-auto max-w-7xl px-6 py-12">
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.32em] text-cyan-300/70">
                ATHLIX::COHORT
              </div>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-100 md:text-4xl">
                Active <span className="text-holographic">Risk Surface</span>
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-400">
                Curated analyst profiles used as scenario presets. Click any
                signature to enter the dedicated risk terminal.
              </p>
            </div>
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.22em] text-slate-300 hover:border-cyan-400/30 hover:text-cyan-200"
            >
              <Hexagon className="h-3 w-3" />
              Back to landing
            </Link>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {PLAYERS.map((p) => (
              <Link
                key={p.slug}
                href={`/dashboard/${p.slug}`}
                className="group glass-card relative overflow-hidden p-5 transition hover:[transform:translateY(-2px)]"
              >
                <div className="pointer-events-none absolute -inset-px rounded-[18px] opacity-0 transition group-hover:opacity-100"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(0,229,255,0.18), rgba(168,85,247,0.18))",
                    filter: "blur(20px)",
                  }}
                />
                <div className="relative">
                  <div className="flex items-center justify-between">
                    <span className="rounded-md border border-cyan-400/30 bg-cyan-400/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.22em] text-cyan-200">
                      {p.teamAbbr} · {p.position}
                    </span>
                    <RiskBadge tier={p.riskTier} />
                  </div>
                  <h2 className="mt-3 text-xl font-semibold text-slate-100">
                    {p.name}
                  </h2>
                  <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-slate-500">
                    {p.team}
                  </div>
                  <p className="mt-3 line-clamp-3 text-sm text-slate-400">
                    {p.thesis}
                  </p>

                  <div className="mt-4 grid grid-cols-3 gap-2 font-mono text-[10px]">
                    <Mini label="STAB" value={`${p.stabilityScore}`} tone={p.riskColor} />
                    <Mini label="INJ" value={`${p.injurySeverity}`} tone="rose" />
                    <Mini label="$NW" value={formatCurrency(p.estContractValueUsd, { compact: true })} tone="amber" />
                  </div>

                  <div className="mt-4 flex items-center justify-end font-mono text-[10px] uppercase tracking-[0.22em] text-cyan-300 group-hover:text-cyan-100">
                    Enter terminal
                    <ArrowRight className="ml-1.5 h-3 w-3 transition group-hover:translate-x-0.5" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function RiskBadge({ tier }: { tier: string }) {
  const cls =
    tier === "CRITICAL"
      ? "border-rose-400/40 bg-rose-400/10 text-rose-200"
      : tier === "VOLATILE"
      ? "border-amber-400/40 bg-amber-400/10 text-amber-200"
      : tier === "ELEVATED"
      ? "border-cyan-400/40 bg-cyan-400/10 text-cyan-200"
      : "border-emerald-400/40 bg-emerald-400/10 text-emerald-200";
  return (
    <span
      className={`rounded-md border px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.22em] ${cls}`}
    >
      {tier}
    </span>
  );
}

function Mini({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "cyan" | "emerald" | "amber" | "rose";
}) {
  const toneCls = {
    cyan: "text-cyan-200",
    emerald: "text-emerald-200",
    amber: "text-amber-200",
    rose: "text-rose-200",
  }[tone];
  return (
    <div className="rounded-md border border-white/10 bg-white/[0.03] px-2 py-1.5">
      <div className="text-[9px] uppercase tracking-[0.22em] text-slate-500">
        {label}
      </div>
      <div className={`tabular-nums ${toneCls}`}>{value}</div>
    </div>
  );
}
