import { describe, it, expect } from "vitest";
import {
  simulate,
  defaultInputsFor,
  DEFAULT_SCENARIO_PROFILE,
  type SimulatorInputs,
} from "@/lib/scenario-engine";
import { getPlayerBySlug } from "@/data/players";

/**
 * Characterization tests: these pin the EXACT current output of every dial,
 * bucket, and headline scalar for a few fixed (profile, inputs) fixtures.
 *
 * They are not derived from first principles — they lock in whatever the
 * hand-tuned formulas produce today. Their only job is to fail loudly if any
 * coefficient in lib/scenario-engine.ts drifts by accident (e.g. a 0.78 typo'd
 * to 0.87), which the wide-bounds tests in scenario-engine.test.ts cannot
 * catch. If you change a formula ON PURPOSE, re-run `vitest -u` and eyeball
 * the diff — a large or unexpected change is the signal.
 */

/** Compact, snapshot-friendly view of a full simulation. */
function characterize(
  profile: Parameters<typeof simulate>[0],
  inputs: SimulatorInputs,
) {
  const s = simulate(profile, inputs);
  return {
    stabilityScore: s.stabilityScore,
    collapseProb: Number(s.collapseProb.toFixed(4)),
    cohortPercentile: s.cohortPercentile,
    retirementCliffYr: s.retirementCliffYr,
    peakNetWorth: s.peakNetWorth,
    terminalNetWorth: s.terminalNetWorth,
    wealthCurveLength: s.wealthCurve.length,
    firstWealthPoint: s.wealthCurve[0],
    lastWealthPoint: s.wealthCurve[s.wealthCurve.length - 1],
    dials: s.dials.map((d) => ({ label: d.label, value: d.value, delta: d.delta, tier: d.tier })),
    buckets: s.buckets.map((b) => ({ category: b.category, exposure: b.exposure, baseline: b.baseline })),
  };
}

describe("scenario engine — characterization (locks current formula outputs)", () => {
  it("Zion Williamson at his default inputs", () => {
    const zion = getPlayerBySlug("zion-williamson")!;
    expect(characterize(zion, defaultInputsFor(zion))).toMatchSnapshot();
  });

  it("default profile at mid-range inputs", () => {
    expect(
      characterize(DEFAULT_SCENARIO_PROFILE, {
        age: 26,
        injurySeverity: 60,
        contractDurationYrs: 3,
        salaryExposure: 40,
      }),
    ).toMatchSnapshot();
  });

  it("default profile under a low-risk 'blue chip' scenario", () => {
    expect(
      characterize(DEFAULT_SCENARIO_PROFILE, {
        age: 24,
        injurySeverity: 18,
        contractDurationYrs: 5,
        salaryExposure: 38,
      }),
    ).toMatchSnapshot();
  });
});
