import { Atmosphere } from "@/components/landing/atmosphere";
import { TopBar } from "@/components/landing/topbar";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { getPlayerBySlug, type PlayerProfile } from "@/data/players";
import { getLiveStats, type LiveStats } from "@/lib/live-stats";
import { currentSeason } from "@/lib/balldontlie";
import { getSalaryRecord, SALARY_SOURCE, type SalaryRecord } from "@/lib/salary-data";

type Params = { player: string };
type SearchParams = { [key: string]: string | string[] | undefined };

export const dynamic = "force-dynamic";

function displayNameFromSlug(slug: string): string {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatHeight(height: string | null): string {
  if (!height) return "—";
  const [ft, inches] = height.split("-");
  if (!ft) return height;
  return `${ft}'${inches ?? 0}"`;
}

/**
 * Profile for players outside the curated set. Bio fields come from the
 * live BALLDONTLIE record when available; financial fields are explicit
 * scenario assumptions (the simulator sliders control them) — they are
 * labeled as such in the UI and never presented as real figures.
 */
function scenarioProfile(
  slug: string,
  live: LiveStats | null,
  salary: SalaryRecord | null,
): PlayerProfile {
  const bio = live?.player;
  const yearsPro = bio?.draftYear
    ? Math.max(0, currentSeason() - bio.draftYear)
    : 6;

  // Seed financial fields from the real cap-sheet snapshot when the player
  // matches; otherwise fall back to documented illustrative defaults. This
  // replaces the old identical $120M/$28M numbers shown for every live player.
  const contractYrs = salary
    ? Math.max(1, Math.min(7, salary.contractYears))
    : 3;

  return {
    slug,
    name: bio?.name ?? displayNameFromSlug(slug),
    team: bio?.team?.fullName ?? salary?.team ?? "Free Agent",
    teamAbbr: bio?.team?.abbreviation ?? salary?.team ?? "FA",
    jersey: bio?.jersey ? `#${bio.jersey}` : "#00",
    position: bio?.position || salary?.position || "—",
    heightFt: formatHeight(bio?.height ?? null),
    weightLbs: bio?.weight ? Number(bio.weight) : 0,
    // Assumption: ~20 at draft. Adjustable via the Age slider.
    ageYears: bio?.draftYear ? Math.min(45, 20 + yearsPro) : 27,
    yearsPro,
    estContractValueUsd: salary
      ? Math.max(salary.remainingValue, salary.currentCapHit)
      : 120_000_000,
    baseSalaryUsd: salary ? salary.currentCapHit : 28_000_000,
    guaranteedUsd: salary ? salary.remainingValue : 64_000_000,
    endorsementsUsd: 6_500_000,
    injurySeverity: 50,
    contractDurationYrs: contractYrs,
    behavioralRiskIndex: 32,
    riskTier: "ELEVATED",
    riskColor: "cyan",
    stabilityScore: 60,
    signature: bio ? `ATHLIX::BDL${bio.id}` : `ATHLIX::${slug.slice(0, 4).toUpperCase()}`,
    thesis: bio
      ? "Bio and team results are live BALLDONTLIE data. Contract dollars, where shown, come from the dated cap-sheet snapshot; other figures are scenario assumptions — tune the simulator sliders to explore outcomes."
      : "No live record matched this slug. All figures are scenario assumptions — tune the simulator sliders to explore outcomes.",
    flashFlags: ["Scenario assumptions active"],
  };
}

export default async function PlayerDashboardPage({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<SearchParams>;
}) {
  const { player: slug } = await params;
  const sp = await searchParams;

  const bdlRaw = typeof sp.bdl === "string" ? Number.parseInt(sp.bdl, 10) : NaN;
  const bdlId = Number.isFinite(bdlRaw) && bdlRaw > 0 ? bdlRaw : undefined;

  const curated = getPlayerBySlug(slug);
  const live = await getLiveStats({
    bdlId,
    name: curated?.name ?? displayNameFromSlug(slug),
  });

  const resolvedName = curated?.name ?? live?.player?.name ?? displayNameFromSlug(slug);
  const salary = getSalaryRecord(resolvedName);

  const player = curated ?? scenarioProfile(slug, live, salary);

  // Honest labeling of the hero's financial figures (item: never present
  // generic defaults as if player-specific). Curated profiles are disclosed
  // analyst assumptions and carry no inline note.
  const financialsNote = curated
    ? undefined
    : salary
      ? "Salary & contract value: real cap-sheet snapshot (see Cap Sheet card). Endorsements: illustrative default."
      : "Financial figures are illustrative defaults — no cap-sheet snapshot match for this player.";

  return (
    <div className="relative min-h-screen">
      <Atmosphere />
      <div className="relative z-10">
        <TopBar />
        <DashboardShell
          player={player}
          live={live}
          salary={salary}
          salarySource={SALARY_SOURCE}
          financialsNote={financialsNote}
        />
      </div>
    </div>
  );
}
