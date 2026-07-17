import Link from "next/link";
import { ArrowLeft, Database, Sigma, TriangleAlert } from "lucide-react";
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
