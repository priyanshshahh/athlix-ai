/**
 * Single source of truth for the 4-way risk-tier system.
 *
 * A tier is derived from a 0–100 stability-style score (higher = safer) via
 * fixed thresholds. Every place in the app that renders a tier label or a
 * tier colour imports from here — there is exactly one threshold table and
 * one colour map, so changing a cutoff or a swatch is a one-line edit rather
 * than a six-file hunt.
 *
 * STATIC vs. DYNAMIC resolution (deliberate):
 *   data/players.ts carries a hand-set `riskTier` per curated profile. That
 *   field is a *fallback label only*. Wherever the deterministic simulator
 *   has run, the DYNAMIC tier — `tierFromScore(sim.stabilityScore)` on the
 *   engine's live output — WINS. `defaultTierForProfile()` recomputes the
 *   default-input tier so the landing preview, cohort index and search list
 *   show the same tier the player's terminal shows on load. The curated
 *   `riskTier` is never trusted over a live computation.
 */

export type RiskTier = "STABLE" | "ELEVATED" | "VOLATILE" | "CRITICAL";

/**
 * Ascending score cutoffs. `tierFromScore` returns the first tier whose
 * `max` the score falls under. Canonical thresholds: <35 CRITICAL,
 * <55 VOLATILE, <75 ELEVATED, else STABLE.
 */
export const TIER_THRESHOLDS: ReadonlyArray<{ max: number; tier: RiskTier }> = [
  { max: 35, tier: "CRITICAL" },
  { max: 55, tier: "VOLATILE" },
  { max: 75, tier: "ELEVATED" },
  { max: Infinity, tier: "STABLE" },
];

export function tierFromScore(score: number): RiskTier {
  for (const { max, tier } of TIER_THRESHOLDS) {
    if (score < max) return tier;
  }
  return "STABLE";
}

export type TierStyle = {
  /** Base colour token used by ad-hoc tone props elsewhere. */
  tone: "emerald" | "cyan" | "amber" | "rose";
  /** Solid hex — SVG strokes / inline styles. */
  hex: string;
  /** rgba glow for box-shadows. */
  glow: string;
  /** Neon text utility (falls back to a plain text-* class where no neon exists). */
  text: string;
  /** Plain tailwind text-*-200. */
  textSoft: string;
  /** border-*-400/40. */
  border: string;
  /** from-* to-* gradient for progress bars. */
  bar: string;
  /** Combined pill classes: text + border + translucent bg. */
  pill: string;
};

export const TIER_STYLE: Record<RiskTier, TierStyle> = {
  STABLE: {
    tone: "emerald",
    hex: "#34d399",
    glow: "rgba(52,211,153,0.55)",
    text: "neon-text-emerald",
    textSoft: "text-emerald-200",
    border: "border-emerald-400/40",
    bar: "from-emerald-400 to-teal-400",
    pill: "text-emerald-200 border-emerald-400/40 bg-emerald-400/10",
  },
  ELEVATED: {
    tone: "cyan",
    hex: "#22d3ee",
    glow: "rgba(0,229,255,0.55)",
    text: "neon-text-cyan",
    textSoft: "text-cyan-200",
    border: "border-cyan-400/40",
    bar: "from-cyan-400 to-sky-400",
    pill: "text-cyan-200 border-cyan-400/40 bg-cyan-400/10",
  },
  VOLATILE: {
    tone: "amber",
    hex: "#fbbf24",
    glow: "rgba(251,191,36,0.55)",
    // No neon-text-amber utility exists; the plain class is the intended look.
    text: "text-amber-200",
    textSoft: "text-amber-200",
    border: "border-amber-400/40",
    bar: "from-amber-400 to-orange-400",
    pill: "text-amber-200 border-amber-400/40 bg-amber-400/10",
  },
  CRITICAL: {
    tone: "rose",
    hex: "#fb7185",
    glow: "rgba(251,113,133,0.65)",
    text: "neon-text-rose",
    textSoft: "text-rose-200",
    border: "border-rose-400/40",
    bar: "from-rose-400 to-red-500",
    pill: "text-rose-200 border-rose-400/40 bg-rose-400/10",
  },
};

export function tierStyle(tier: RiskTier): TierStyle {
  return TIER_STYLE[tier];
}
