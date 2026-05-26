import { clamp } from "./utils";
import { getPlayerBySlug, type PlayerProfile } from "@/data/players";

export type RiskDial = {
  label: string;
  value: number;
  delta: number;
  tier: "STABLE" | "ELEVATED" | "VOLATILE" | "CRITICAL";
};

export type WealthPoint = {
  age: number;
  baseline: number;
  projected: number;
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

const tierFromScore = (score: number): RiskDial["tier"] => {
  if (score < 35) return "CRITICAL";
  if (score < 55) return "VOLATILE";
  if (score < 75) return "ELEVATED";
  return "STABLE";
};

/**
 * Deterministic mock intelligence engine.
 * Inputs map to a believable wealth trajectory and risk profile.
 */
export function simulate(
  playerSlug: string,
  inputs: SimulatorInputs,
): SimulationOutput {
  const player =
    getPlayerBySlug(playerSlug) ??
    ({
      ...({} as PlayerProfile),
      slug: playerSlug,
      name: playerSlug,
      stabilityScore: 60,
      injurySeverity: 50,
      ageYears: inputs.age,
      contractDurationYrs: inputs.contractDurationYrs,
      baseSalaryUsd: 25_000_000,
      endorsementsUsd: 4_000_000,
      guaranteedUsd: 60_000_000,
      estContractValueUsd: 120_000_000,
      flashFlags: [],
      thesis: "",
    } as PlayerProfile);

  const baseAge = inputs.age;
  const inj = inputs.injurySeverity / 100;
  const dur = inputs.contractDurationYrs;
  const sal = inputs.salaryExposure / 100;

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

    career.push({
      age: a,
      baseline: Math.round(cumulativeBaseline),
      projected: Math.round(cumulative),
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

  // Dials
  const dials: RiskDial[] = [
    {
      label: "Career Stability",
      value: stabilityScore,
      delta: stabilityScore - (player.stabilityScore ?? 60),
      tier: tierFromScore(stabilityScore),
    },
    {
      label: "Injury Risk",
      value: Math.round(clamp(inj * 100 + (baseAge - 25) * 1.3, 4, 98)),
      delta: Math.round((inj * 100 - (player.injurySeverity ?? 50)) * 0.5),
      tier: tierFromScore(
        100 - clamp(inj * 100 + (baseAge - 25) * 1.3, 4, 98),
      ),
    },
    {
      label: "Behavioral Volatility",
      value: Math.round(
        clamp(
          (player.name?.toLowerCase().includes("morant") ? 78 : 32) +
            sal * 14 -
            (stabilityScore - 60) * 0.4,
          5,
          96,
        ),
      ),
      delta: Math.round(sal * 8 - 4),
      tier:
        player.name?.toLowerCase().includes("morant")
          ? "VOLATILE"
          : tierFromScore(stabilityScore + 8),
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
      exposure: Math.round(
        clamp(
          (player.name?.toLowerCase().includes("morant") ? 72 : 28) + sal * 12,
          6,
          92,
        ),
      ),
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

  // Insights
  const insights: string[] = [];
  if (stabilityScore < 35) {
    insights.push(
      `Career stability rated CRITICAL (${stabilityScore}/100). Compounded injury frequency forecast accelerating wealth decay.`,
    );
  } else if (stabilityScore < 55) {
    insights.push(
      `Stability profile VOLATILE (${stabilityScore}/100). High-beta wealth trajectory with bifurcated outcomes.`,
    );
  } else if (stabilityScore < 75) {
    insights.push(
      `Stability profile ELEVATED (${stabilityScore}/100). Manageable downside but structural inflection points present.`,
    );
  } else {
    insights.push(
      `Stability profile STABLE (${stabilityScore}/100). Wealth trajectory tracks cohort top quartile.`,
    );
  }

  if (inj > 0.65) {
    insights.push(
      `Injury severity at ${Math.round(inj * 100)}% — soft-tissue and lower-body load profile diverging from cohort norms.`,
    );
  }
  if (dur < 2) {
    insights.push(
      `Contract horizon ${dur}yr — re-signing probability degraded, endorsement floor likely to recalibrate downward.`,
    );
  }
  if (baseAge > 30) {
    insights.push(
      `Age curve past inflection at ${baseAge}yr — terminal earnings probability rapidly compressing.`,
    );
  }
  insights.push(
    `Peer cohort percentile: ${cohortPercentile}th. Terminal net worth projection ${(terminalNetWorth / 1_000_000).toFixed(1)}M.`,
  );

  // Flash flags
  const flashFlags = [...(player.flashFlags ?? [])];
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

export function defaultInputsFor(playerSlug: string): SimulatorInputs {
  const p = getPlayerBySlug(playerSlug);
  return {
    age: p?.ageYears ?? 26,
    injurySeverity: p?.injurySeverity ?? 50,
    contractDurationYrs: p?.contractDurationYrs ?? 3,
    salaryExposure: Math.min(
      95,
      Math.round(
        ((p?.baseSalaryUsd ?? 25_000_000) /
          (p?.estContractValueUsd ?? 120_000_000)) *
          100 *
          4,
      ),
    ),
  };
}
