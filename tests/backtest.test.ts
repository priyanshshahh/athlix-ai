import { describe, it, expect } from "vitest";
import { runBacktest, runBacktestSweep } from "@/lib/backtest";

describe("backtest — collapse heuristic vs. real careers", () => {
  it("is deterministic", () => {
    expect(runBacktest(30)).toEqual(runBacktest(30));
  });

  it("has a coherent confusion matrix (cells sum to N, positives = tp+fn)", () => {
    const r = runBacktest(30);
    expect(r.n).toBeGreaterThan(0);
    expect(r.tp + r.fp + r.fn + r.tn).toBe(r.n);
    expect(r.tp + r.fn).toBe(r.positives);
  });

  it("keeps precision/recall/f1/accuracy in [0,1]", () => {
    for (const m of [30, 40]) {
      const r = runBacktest(m);
      for (const v of [r.precision, r.recall, r.f1, r.accuracy, r.baseRate]) {
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(1);
      }
    }
  });

  it("carries real signal — precision exceeds the base rate", () => {
    const r = runBacktest(30);
    expect(r.precision).toBeGreaterThan(r.baseRate);
  });

  it("recall is monotonically non-increasing as the threshold rises", () => {
    const sweep = runBacktestSweep([20, 30, 40]);
    expect(sweep[0].recall).toBeGreaterThanOrEqual(sweep[1].recall);
    expect(sweep[1].recall).toBeGreaterThanOrEqual(sweep[2].recall);
  });
});
