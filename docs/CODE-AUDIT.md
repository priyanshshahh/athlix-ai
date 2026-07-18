# ATHLIX AI — Code Audit

Honest audit of the `real-data` branch as of commit `0f0bf27`. This is a
documentation exercise only — nothing below has been fixed. Findings are
ranked by value-to-fix (impact × cheapness), highest first. Companion doc:
`docs/ARCHITECTURE.md` for how everything is wired together.

Verified 38/38 tests passing on Node 20 at time of writing.

---

## Ranked findings

### 1. Risk-tier color/threshold logic is reimplemented independently in six places

The 4-way tier mapping (`STABLE` / `ELEVATED` / `VOLATILE` / `CRITICAL` →
color) exists as six separate, hand-written implementations that all have to
be kept in sync by hand:

- `lib/scenario-engine.ts` — `tierFromScore()`, the canonical version (`<35`
  CRITICAL, `<55` VOLATILE, `<75` ELEVATED, else STABLE).
- `components/dashboard/stability-score.tsx` — its own local `tierFromScore()`
  with the *same* thresholds but a completely separate color palette (hex
  values + glow colors) that doesn't reference the engine's tier at all — it
  recomputes tier from the raw score a second time.
- `components/dashboard/risk-dial-card.tsx` — `TIER_COLORS` record keyed by
  the engine's `RiskDial["tier"]` string, third independent color mapping
  (Tailwind gradient classes this time).
- `components/dashboard/dashboard-shell.tsx` — inline ternary chains in the
  "Exposure" tab (`ReadoutRow` tone selection) and in the exposure-bucket bar
  coloring (`b.exposure > 70 / > 45` — different cut points than the tier
  system entirely).
- `components/landing/athlete-search.tsx` — `RiskPill`, a fourth
  reimplementation, operating on the *static* `PlayerProfile.riskTier` field.
- `app/dashboard/page.tsx` — `RiskBadge`, a fifth reimplementation, also
  operating on the static field.

Worse than the duplication itself: #5 and #6 read `PlayerProfile.riskTier`
(a hand-set field in `data/players.ts`), while everything under the actual
dashboard terminal reads the *dynamically computed* tier from
`simulate()`. These can disagree — e.g. Zion Williamson's curated
`riskTier: "CRITICAL"` is shown on the landing page and cohort index
regardless of what the simulator computes for the current (or default)
slider inputs on his actual dashboard page. A user bouncing between the
cohort index and a player's terminal can see two different tier labels for
the same player with no explanation of why.

**Fix value:** high. A single `tierFromScore` + a single color-token map
exported from one place (e.g. `lib/scenario-engine.ts` or a new
`lib/risk-tiers.ts`) would collapse six implementations into one, remove the
static/dynamic tier mismatch as a side effect, and make future threshold
changes (e.g. "VOLATILE cutoff should be 60 not 55") a one-line change
instead of a six-file hunt.

### 2. `clientKey()` is spoofable — no trusted-proxy validation (known limitation)

```ts
export function clientKey(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "anonymous";
}
```

`X-Forwarded-For` is a client-settable header unless something in front of
the app (a real reverse proxy or platform edge) strips and rewrites it. On
Vercel this is generally trustworthy, but the code has no assertion of that
— any deployment target that passes the raw header through (or an attacker
hitting the origin directly, bypassing the edge) can set an arbitrary
`X-Forwarded-For` value and get a fresh rate-limit bucket per request,
fully defeating both the search (30/min) and chat (20/min) limiters. Chat
abuse is the more expensive failure mode since it burns real OpenRouter
tokens.

**Fix value:** high given how cheap the fix is (validate against a known
trusted-proxy count / use a platform-provided real client IP header instead
of the raw client-controlled one), but genuinely requires knowing the actual
deployment topology (Vercel vs. self-hosted behind nginx vs. bare) to do
correctly — hence not fixed here per the task's scope.

### 3. No fetch timeout anywhere in the BALLDONTLIE client or the chat stream (known limitation)

`bdlFetch()` in `lib/balldontlie.ts` calls `fetch()` with no `AbortController`
/ timeout at all. A slow or hanging BALLDONTLIE response blocks the
in-flight request indefinitely (bounded only by the platform's own function
timeout, if any — there is none configured for the search route, only
`maxDuration = 30` on the chat route). Same for `streamText()` in
`app/api/chat/route.ts` — `maxDuration` caps the *route*, not the upstream
OpenRouter call specifically, and there's no client-abort wiring from a
timed-out request back to the OpenRouter stream.

Practical consequence: a degraded/slow BALLDONTLIE endpoint doesn't fail
fast into the "offline" UI state the app is designed around — it just hangs,
which is worse UX than the explicit `null`-on-error path the code otherwise
takes care to implement everywhere else.

**Fix value:** high, cheap. A `signal: AbortSignal.timeout(5000)`-style guard
in `bdlFetch()` (and a corresponding `try/catch` — already present around
callers) is a small, mechanical, low-risk change. Not fixed here per task
scope.

### 4. Dead UI components: `card.tsx`, `badge.tsx`, `input.tsx`, `skeleton.tsx`

Verified via repo-wide grep: none of `components/ui/card.tsx`,
`badge.tsx`, `input.tsx`, or `skeleton.tsx` are imported anywhere in `app/`
or `components/`. All four are fully-built, exported components (Card has
five sub-exports: `Card`, `CardHeader`, etc.) sitting unused. Roughly
180 lines combined.

**Fix value:** medium-high, trivial. Either delete them or use them (the
dashboard rebuilds "card" styling ad hoc with `glass-card` className strings
in a dozen places instead of the `<Card>` primitive that already exists for
exactly that).

### 5. Unused dependencies: `@balldontlie/sdk`, `@radix-ui/react-dialog`

`package.json` lists `@balldontlie/sdk` (the official BALLDONTLIE SDK
package) as a dependency, but `lib/balldontlie.ts` is a hand-rolled `fetch`
wrapper that never imports it — grep across the repo finds zero references
to `@balldontlie/sdk` outside `package.json`/`package-lock.json`. Similarly,
`@radix-ui/react-dialog` is installed but never imported (the chat panel and
all modals are hand-built `motion.div`s, not Radix `Dialog`s).

Both inflate `npm install` time and the dependency-audit surface for no
functional benefit. `@balldontlie/sdk` in particular is odd to carry
alongside a from-scratch client for the same API — it reads like the SDK
was evaluated and then abandoned in favor of a custom client, without the
dependency being removed.

**Fix value:** medium, trivial (delete two lines from `package.json`,
`npm install` to update the lockfile). Zero behavior risk since neither is
imported.

### 6. `scenario-engine.ts`'s dials/buckets are hand-tuned magic-number soup with no per-formula tests

Every one of the 5 dials and 6 buckets is its own bespoke linear combination
of `inj`, `sal`, `age`, `dur`, `stabilityScore`, and `bri` with distinct
coefficients (0.78, 0.42, 0.36, 1.3, 0.5, 14, 0.4, 0.7, 18, 0.78, 0.1, 0.95,
18, 22, 0.4, 14, 0.9, 0.95, 80, 2 — not exhaustive). None of these
individual formulas are unit-tested; `tests/scenario-engine.test.ts` only
asserts array *lengths* (5 dials, 6 buckets) and top-level bounds
(`stabilityScore` in [6,96], `collapseProb` in [4,97]), never that, say,
"Injury Risk" dial value tracks `injurySeverity` monotonically, or that
"Behavioral Volatility" actually reflects `behavioralRiskIndex` at all after
its formula. A coefficient typo in any single dial/bucket formula (e.g.
transposing 0.78 and 0.87 in the injury factor) would not be caught by the
current suite unless it happened to push a value outside the very wide
overall bounds.

This isn't necessarily wrong for a hand-tuned demo simulator — the whole
point (per `/methodology`) is that these are "hand-chosen for internal
consistency and visual demonstration, not fit to historical earnings data."
But the *number* of independent hand-tuned constants (conservatively 40+
distinct magic numbers across the file) is large relative to the test
coverage protecting them, and there's no single place that documents *why*
e.g. Injury Risk uses `1.3` as the age-scaling coefficient vs. Body
Composition's `2`.

**Fix value:** medium. Not a bug — a legibility/maintainability risk. Adding
a handful of targeted tests per dial (monotonicity in the relevant input)
would catch regressions cheaply without requiring the formulas themselves to
change.

### 7. `dashboard-preview.tsx` mixes one hardcoded fake value into otherwise-real computed stats

In the landing-page preview card (`components/landing/dashboard-preview.tsx`),
two of the three `PreviewStat` values are genuinely computed from
`simulate()` on the real Zion Williamson profile (`injuryDial`,
`retireDial`), but the third is a literal string:

```tsx
<PreviewStat
  icon={<ShieldAlert .../>}
  label="CTR"
  value="HIGH"     // hardcoded — not derived from sim at all
  tone="amber"
/>
```

Given the project's stated ethos (per `README.md` / `PROJECT-NOTES.md`) of
never inventing numbers and clearly labeling what's real vs. assumed, a
silently-hardcoded "HIGH" sitting next to two genuinely-computed values is
inconsistent with that standard, even though it's on a decorative preview
card rather than the real terminal.

**Fix value:** low-medium, trivial (derive it from
`sim.buckets.find(b => b.category === "Contract instability")` or a dial,
or relabel it as illustrative).

### 8. Non-curated ("live/scenario") player financial figures are identical for every player

`app/dashboard/[player]/page.tsx`'s `scenarioProfile()` function assigns the
*exact same* dollar figures to every player who isn't one of the 5 curated
profiles: `estContractValueUsd: 120_000_000`, `baseSalaryUsd: 28_000_000`,
`guaranteedUsd: 64_000_000`, `endorsementsUsd: 6_500_000`,
`injurySeverity: 50`, `contractDurationYrs: 3`, `behavioralRiskIndex: 32`,
`stabilityScore: 60`. Search for, say, a random bench player via live
BALLDONTLIE search, and their dashboard will show the identical financial
profile as any other non-curated player, sitting directly next to their
*real* bio (real team, real college, real draft year). The thesis text does
disclaim this ("Financial figures are scenario assumptions"), but the
numbers themselves give no visual signal that they're generic defaults
rather than player-specific — nothing distinguishes "$120M contract value"
shown for a journeyman two-way player from the same number shown for a
different obscure player.

**Fix value:** medium. This is documented behavior (not a bug), but from a
product-honesty standpoint it's a sharper edge than the rest of the app,
which is otherwise careful about real/assumed boundaries. Even a
lightweight scaling (e.g. by position or draft round) would reduce the
"suspiciously identical numbers" tell; at minimum a more visible in-card
label (beyond the thesis paragraph) would help.

### 9. Dashboard state-reset relies on an implicit coupling to `app/template.tsx`

`components/dashboard/dashboard-shell.tsx` initializes `inputs` via
`useState(defaults)` where `defaults = useMemo(() => defaultInputsFor(player), [player])`.
`useState`'s initial value is only honored on mount — if `DashboardShell`
were ever rendered again with a new `player` prop *without unmounting*
(e.g. a future client-side transition between two player dashboards, or a
parent that starts passing props without a key change), the sliders would
silently keep the previous player's inputs instead of resetting to the new
player's defaults.

Today this doesn't manifest as a bug only because `app/dashboard/[player]/page.tsx`
is a Server Component (fully re-rendered per navigation) and
`app/template.tsx` keys its `AnimatePresence` wrapper by `pathname`, forcing
a full remount of the entire page subtree — including `DashboardShell` — on
every route change. That's a correct-today, fragile-tomorrow dependency: the
correctness of `DashboardShell`'s state reset lives entirely in a different
file (`template.tsx`) that has no comment pointing back to this reliance,
and no test protects the invariant. Any future refactor toward client-side
soft navigation between player pages (a very natural feature to add) would
silently reintroduce stale-simulator-state bugs.

**Fix value:** medium. Cheapest robust fix would be a `key={player.slug}`
on `<DashboardShell>` itself (making the remount-on-player-change explicit
and local, independent of the pathname-based template trick), or an
explicit `useEffect` that resets `inputs` when `player.slug` changes.

### 10. `AthleteSearch` swallows 429s into the generic "no results" path

In `components/landing/athlete-search.tsx`, the fetch handler checks
`res.status === 503` explicitly (routes to the offline banner) but any other
non-2xx status, including the `429` the rate limiter can return, falls into
the generic `if (!res.ok) { setResults([]); return; }` branch. A user who
trips the 30/min search limit sees an empty "no matches" state with no
indication they've been rate limited or should wait, even though the server
sent a `Retry-After` header specifically for this purpose. The 429 handling
that *is* tested (`tests/search-route.test.ts`) only verifies the server
response shape, not that the client does anything useful with it.

**Fix value:** low-medium. Small, isolated fix (one more `if (res.status === 429)`
branch mirroring the 503 handling), decent UX payoff for a demo whose whole
premise is a live-typing search box that's easy to trip the limiter on by
typing quickly.

---

## Additional notes (not independently ranked — lower value or purely cosmetic)

- **`meta.json` has unfilled placeholders** (`"videoUrl": "LOOM_LINK_HERE"`,
  `"deployedUrl": "DEPLOY_URL_HERE"`) — fine for an in-progress campaign
  artifact, called out here only because it's the kind of thing that's easy
  to forget to fill in before the project is considered "done."
- **`next.config.ts` is an empty stub** — not a problem, just noting there's
  no image-domain allowlist, no experimental flags, nothing customized; the
  app relies entirely on Next defaults.
- **The in-memory rate limiter resets on cold start and is per-instance**
  (already self-documented in `lib/rate-limit.ts`'s file header and
  `README.md`'s deploy section) — correctly flagged as a known,
  accepted limitation for a single-instance demo, not re-litigated here.
- **`AGENTS.md`** instructs future agents to read
  `node_modules/next/dist/docs/` before writing code because "this version
  has breaking changes." Worth a human sanity-check at some point that this
  note (and the pinned `next@16.2.6` / `react@19.2.4` versions it refers to)
  still reflects reality, since stale versioning warnings like this tend to
  rot silently.
- **`components/dashboard/simulator.tsx`'s stress presets** (`collapse`,
  `fragile`, `rebound`, `blue-chip`) hardcode the same four input values
  regardless of which player is loaded — reasonable for "stress test the
  formulas" framing, but worth knowing the presets are player-agnostic, not
  player-calibrated, if that's ever surprising in a demo.
