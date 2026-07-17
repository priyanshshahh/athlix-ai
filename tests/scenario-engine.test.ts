import { describe, it, expect } from "vitest";
import {
  simulate,
  defaultInputsFor,
  DEFAULT_SCENARIO_PROFILE,
  type SimulatorInputs,
} from "@/lib/scenario-engine";

const inputs: SimulatorInputs = {
  age: 26,
  injurySeverity: 60,
  contractDurationYrs: 3,
  salaryExposure: 40,
};

describe("simulate — determinism", () => {
  it("produces identical output for identical inputs", () => {
    const a = simulate(DEFAULT_SCENARIO_PROFILE, inputs);
    const b = simulate(DEFAULT_SCENARIO_PROFILE, inputs);
    expect(a).toEqual(b);
  });

  it("keeps the stability score inside its documented bounds", () => {
    for (const inj of [0, 25, 50, 75, 100]) {
      const out = simulate(DEFAULT_SCENARIO_PROFILE, { ...inputs, injurySeverity: inj });
      expect(out.stabilityScore).toBeGreaterThanOrEqual(6);
      expect(out.stabilityScore).toBeLessThanOrEqual(96);
      expect(out.collapseProb).toBeGreaterThanOrEqual(4);
      expect(out.collapseProb).toBeLessThanOrEqual(97);
    }
  });
});

describe("simulate — never special-cases player names", () => {
  it("gives byte-identical output for two profiles that differ only by name", () => {
    const base = { ...DEFAULT_SCENARIO_PROFILE };
    const morant = simulate({ ...base, name: "Ja Morant" }, inputs);
    const nobody = simulate({ ...base, name: "Zzz Nobody" }, inputs);
    // name is not read by the engine — strip it and compare everything else
    const { ...morantRest } = morant;
    const { ...nobodyRest } = nobody;
    expect(morantRest).toEqual(nobodyRest);
  });

  it("responds to attributes, not identity (higher injury lowers stability)", () => {
    const healthy = simulate(DEFAULT_SCENARIO_PROFILE, { ...inputs, injurySeverity: 10 });
    const hurt = simulate(DEFAULT_SCENARIO_PROFILE, { ...inputs, injurySeverity: 90 });
    expect(hurt.stabilityScore).toBeLessThan(healthy.stabilityScore);
    expect(hurt.collapseProb).toBeGreaterThan(healthy.collapseProb);
  });
});

describe("simulate — structure", () => {
  it("returns five dials and six exposure buckets", () => {
    const out = simulate(DEFAULT_SCENARIO_PROFILE, inputs);
    expect(out.dials).toHaveLength(5);
    expect(out.buckets).toHaveLength(6);
    expect(out.wealthCurve.length).toBeGreaterThan(0);
  });
});

describe("defaultInputsFor", () => {
  it("derives inputs from a profile's attributes", () => {
    const d = defaultInputsFor(DEFAULT_SCENARIO_PROFILE);
    expect(d.age).toBe(DEFAULT_SCENARIO_PROFILE.ageYears);
    expect(d.injurySeverity).toBe(DEFAULT_SCENARIO_PROFILE.injurySeverity);
    expect(d.salaryExposure).toBeLessThanOrEqual(95);
  });
});
