import { clamp } from "./utils";
import { tierFromScore, type RiskTier } from "./risk-tiers";

export type { RiskTier } from "./risk-tiers";

/**
 * Deterministic scenario simulator.
 *
 * This is NOT a predictive ML model and does not forecast real outcomes.
 * It maps four user-controlled inputs (age, injury severity, contract
 * duration, salary exposure) plus a handful of profile attributes through
 * fixed, documented formulas to produce an internally-consistent risk
 * readout. Same inputs always produce the same outputs. See /methodology
 * and README for the exact formula weights and their limitations.
 */

export type RiskDial = {
  label: string;
  value: number;
  delta: number;
  tier: RiskTier;
};

export type WealthPoint = {
  age: number;
  baseline: number;
  projected: number;
  /** Lower edge of the projection band (see spread heuristic in simulate()). */
  projectedLow: number;
  /** Upper edge of the projection band. */
  projectedHigh: number;
  collapse: number;
  retirement: number;
};

export type RiskBucket = {
  category: string;
  exposure: number;
  baseline: number;
};

export type SimulatorInputs = {
  age: number;
  injurySeverity: number;
  contractDurationYrs: number;
  salaryExposure: number;
};

/**
 * The attributes the simulator reads from a player profile. For curated
 * profiles these are hand-set analyst assumptions; for live-searched players
 * they fall back to documented defaults the user can adjust via sliders.
 */
export type ScenarioProfile = {
  name: string;
  stabilityScore: number;
  injurySeverity: number;
  baseSalaryUsd: number;
  endorsementsUsd: number;
  estContractValueUsd: number;
  ageYears: number;
  contractDurationYrs: number;
  /**
   * 0–100 scenario assumption for off-court/behavioral risk. Set per curated
   * profile (documented in data/players.ts); defaults to the cohort-neutral
   * 32 for everyone else. Derived from the profile attribute — never from
   * the player's name.
   */
  behavioralRiskIndex: number;
  flashFlags: string[];
};

export const DEFAULT_SCENARIO_PROFILE: ScenarioProfile = {
  name: "Unknown Player",
  stabilityScore: 60,
  injurySeverity: 50,
  baseSalaryUsd: 25_000_000,
  endorsementsUsd: 4_000_000,
  estContractValueUsd: 120_000_000,
  ageYears: 26,
  contractDurationYrs: 3,
  behavioralRiskIndex: 32,
  flashFlags: [],
};

export type SimulationOutput = {
  stabilityScore: number;
  collapseProb: number;
  retirementCliffYr: number;
  peakNetWorth: number;
  terminalNetWorth: number;
  wealthCurve: WealthPoint[];
  dials: RiskDial[];
  buckets: RiskBucket[];
  insights: string[];
  flashFlags: string[];
  cohortPercentile: number;
};

export function simulate(
  profile: Partial<ScenarioProfile>,
  inputs: SimulatorInputs,
): SimulationOutput {
  const player: ScenarioProfile = { ...DEFAULT_SCENARIO_PROFILE, ...profile };

  const baseAge = inputs.age;
  const inj = inputs.injurySeverity / 100;
  const dur = inputs.contractDurationYrs;
  const sal = inputs.salaryExposure / 100;
  const bri = clamp(player.behavioralRiskIndex, 0, 100);

  // Composite stability score (0-100, higher = more stable)
  const ageFactor = 1 - clamp((baseAge - 22) / 18, 0, 1) * 0.55;
  const injuryFactor = 1 - inj * 0.78;
  const contractFactor = clamp(dur / 5, 0.25, 1);
  const exposureFactor = 1 - sal * 0.42;

  const rawScore =
    100 *
    (ageFactor * 0.30 +
      injuryFactor * 0.36 +
      contractFactor * 0.18 +
      exposureFactor * 0.16);

  const stabilityScore = Math.round(clamp(rawScore, 6, 96));
  const collapseProb = clamp(
    100 - stabilityScore + inj * 25 + (baseAge > 31 ? 10 : 0),
    4,
    97,
  );

  // Wealth curves: baseline (peer cohort), projected (player), collapse scenario
  const startAge = Math.max(20, baseAge - 4);
  const endAge = Math.min(50, baseAge + 18);
  const peakBase = player.baseSalaryUsd + player.endorsementsUsd;
  const peakAge = clamp(baseAge + 3 - inj * 3, 24, 31);
  const career: WealthPoint[] = [];

  let cumulative = 0;
  let cumulativeBaseline = 0;
  let cumulativeCollapse = 0;
  let peakEarnings = 0;

  for (let a = startAge; a <= endAge; a++) {
    // Baseline: idealized cohort
    const bGauss = Math.exp(-Math.pow((a - 27) / 6.5, 2));
    const baselineEarnings = peakBase * (0.35 + 1.05 * bGauss);
    cumulativeBaseline += baselineEarnings * 0.78;

    // Projected: player-specific with injury+age decay
    const pGauss = Math.exp(-Math.pow((a - peakAge) / (5.5 - inj * 1.6), 2));
    const decay = a > peakAge ? Math.pow(1 - inj * 0.12, a - peakAge) : 1;
    const projectedEarnings =
      peakBase * (0.32 + 1.0 * pGauss) * decay * (1 - sal * 0.12);
    cumulative += projectedEarnings * 0.74;
    if (projectedEarnings > peakEarnings) peakEarnings = projectedEarnings;

    // Collapse scenario: high-injury, contract non-renewal
    const cDecay = a > peakAge - 1 ? Math.pow(0.78 + inj * 0.05, a - (peakAge - 1)) : 1;
    const collapseEarnings = peakBase * (0.28 + 0.85 * pGauss) * cDecay * 0.62;
    cumulativeCollapse += collapseEarnings * 0.66;

    // Retirement liquidity (post-career income from endorsements + investments)
    const retireMod = a > 32 ? clamp((a - 32) / 14, 0, 1) : 0;
    const retirementIncome =
      cumulative * 0.05 * (1 - retireMod * (0.6 + inj * 0.25));

    // Projection band: a documented ±spread around the projected path. The
    // half-width widens with (a) simulated injury severity and (b) how far
    // out the horizon is — the standard "fan chart" intuition that near-term
    // points are tighter than long-range ones. This is a PRESENTATION spread
    // over the deterministic path, not a fitted confidence interval. Method
    // is documented on /methodology.
    const horizonFrac = (a - startAge) / Math.max(1, endAge - startAge);
    const spreadFrac = clamp(0.06 + inj * 0.3 + horizonFrac * 0.22, 0.06, 0.55);

    career.push({
      age: a,
      baseline: Math.round(cumulativeBaseline),
      projected: Math.round(cumulative),
      projectedLow: Math.round(cumulative * (1 - spreadFrac)),
      projectedHigh: Math.round(cumulative * (1 + spreadFrac)),
      collapse: Math.round(cumulativeCollapse),
      retirement: Math.round(retirementIncome),
    });
  }

  // Peak cumulative net worth across the projected career.
  const peakNetWorth = Math.max(
    peakEarnings,
    career.reduce((m, p) => Math.max(m, p.projected), 0),
  );
  const terminalNetWorth = career[career.length - 1].projected;
  const retirementCliffYr =
    career.find((p, i) => i > 4 && p.retirement < career[i - 1].retirement * 0.55)
      ?.age ?? 41;

  const cohortPercentile = clamp(
    Math.round(
      (terminalNetWorth /
        career[career.length - 1].baseline) *
        72,
    ),
    6,
    98,
  );

  const behavioralValue = Math.round(
    clamp(bri + sal * 14 - (stabilityScore - 60) * 0.4, 5, 96),
  );

  // Dials
  const dials: RiskDial[] = [
    {
      label: "Career Stability",
      value: stabilityScore,
      delta: stabilityScore - player.stabilityScore,
      tier: tierFromScore(stabilityScore),
    },
    {
      label: "Injury Risk",
      value: Math.round(clamp(inj * 100 + (baseAge - 25) * 1.3, 4, 98)),
      delta: Math.round((inj * 100 - player.injurySeverity) * 0.5),
      tier: tierFromScore(
        100 - clamp(inj * 100 + (baseAge - 25) * 1.3, 4, 98),
      ),
    },
    {
      label: "Behavioral Volatility",
      value: behavioralValue,
      delta: Math.round(sal * 8 - 4),
      tier: bri >= 65 ? "VOLATILE" : tierFromScore(stabilityScore + 8),
    },
    {
      label: "Earning Compression",
      value: Math.round(
        clamp(
          (100 - stabilityScore) * 0.7 + (baseAge > 30 ? 18 : 4),
          5,
          95,
        ),
      ),
      delta: Math.round((100 - stabilityScore - 40) * 0.4),
      tier: tierFromScore(stabilityScore - 5),
    },
    {
      label: "Retirement Collapse",
      value: Math.round(
        clamp(
          collapseProb * 0.78 + (dur < 2 ? 14 : 0),
          5,
          96,
        ),
      ),
      delta: Math.round(collapseProb * 0.1 - 5),
      tier: tierFromScore(100 - collapseProb),
    },
  ];

  // Buckets
  const buckets: RiskBucket[] = [
    {
      category: "Lower-body load",
      exposure: Math.round(clamp(inj * 95 + 5, 8, 98)),
      baseline: 38,
    },
    {
      category: "Contract instability",
      exposure: Math.round(clamp(100 - dur * 18 + sal * 22, 6, 96)),
      baseline: 35,
    },
    {
      category: "Endorsement decay",
      exposure: Math.round(clamp(60 - stabilityScore * 0.4 + sal * 14, 8, 92)),
      baseline: 32,
    },
    {
      category: "Behavioral exposure",
      exposure: Math.round(clamp(bri * 0.95 + sal * 12, 6, 92)),
      baseline: 30,
    },
    {
      category: "Retirement liquidity",
      exposure: Math.round(clamp(95 - stabilityScore * 0.9, 8, 96)),
      baseline: 40,
    },
    {
      category: "Body composition",
      exposure: Math.round(clamp(inj * 80 + (baseAge - 24) * 2, 8, 95)),
      baseline: 30,
    },
  ];

  // Insights — tier band comes from the single shared threshold table so the
  // prose can never disagree with the dials/colours.
  const insights: string[] = [];
  const stabilityTier = tierFromScore(stabilityScore);
  const insightByTier: Record<RiskTier, string> = {
    CRITICAL: `Career stability rated CRITICAL (${stabilityScore}/100) under current scenario inputs. Simulated injury load accelerates wealth decay.`,
    VOLATILE: `Stability profile VOLATILE (${stabilityScore}/100). Scenario yields a high-beta wealth trajectory with bifurcated outcomes.`,
    ELEVATED: `Stability profile ELEVATED (${stabilityScore}/100). Manageable downside but structural inflection points present in this scenario.`,
    STABLE: `Stability profile STABLE (${stabilityScore}/100). Simulated wealth trajectory tracks cohort top quartile.`,
  };
  insights.push(insightByTier[stabilityTier]);

  if (inj > 0.65) {
    insights.push(
      `Injury severity input at ${Math.round(inj * 100)}% — simulated earnings curve diverges sharply from the synthetic cohort baseline.`,
    );
  }
  if (dur < 2) {
    insights.push(
      `Contract horizon ${dur}yr — simulator degrades re-signing assumptions and lowers the endorsement floor.`,
    );
  }
  if (baseAge > 30) {
    insights.push(
      `Age input past the model's inflection at ${baseAge}yr — terminal earnings compress under the fixed decay curve.`,
    );
  }
  insights.push(
    `Synthetic cohort percentile: ${cohortPercentile}th. Simulated terminal net worth ${(terminalNetWorth / 1_000_000).toFixed(1)}M.`,
  );

  // Flash flags
  const flashFlags = [...player.flashFlags];
  if (inj > 0.75) flashFlags.push("Acute injury exposure");
  if (sal > 0.7) flashFlags.push("Salary cap risk");
  if (dur < 2) flashFlags.push("Contract expiry imminent");

  return {
    stabilityScore,
    collapseProb,
    retirementCliffYr,
    peakNetWorth,
    terminalNetWorth,
    wealthCurve: career,
    dials,
    buckets,
    insights,
    flashFlags: Array.from(new Set(flashFlags)),
    cohortPercentile,
  };
}

export function defaultInputsFor(
  profile: Partial<ScenarioProfile>,
): SimulatorInputs {
  const p: ScenarioProfile = { ...DEFAULT_SCENARIO_PROFILE, ...profile };
  return {
    age: p.ageYears,
    injurySeverity: p.injurySeverity,
    contractDurationYrs: p.contractDurationYrs,
    salaryExposure: Math.min(
      95,
      Math.round((p.baseSalaryUsd / p.estContractValueUsd) * 100 * 4),
    ),
  };
}

/**
 * The DYNAMIC tier a profile resolves to under its default slider inputs —
 * i.e. exactly what the player's terminal shows on first load. Landing,
 * cohort index and search all use this instead of the stored `riskTier`, so
 * a player never displays two different tiers across the app. See
 * lib/risk-tiers.ts for the static-vs-dynamic contract.
 */
export function defaultTierForProfile(
  profile: Partial<ScenarioProfile>,
): RiskTier {
  return tierFromScore(simulate(profile, defaultInputsFor(profile)).stabilityScore);
}
