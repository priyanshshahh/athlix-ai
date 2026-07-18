import Link from "next/link";
import { ArrowLeft, FlaskConical, TriangleAlert } from "lucide-react";
import { Atmosphere } from "@/components/landing/atmosphere";
import { TopBar } from "@/components/landing/topbar";
import { runBacktest, runBacktestSweep } from "@/lib/backtest";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Backtest — ATHLIX AI",
  description:
    "Honest backtest of the ATHLIX collapse heuristic against real NBA careers: precision, recall, and the caveats — however unflattering.",
};

const pct = (x: number) => `${(x * 100).toFixed(1)}%`;
const HEADLINE_THRESHOLD = 30;

export default function BacktestPage() {
  const r = runBacktest(HEADLINE_THRESHOLD);
  const sweep = runBacktestSweep([20, 25, 30, 35, 40, 45]);

  return (
    <div className="relative min-h-screen">
      <Atmosphere />
      <div className="relative z-10">
        <TopBar />
        <div className="mx-auto max-w-3xl px-6 py-12">
          <Link
            href="/methodology"
            className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.22em] text-slate-400 hover:text-cyan-200 transition"
          >
            <ArrowLeft className="h-3 w-3" />
            Back to methodology
          </Link>

          <div className="mt-6 flex items-center gap-2">
            <FlaskConical className="h-5 w-5 text-cyan-300" />
            <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-cyan-300/70">
              ATHLIX::BACKTEST
            </span>
          </div>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-100 md:text-4xl">
            Does the collapse heuristic actually work?
          </h1>
          <p className="mt-3 text-slate-400 leading-relaxed">
            The honest test of a hand-tuned heuristic is whether it separates
            real outcomes. We run the engine&rsquo;s collapse signal over{" "}
            <strong className="text-cyan-200">{r.n.toLocaleString()}</strong>{" "}
            historical qualifying player-seasons ({r.source.coverage}) and check
            whether it predicted a real scoring decline in the next{" "}
            {r.params.futureWindow} seasons. The numbers below are reported as
            they fall — flattering or not.
          </p>

          {/* Headline metrics */}
          <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
            <Metric label={`Precision @${HEADLINE_THRESHOLD}`} value={pct(r.precision)} tone="cyan" />
            <Metric label={`Recall @${HEADLINE_THRESHOLD}`} value={pct(r.recall)} tone="amber" />
            <Metric label="F1" value={pct(r.f1)} tone="emerald" />
            <Metric label="Base rate" value={pct(r.baseRate)} tone="rose" />
          </div>

          {/* Confusion matrix */}
          <h2 className="mt-8 font-mono text-[11px] uppercase tracking-[0.28em] text-cyan-300/80">
            Confusion matrix · threshold {HEADLINE_THRESHOLD}
          </h2>
          <div className="mt-3 grid grid-cols-2 gap-2 font-mono text-sm">
            <Cell label="True positives" value={r.tp} good />
            <Cell label="False positives" value={r.fp} />
            <Cell label="False negatives" value={r.fn} />
            <Cell label="True negatives" value={r.tn} good />
          </div>

          {/* Threshold sweep */}
          <h2 className="mt-8 font-mono text-[11px] uppercase tracking-[0.28em] text-cyan-300/80">
            Precision / recall trade-off across thresholds
          </h2>
          <div className="mt-3 overflow-x-auto rounded-lg border border-white/10 bg-black/30">
            <table className="w-full border-collapse font-mono text-[12px]">
              <thead>
                <tr className="text-slate-400">
                  <Th>collapseProb ≥</Th>
                  <Th>Precision</Th>
                  <Th>Recall</Th>
                  <Th>F1</Th>
                </tr>
              </thead>
              <tbody>
                {sweep.map((s) => (
                  <tr
                    key={s.threshold}
                    className={
                      s.threshold === HEADLINE_THRESHOLD
                        ? "bg-cyan-400/[0.06] text-cyan-100"
                        : "text-slate-300"
                    }
                  >
                    <Td>{s.threshold}</Td>
                    <Td>{pct(s.precision)}</Td>
                    <Td>{pct(s.recall)}</Td>
                    <Td>{pct(s.f1)}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-sm text-slate-400 leading-relaxed">
            Precision beats the {pct(r.baseRate)} base rate at every threshold —
            so the signal is <strong className="text-cyan-200">real, not
            noise</strong> (roughly a {(r.precision / r.baseRate).toFixed(1)}×
            lift at threshold {HEADLINE_THRESHOLD}). But it is a modest edge, and
            it does not clearly beat a trivial &ldquo;flag everyone over
            31&rdquo; rule (precision {pct(r.ageOnlyPrecision)}, recall{" "}
            {pct(r.ageOnlyRecall)}). That is the honest ceiling of hand-tuned
            weights fed a games-played injury proxy.
          </p>

          {/* Caveats */}
          <div className="mt-8 rounded-lg border border-amber-400/20 bg-amber-400/[0.04] p-4">
            <div className="flex items-center gap-2">
              <TriangleAlert className="h-4 w-4 text-amber-300" />
              <h2 className="font-mono text-[11px] uppercase tracking-[0.28em] text-amber-200/90">
                What this is and isn&rsquo;t
              </h2>
            </div>
            <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-slate-300">
              <li>
                <strong className="text-slate-100">Injury is proxied</strong>{" "}
                from games played (<code>{r.params.injuryProxy}</code>) because
                the stats snapshot has no injury data. Contract and salary
                inputs are held neutral. So this tests the age + availability
                mechanism, not the full heuristic.
              </li>
              <li>
                <strong className="text-slate-100">
                  &ldquo;Decline&rdquo; is scoring-only:
                </strong>{" "}
                best points over the next {r.params.futureWindow} seasons falling
                below {pct(r.params.declineFraction)} of the current season
                (rotation players only: ≥{r.params.minGp} GP, ≥{r.params.minPts}{" "}
                PPG). It is a proxy for career/earnings collapse, not the thing
                itself.
              </li>
              <li>
                Only seasons through {r.params.lastEligibleStartYear}-
                {(r.params.lastEligibleStartYear + 1) % 100} are scored, so every
                sample has a full {r.params.futureWindow}-season future to
                observe within the snapshot.
              </li>
              <li>
                A truly learned model would fit weights on labeled injury +
                contract + earnings data and report a calibrated interval — this
                backtest is the measurement that would tell you whether that is
                worth doing. On this evidence: the heuristic has real but small
                lift.
              </li>
            </ul>
          </div>

          <div className="mt-6 font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">
            Source:{" "}
            <a
              href={r.source.url}
              className="text-slate-400 underline-offset-2 hover:text-cyan-200 hover:underline"
            >
              {r.source.label}
            </a>{" "}
            · snapshot {r.source.snapshotDate} · static, not live
          </div>
        </div>
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "cyan" | "amber" | "emerald" | "rose";
}) {
  const toneCls = {
    cyan: "text-cyan-200 border-cyan-400/30",
    amber: "text-amber-200 border-amber-400/30",
    emerald: "text-emerald-200 border-emerald-400/30",
    rose: "text-rose-200 border-rose-400/30",
  }[tone];
  return (
    <div className={`rounded-lg border bg-white/[0.03] p-3 ${toneCls}`}>
      <div className="font-mono text-[9px] uppercase tracking-[0.22em] text-slate-500">
        {label}
      </div>
      <div className="mt-1 font-mono text-2xl tabular-nums">{value}</div>
    </div>
  );
}

function Cell({
  label,
  value,
  good = false,
}: {
  label: string;
  value: number;
  good?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border p-3 ${
        good
          ? "border-emerald-400/25 bg-emerald-400/[0.04]"
          : "border-rose-400/25 bg-rose-400/[0.04]"
      }`}
    >
      <div className="text-[9px] uppercase tracking-[0.22em] text-slate-500">
        {label}
      </div>
      <div className="mt-1 tabular-nums text-slate-100">
        {value.toLocaleString()}
      </div>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="border-b border-white/10 px-4 py-2 text-left font-normal uppercase tracking-[0.18em]">
      {children}
    </th>
  );
}

function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-4 py-2 tabular-nums">{children}</td>;
}
