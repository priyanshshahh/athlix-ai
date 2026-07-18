import { describe, it, expect } from "vitest";
import {
  standardizedDistance,
  similarityFromDistance,
  getLatestSeason,
  findComparables,
} from "@/lib/player-stats";

describe("player-stats — distance function", () => {
  const invStd = [1, 1, 1];

  it("is zero for identical vectors", () => {
    expect(standardizedDistance([1, 2, 3], [1, 2, 3], invStd)).toBe(0);
  });

  it("is symmetric", () => {
    const a = [1, 2, 3];
    const b = [4, 0, 1];
    expect(standardizedDistance(a, b, invStd)).toBeCloseTo(
      standardizedDistance(b, a, invStd),
    );
  });

  it("computes Euclidean magnitude with unit weights", () => {
    // diff (3,4,0) -> 5
    expect(standardizedDistance([0, 0, 0], [3, 4, 0], invStd)).toBeCloseTo(5);
  });

  it("weights features by inverse std", () => {
    // a feature with large std (small invStd) contributes less
    const d1 = standardizedDistance([0], [10], [1]);
    const d2 = standardizedDistance([0], [10], [0.1]);
    expect(d2).toBeLessThan(d1);
    expect(d2).toBeCloseTo(1);
  });

  it("obeys the triangle inequality", () => {
    const a = [0, 0, 0];
    const b = [1, 2, 2];
    const c = [3, 0, 4];
    const ab = standardizedDistance(a, b, invStd);
    const bc = standardizedDistance(b, c, invStd);
    const ac = standardizedDistance(a, c, invStd);
    expect(ac).toBeLessThanOrEqual(ab + bc + 1e-9);
  });
});

describe("player-stats — similarity mapping", () => {
  it("maps distance 0 to 100", () => {
    expect(similarityFromDistance(0)).toBe(100);
  });

  it("decreases monotonically with distance and stays in [0,100]", () => {
    const s1 = similarityFromDistance(1);
    const s2 = similarityFromDistance(5);
    const s3 = similarityFromDistance(50);
    expect(s1).toBeGreaterThan(s2);
    expect(s2).toBeGreaterThan(s3);
    for (const s of [s1, s2, s3]) {
      expect(s).toBeGreaterThanOrEqual(0);
      expect(s).toBeLessThanOrEqual(100);
    }
  });
});

describe("player-stats — comparables over the bundled snapshot", () => {
  it("returns up to 5 distinct comparables, nearest first, excluding self", () => {
    const query = getLatestSeason("Anthony Davis");
    expect(query).not.toBeNull();
    const comps = findComparables(query!, 5);
    expect(comps.length).toBeGreaterThan(0);
    expect(comps.length).toBeLessThanOrEqual(5);

    // sorted ascending by distance / descending similarity
    for (let i = 1; i < comps.length; i++) {
      expect(comps[i].distance).toBeGreaterThanOrEqual(comps[i - 1].distance);
      expect(comps[i].similarity).toBeLessThanOrEqual(comps[i - 1].similarity);
    }
    // no self, all distinct players
    const names = comps.map((c) => c.player.toLowerCase());
    expect(names).not.toContain("anthony davis");
    expect(new Set(names).size).toBe(names.length);
  });

  it("returns nothing for a player absent from the snapshot", () => {
    expect(getLatestSeason("Nobody McFakename")).toBeNull();
  });
});
