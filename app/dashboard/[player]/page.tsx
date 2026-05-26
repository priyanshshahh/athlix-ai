import { Atmosphere } from "@/components/landing/atmosphere";
import { TopBar } from "@/components/landing/topbar";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { PLAYERS, getPlayerBySlug, type PlayerProfile } from "@/data/players";

type Params = { player: string };

export function generateStaticParams() {
  return PLAYERS.map((p) => ({ player: p.slug }));
}

function fallbackPlayer(slug: string): PlayerProfile {
  const display = slug
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
  return {
    slug,
    name: display,
    team: "Free Agent",
    teamAbbr: "FA",
    jersey: "#00",
    position: "—",
    heightFt: "—",
    weightLbs: 0,
    ageYears: 27,
    yearsPro: 6,
    estContractValueUsd: 120_000_000,
    baseSalaryUsd: 28_000_000,
    guaranteedUsd: 64_000_000,
    endorsementsUsd: 6_500_000,
    injurySeverity: 55,
    contractDurationYrs: 3,
    riskTier: "VOLATILE",
    riskColor: "amber",
    stabilityScore: 56,
    signature: `ATHLIX::${slug.slice(0, 4).toUpperCase()}`,
    thesis:
      "Live ATHLIX scan synthesized from indexed cohort. Confidence interval widened — refine with simulator presets to anchor specific risk vectors.",
    flashFlags: ["Synthesized profile", "Awaiting feed sync"],
  };
}

export default async function PlayerDashboardPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { player: slug } = await params;
  const player = getPlayerBySlug(slug) ?? fallbackPlayer(slug);

  return (
    <div className="relative min-h-screen">
      <Atmosphere />
      <div className="relative z-10">
        <TopBar />
        <DashboardShell player={player} />
      </div>
    </div>
  );
}
