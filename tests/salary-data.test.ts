import { describe, it, expect } from "vitest";
import {
  getSalaryRecord,
  normalizeName,
  SALARY_SOURCE,
} from "@/lib/salary-data";

describe("salary-data — bundled contract snapshot", () => {
  it("normalizes names tolerantly (case, punctuation, suffix, accents)", () => {
    expect(normalizeName("Zion Williamson")).toBe("zion williamson");
    expect(normalizeName("Gary Trent Jr.")).toBe("gary trent");
    expect(normalizeName("Luka Dončić")).toBe("luka doncic");
  });

  it("finds a player present in the snapshot with real cap dollars", () => {
    const rec = getSalaryRecord("Zion Williamson");
    expect(rec).not.toBeNull();
    expect(rec!.currentCapHit).toBeGreaterThan(0);
    expect(rec!.remainingValue).toBeGreaterThanOrEqual(rec!.currentCapHit);
    expect(rec!.contractYears).toBe(rec!.capHits.length);
    // cap hits are the summed remaining value
    expect(rec!.capHits.reduce((s, c) => s + c.amount, 0)).toBe(rec!.remainingValue);
  });

  it("matches regardless of name casing/spacing", () => {
    expect(getSalaryRecord("  zion   williamson ")).not.toBeNull();
  });

  it("returns null for a player not in the snapshot", () => {
    expect(getSalaryRecord("Nobody McFakename")).toBeNull();
    expect(getSalaryRecord("")).toBeNull();
  });

  it("exposes source provenance for in-UI citation", () => {
    expect(SALARY_SOURCE.url).toContain("github.com");
    expect(SALARY_SOURCE.snapshotDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
