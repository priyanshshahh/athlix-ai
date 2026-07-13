export type PlayerProfile = {
  slug: string;
  name: string;
  team: string;
  teamAbbr: string;
  jersey: string;
  position: string;
  heightFt: string;
  weightLbs: number;
  ageYears: number;
  yearsPro: number;
  estContractValueUsd: number;
  baseSalaryUsd: number;
  guaranteedUsd: number;
  endorsementsUsd: number;
  injurySeverity: number;
  contractDurationYrs: number;
  /**
   * Analyst-set scenario assumption (0–100) for off-court/behavioral risk.
   * This is an editorial input to the deterministic simulator, not a
   * measured statistic. The engine reads this attribute — player names are
   * never special-cased.
   */
  behavioralRiskIndex: number;
  riskTier: "STABLE" | "ELEVATED" | "VOLATILE" | "CRITICAL";
  riskColor: "emerald" | "cyan" | "amber" | "rose";
  stabilityScore: number;
  signature: string;
  thesis: string;
  flashFlags: string[];
};

export const PLAYERS: PlayerProfile[] = [
  {
    slug: "zion-williamson",
    name: "Zion Williamson",
    team: "New Orleans Pelicans",
    teamAbbr: "NOP",
    jersey: "#1",
    position: "PF",
    heightFt: "6'6\"",
    weightLbs: 284,
    ageYears: 25,
    yearsPro: 7,
    estContractValueUsd: 197_230_000,
    baseSalaryUsd: 39_446_090,
    guaranteedUsd: 92_500_000,
    endorsementsUsd: 16_400_000,
    injurySeverity: 78,
    contractDurationYrs: 4,
    behavioralRiskIndex: 30,
    riskTier: "CRITICAL",
    riskColor: "rose",
    stabilityScore: 41,
    signature: "ATHLIX::ZW01",
    thesis:
      "Generational physical profile undermined by recurring lower-body load failure. Career arc shows compounding injury frequency and rising body composition variance — wealth velocity now diverging from peer cohort.",
    flashFlags: [
      "Lower-body load fatigue",
      "Conditioning volatility",
      "Guaranteed exposure: HIGH",
    ],
  },
  {
    slug: "ja-morant",
    name: "Ja Morant",
    team: "Memphis Grizzlies",
    teamAbbr: "MEM",
    jersey: "#12",
    position: "PG",
    heightFt: "6'2\"",
    weightLbs: 174,
    ageYears: 26,
    yearsPro: 7,
    estContractValueUsd: 197_230_000,
    baseSalaryUsd: 38_633_500,
    guaranteedUsd: 110_400_000,
    endorsementsUsd: 21_800_000,
    injurySeverity: 54,
    contractDurationYrs: 3,
    behavioralRiskIndex: 74,
    riskTier: "VOLATILE",
    riskColor: "amber",
    stabilityScore: 58,
    signature: "ATHLIX::JM12",
    thesis:
      "High-beta superstar with elite usage rate and elite injury exposure. Behavioral risk premium remains structurally elevated despite reputation rehab. Endorsement floor partially absorbs downside.",
    flashFlags: [
      "Behavioral volatility ELEVATED",
      "Endorsement cliff risk",
      "Recovery trajectory: improving",
    ],
  },
  {
    slug: "ben-simmons",
    name: "Ben Simmons",
    team: "Brooklyn Nets",
    teamAbbr: "BKN",
    jersey: "#10",
    position: "PG",
    heightFt: "6'10\"",
    weightLbs: 240,
    ageYears: 29,
    yearsPro: 9,
    estContractValueUsd: 78_200_000,
    baseSalaryUsd: 40_338_144,
    guaranteedUsd: 0,
    endorsementsUsd: 4_900_000,
    injurySeverity: 86,
    contractDurationYrs: 1,
    behavioralRiskIndex: 40,
    riskTier: "CRITICAL",
    riskColor: "rose",
    stabilityScore: 28,
    signature: "ATHLIX::BS10",
    thesis:
      "Earnings have decoupled from on-court productivity. Back-injury chronicity, contract expiry, and shrinking endorsement footprint converging into terminal earning compression.",
    flashFlags: [
      "Chronic back injury",
      "Contract expiry imminent",
      "Endorsement decay: SEVERE",
    ],
  },
  {
    slug: "lonzo-ball",
    name: "Lonzo Ball",
    team: "Chicago Bulls",
    teamAbbr: "CHI",
    jersey: "#2",
    position: "PG",
    heightFt: "6'6\"",
    weightLbs: 190,
    ageYears: 28,
    yearsPro: 8,
    estContractValueUsd: 80_500_000,
    baseSalaryUsd: 21_400_000,
    guaranteedUsd: 21_400_000,
    endorsementsUsd: 3_100_000,
    injurySeverity: 72,
    contractDurationYrs: 1,
    behavioralRiskIndex: 22,
    riskTier: "VOLATILE",
    riskColor: "amber",
    stabilityScore: 49,
    signature: "ATHLIX::LB02",
    thesis:
      "Long absence from competition has structurally degraded marketability. Re-entry has stabilized risk, but residual cartilage damage caps long-term contract value. Family brand offers limited liquidity cushion.",
    flashFlags: [
      "Cartilage degradation risk",
      "Multi-year absence aftermath",
      "Family brand: hedge",
    ],
  },
  {
    slug: "anthony-davis",
    name: "Anthony Davis",
    team: "Dallas Mavericks",
    teamAbbr: "DAL",
    jersey: "#3",
    position: "PF/C",
    heightFt: "6'10\"",
    weightLbs: 253,
    ageYears: 32,
    yearsPro: 14,
    estContractValueUsd: 186_500_000,
    baseSalaryUsd: 49_300_000,
    guaranteedUsd: 137_000_000,
    endorsementsUsd: 11_200_000,
    injurySeverity: 61,
    contractDurationYrs: 3,
    behavioralRiskIndex: 24,
    riskTier: "VOLATILE",
    riskColor: "amber",
    stabilityScore: 55,
    signature: "ATHLIX::AD03",
    thesis:
      "Elite production when available. Age curve and soft-tissue history forecast accelerating downside. High guaranteed exposure offsets near-term liquidity risk.",
    flashFlags: [
      "Age curve inflection",
      "Soft-tissue recurrence",
      "Liquidity: solid",
    ],
  },
];

export function getPlayerBySlug(slug: string): PlayerProfile | undefined {
  return PLAYERS.find((p) => p.slug === slug);
}

export const SUGGESTED_SLUGS: string[] = [
  "zion-williamson",
  "ja-morant",
  "ben-simmons",
  "lonzo-ball",
];
