import Link from "next/link";
import { ArrowUpRight, Database, Hexagon, Sparkles } from "lucide-react";
import { Atmosphere } from "@/components/landing/atmosphere";
import { TopBar } from "@/components/landing/topbar";
import { Ticker } from "@/components/landing/ticker";
import { AthleteSearch } from "@/components/landing/athlete-search";
import { DashboardPreview } from "@/components/landing/dashboard-preview";
import { FeatureGrid } from "@/components/landing/feature-grid";

export default function HomePage() {
  return (
    <div className="relative min-h-screen">
      <Atmosphere />
      <div className="relative z-10">
        <TopBar />
        <Ticker />

        {/* HERO */}
        <section className="relative px-6 pt-16 pb-24 md:pt-24 md:pb-32">
          <div className="mx-auto max-w-7xl text-center">
            <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/[0.05] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.32em] text-cyan-200 shadow-[0_0_24px_-8px_rgba(0,229,255,0.7)]">
              <Sparkles className="h-3 w-3" />
              ATHLIX AI · MVP v0.9.4
              <span className="mx-1 h-3 w-px bg-cyan-400/40" />
              <span className="text-slate-400">Founders Edition</span>
            </div>

            <h1 className="mt-7 mx-auto max-w-5xl text-balance text-4xl font-semibold leading-[1.05] tracking-tight md:text-6xl lg:text-7xl">
              <span className="text-holographic">
                The Financial Intelligence
              </span>
              <br />
              <span className="text-slate-100">Layer For </span>
              <span className="text-holographic">Sports.</span>
            </h1>

            <p className="mt-6 mx-auto max-w-2xl text-base leading-relaxed text-slate-400 md:text-lg">
              AI-powered athlete financial risk forecasting. Predict career
              collapse, injury-linked earning decline, retirement liquidity
              failure, and contract instability — in one
              <span className="text-cyan-200"> cinematic terminal</span>.
            </p>

            <div className="mt-10 flex justify-center">
              <AthleteSearch />
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-xs">
              <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-slate-500">
                Suggested ::
              </span>
              {["Zion Williamson", "Ja Morant", "Ben Simmons", "Lonzo Ball"].map(
                (n) => (
                  <Link
                    key={n}
                    href={`/dashboard/${n.toLowerCase().replace(/\s+/g, "-")}`}
                    className="rounded-md border border-white/10 bg-white/[0.03] px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.22em] text-slate-300 transition hover:border-cyan-400/40 hover:text-cyan-200 hover:bg-cyan-400/[0.05]"
                  >
                    {n}
                  </Link>
                ),
              )}
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 font-mono text-[10px] uppercase tracking-[0.28em] text-slate-500">
              <span className="flex items-center gap-1.5">
                <Database className="h-3 w-3 text-cyan-300" />
                BALLDONTLIE · 540K+ players indexed
              </span>
              <span className="flex items-center gap-1.5">
                <Hexagon className="h-3 w-3 text-violet-300" />
                14 risk vectors · 6 wealth models
              </span>
              <span className="flex items-center gap-1.5">
                <Sparkles className="h-3 w-3 text-amber-300" />
                DeepSeek · OpenRouter · live stream
              </span>
            </div>
          </div>

          <div className="mt-16 md:mt-20">
            <DashboardPreview />
          </div>
        </section>

        {/* FEATURE GRID */}
        <section className="relative px-6 pb-24">
          <div className="mx-auto max-w-7xl">
            <div className="mb-8 flex items-end justify-between gap-4 flex-wrap">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.32em] text-cyan-300/70">
                  ATHLIX::CAPABILITIES
                </div>
                <h2 className="mt-2 max-w-2xl text-2xl font-semibold tracking-tight text-slate-100 md:text-3xl">
                  An institutional-grade <span className="text-holographic">risk OS</span>
                  <br className="hidden md:block" /> for the world&apos;s most
                  expensive athletes.
                </h2>
              </div>
              <Link
                href="/dashboard/zion-williamson"
                className="inline-flex items-center gap-2 rounded-lg border border-cyan-400/30 bg-cyan-400/[0.05] px-4 py-2 font-mono text-[10px] uppercase tracking-[0.22em] text-cyan-200 transition hover:border-cyan-400/60 hover:bg-cyan-400/[0.08]"
              >
                Launch Terminal
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <FeatureGrid />
          </div>
        </section>

        {/* FOOTER */}
        <footer className="relative border-t border-white/5 bg-black/30 px-6 py-8">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 font-mono text-[10px] uppercase tracking-[0.32em] text-slate-500">
            <span>© ATHLIX AI · 2026 · Founders Edition</span>
            <span className="flex items-center gap-2">
              <span className="status-dot" />
              ENGINE ONLINE · 23ms latency · 99.992% uptime
            </span>
            <span>Not financial advice. Simulated intelligence.</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
