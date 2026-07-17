import { describe, it, expect } from "vitest";
import { slugify, clamp, formatCurrency, formatPct } from "@/lib/utils";

describe("slugify", () => {
  it("lowercases and hyphenates names", () => {
    expect(slugify("Stephen Curry")).toBe("stephen-curry");
  });

  it("strips punctuation and apostrophes", () => {
    expect(slugify("De'Aaron Fox")).toBe("deaaron-fox");
  });

  it("collapses repeated whitespace and hyphens", () => {
    expect(slugify("  Karl-Anthony   Towns ")).toBe("karl-anthony-towns");
  });
});

describe("clamp", () => {
  it("bounds below and above", () => {
    expect(clamp(-5, 0, 10)).toBe(0);
    expect(clamp(50, 0, 10)).toBe(10);
    expect(clamp(5, 0, 10)).toBe(5);
  });
});

describe("formatCurrency", () => {
  it("formats compact millions", () => {
    expect(formatCurrency(120_000_000, { compact: true })).toBe("$120M");
  });

  it("formats full dollars without cents", () => {
    expect(formatCurrency(1234).startsWith("$1,234")).toBe(true);
  });
});

describe("formatPct", () => {
  it("formats with one decimal by default", () => {
    expect(formatPct(12.345)).toBe("12.3%");
  });
});
