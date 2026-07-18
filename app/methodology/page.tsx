import Link from "next/link";
import { ArrowLeft, Database, Sigma, TriangleAlert, GitCompare, Waves } from "lucide-react";
import { Atmosphere } from "@/components/landing/atmosphere";
import { TopBar } from "@/components/landing/topbar";

export const metadata = {
  title: "Methodology — ATHLIX AI",
  description:
    "How the ATHLIX scenario simulator works: the deterministic formulas, their inputs, what is real data, and what is a modeling assumption.",
};

export default function MethodologyPage() {
  return (
    <div className="relative min-h-screen">
      <Atmosphere />
      <div className="relative z-10">
        <TopBar />
        <div className="mx-auto max-w-3xl px-6 py-12">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.22em] text-slate-400 hover:text-cyan-200 transition"
          >
            <ArrowLeft className="h-3 w-3" />
            Back to landing
          </Link>

          <h1 className="mt-6 text-3xl font-semibold tracking-tight text-slate-100 md:text-4xl">
            Methodology
          </h1>
          <p className="mt-3 text-slate-400 leading-relaxed">
            ATHLIX is a <strong className="text-cyan-200">scenario simulator</strong>,
            not a predictive model. It maps a small set of user-controlled
            inputs through fixed, documented formulas to a self-consistent risk
            readout. It does not forecast real-world outcomes and is not
            financial advice.
          </p>

          <Section
            icon={<Database className="h-4 w-4 text-emerald-300" />}
            title="What is real data"
          >
            <ul className="list-disc space-y-1.5 pl-5 text-sm text-slate-300">
              <li>
                Player search, bio (team, position, college, country, draft
                year, physicals) and recent team game results come live from the{" "}
                <a
                  href="https://www.balldontlie.io"
                  className="text-cyan-200 underline-offset-2 hover:underline"
                >
                  BALLDONTLIE
                </a>{" "}
                API, fetched server-side. The API key never reaches the browser.
              </li>
              <li>
                The &ldquo;Live Feed&rdquo; card on a player page is real,
                sourced, and timestamped. If the key is missing or the request
                fails, the card shows an explicit offline state — numbers are
                never invented to fill the gap.
              </li>
            </ul>
          </Section>

          <Section
            icon={<TriangleAlert className="h-4 w-4 text-amber-300" />}
            title="What is a modeling assumption"
          >
            <ul className="list-disc space-y-1.5 pl-5 text-sm text-slate-300">
              <li>
                All dollar figures (salary, guarantees, endorsements, contract
                value) are analyst assumptions for the five curated profiles and
                documented defaults for live-searched players. They are inputs to
                the simulator, not measured ground truth.
              </li>
              <li>
                The cohort baseline is a synthetic Gaussian earnings curve, not a
                real population of players. Percentiles are relative to that
                synthetic curve.
              </li>
              <li>
                The AI analyst (DeepSeek via OpenRouter) generates natural-language
                commentary grounded in the current scenario context. Its prose is
                model output, not a data source.
              </li>
            </ul>
          </Section>

          <Section
            icon={<Sigma className="h-4 w-4 text-cyan-300" />}
            title="The formulas"
          >
            <p className="text-sm text-slate-400">
              Four inputs drive everything: <em>age</em>, <em>injury severity</em>{" "}
              (0–100), <em>contract duration</em> (years), and{" "}
              <em>salary exposure</em> (0–100). Same inputs always produce the
              same outputs (fully deterministic — no randomness).
            </p>
            <div className="mt-3 overflow-x-auto rounded-lg border border-white/10 bg-black/30">
              <pre className="p-4 font-mono text-[11px] leading-relaxed text-slate-300">
{`ageFactor      = 1 - clamp((age - 22) / 18, 0, 1) * 0.55
injuryFactor   = 1 - (injurySeverity / 100) * 0.78
contractFactor = clamp(duration / 5, 0.25, 1)
exposureFactor = 1 - (salaryExposure / 100) * 0.42

stabilityScore = 100 * (ageFactor * 0.30
                      + injuryFactor * 0.36
                      + contractFactor * 0.18
                      + exposureFactor * 0.16)

collapseProb   = 100 - stabilityScore
                      + (injurySeverity/100) * 25
                      + (age > 31 ? 10 : 0)`}
              </pre>
            </div>
            <p className="mt-3 text-sm text-slate-400">
              Wealth curves are Gaussian earnings arcs peaking near age 27 for
              the cohort baseline and near <code>age + 3 - injury·3</code> for the
              player, with an injury/age decay term after the peak. Risk dials and
              exposure buckets are further fixed transforms of the same inputs.
              The exact weights live in{" "}
              <code className="text-cyan-200">lib/scenario-engine.ts</code>.
            </p>
          </Section>

          <Section
            icon={<Waves className="h-4 w-4 text-cyan-300" />}
            title="Projection band (uncertainty)"
          >
            <p className="text-sm text-slate-400 leading-relaxed">
              The wealth chart shades a{" "}
              <strong className="text-cyan-200">±band</strong> around the
              projected path rather than drawing a single line. Credible
              projection tools ship uncertainty, and a bare point estimate is
              misleading — so the band makes the model&rsquo;s spread explicit.
            </p>
            <div className="mt-3 overflow-x-auto rounded-lg border border-white/10 bg-black/30">
              <pre className="p-4 font-mono text-[11px] leading-relaxed text-slate-300">
{`horizonFrac = (age - startAge) / (endAge - startAge)
spreadFrac  = clamp(0.06
                  + (injurySeverity/100) * 0.30
                  + horizonFrac * 0.22, 0.06, 0.55)

projectedLow  = projected * (1 - spreadFrac)
projectedHigh = projected * (1 + spreadFrac)`}
              </pre>
            </div>
            <p className="mt-3 text-sm text-slate-400 leading-relaxed">
              The half-width widens with two things: simulated injury severity
              (more injury → more variance) and how far out the point is (a
              fan chart — near-term is tighter than long-range). This is a{" "}
              <strong className="text-cyan-200">presentation heuristic</strong>{" "}
              over the deterministic path, not a fitted confidence interval
              from a distribution of outcomes. It communicates &ldquo;this is a
              range, not a promise,&rdquo; without claiming a calibration it
              doesn&rsquo;t have.
            </p>
          </Section>

          <Section
            icon={<GitCompare className="h-4 w-4 text-violet-300" />}
            title="Heuristic vs. learned model"
          >
            <p className="text-sm text-slate-400 leading-relaxed">
              ATHLIX is a{" "}
              <strong className="text-cyan-200">hand-weighted heuristic</strong>,
              not a learned model. Being precise about that gap is the honest
              framing — here is what the reference public NBA tools actually do
              and where this simulator sits relative to them.
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-300">
              <li>
                <a
                  href="https://www.darko.app/about"
                  className="text-cyan-200 underline-offset-2 hover:underline"
                >
                  DARKO
                </a>{" "}
                (Daily Plus-Minus) is a genuine forward projection: an
                exponential-decay + Kalman-filter model that treats each game
                as a noisy reading of true skill and blends it by reliability,
                with <em>age curves built in</em>. It <em>learns</em> from
                thousands of player-games.
              </li>
              <li>
                <a
                  href="https://dunksandthrees.com/about/epm"
                  className="text-cyan-200 underline-offset-2 hover:underline"
                >
                  EPM
                </a>{" "}
                (Estimated Plus-Minus) is built on RAPM plus a Bayesian prior
                from a statistical-plus-minus model, using player-tracking
                data. It documents how each input stabilizes and frames itself
                as <em>predictive with known uncertainty</em>.
              </li>
              <li>
                <strong className="text-slate-200">What ATHLIX does:</strong>{" "}
                the weights above (0.30 age, 0.36 injury, 0.18 contract, 0.16
                exposure, and the dial/bucket coefficients) are{" "}
                <em>hand-chosen</em> for internal consistency and legibility,
                not fit to data. They encode a plausible <em>story</em> about
                what erodes athlete wealth — injury dominates, age next — but
                nothing in the app has ever seen a real earnings outcome.
              </li>
              <li>
                <strong className="text-slate-200">
                  What would make it a learned model:
                </strong>{" "}
                a labeled dataset of athlete career + earnings outcomes, a
                train/validate/test split, and fit coefficients replacing the
                hand-chosen ones — with the residuals of the fit giving a{" "}
                <em>real</em> confidence interval in place of the presentation
                band above. A{" "}
                <strong className="text-slate-200">backtest</strong>{" "}
                is the first step toward that: it measures whether the current
                hand-picked weights actually separate real career declines from
                non-declines.
              </li>
            </ul>
          </Section>

          <div className="mt-8 rounded-lg border border-white/10 bg-white/[0.03] p-4 text-xs leading-relaxed text-slate-400">
            Limitations: the weights above are hand-chosen for internal
            consistency and visual demonstration, not fit to historical earnings
            data. Treat every output as a &ldquo;what-if&rdquo; readout of the
            formulas, not a forecast. A genuine predictive model would require a
            labeled dataset of athlete career and earnings outcomes and a proper
            train/validate/test split — out of scope for this build.
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-8">
      <div className="flex items-center gap-2">
        {icon}
        <h2 className="font-mono text-[11px] uppercase tracking-[0.28em] text-cyan-300/80">
          {title}
        </h2>
      </div>
      <div className="mt-3">{children}</div>
    </section>
  );
}
