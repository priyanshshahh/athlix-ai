# ATHLIX AI — Project Notes

Engineering notes for the `real-data` branch: what is real, what is a modeling
assumption, the live verification runs, and the deploy plan.

## Real vs. demo status

| Surface | Status | Notes |
| --- | --- | --- |
| NBA player search (`/api/players/search`) | **Real** | Live BALLDONTLIE `/players?search=` server-side. |
| Player bio + recent team games (dashboard SSR) | **Real** | Live BALLDONTLIE `/players/:id` + `/games`. Null → explicit offline card. |
| ATHLIX Intelligence chat (`/api/chat`) | **Real** when `OPENROUTER_API_KEY` set | Streams DeepSeek via OpenRouter. No key → **labeled demo** stream. |
| Stability / collapse / wealth / dials / buckets / percentile | **Simulated (labeled)** | Deterministic formulas in `lib/scenario-engine.ts`. Not a predictive model. |
| Dollar figures (salary, guarantees, endorsements, contract value) | **Assumptions** | Analyst-set for 5 curated profiles; documented defaults otherwise. |
| Cohort baseline + percentile | **Synthetic** | A Gaussian earnings curve, not a real player population. |
| Landing ticker | **Illustrative** | Labeled "SAMPLE_TICKER · illustrative values · not a live market feed". |

The `/methodology` page states all of this in-product and prints the formulas.

## Honesty fixes applied on this branch

- Removed the "540K+ players indexed" claim and the fabricated
  "23ms latency / 99.992% uptime" footer metrics.
- Reframed forecasting / ML / Monte-Carlo copy to deterministic scenario
  simulation across landing, feature grid, metadata, and dashboard.
- Confirmed **no** `NEXT_PUBLIC_*` key pattern anywhere; both keys are
  server-side only.
- Confirmed the engine reads profile **attributes**, never player names — no
  `includes("morant")`-style special-casing. A test enforces this.
- Labeled the no-key chat fallback as a canned demo template.

## Live verification (2026-07-17)

Run against `next dev` with keys sourced from the campaign keys file into the
server's runtime env only (never written to any tracked file, commit, or log).

### BALLDONTLIE — live search

`GET /api/players/search?q=curry` →

```json
{"data":[
  {"id":114,"name":"Seth Curry","slug":"seth-curry","position":"G","team":{"abbreviation":"GSW","fullName":"Golden State Warriors"}},
  {"id":115,"name":"Stephen Curry","slug":"stephen-curry","position":"G","team":{"abbreviation":"GSW","fullName":"Golden State Warriors"}},
  {"id":817,"name":"Michael Curry","team":{"abbreviation":"DET"}},
  ... ],
 "source":"balldontlie"}
```

Real players, real teams, HTTP 200.

### BALLDONTLIE — live stats

`GET /dashboard/stephen-curry?bdl=115` (server-rendered) surfaced the real
"Live Feed · BALLDONTLIE / Real data" card with:

- Team: **Golden State Warriors**, College: **Davidson**
- Recent games dated **2026-04-09, -10, -12, -15, -17** (real season results)
- Source line: `Source: balldontlie.io · fetched …`
- The "Live Feed · Offline" fallback did **not** render (count = 0).

### OpenRouter / DeepSeek — live chat

`POST /api/chat` with a real scenario context streamed a genuine, context-
grounded DeepSeek response (reassembled from the SSE `text-delta` events):

> Stephen Curry faces elevated collapse risk (61.2% probability) with
> below-average stability (47/100) versus his aging NBA guard cohort (22nd
> percentile). The scenario reflects high salary exposure (70%) and injury
> severity (55%) compressing his performance window.
> … Key observations: age-injury compound; contract tightrope; cohort warning;
> contrarian note (Curry's outlier shooting *could* offset some physical
> decline — not modeled here); exposure risk.
> Scenario mechanics assume typical guard aging curves—actual outcomes may
> deviate given Curry's unique profile.

The model echoed the injected scenario numbers and correctly framed itself as
scenario mechanics, not a forecast. HTTP stream ended with `finishReason: stop`.

### Route validation / limits (observed live)

- `POST /api/chat` with `{"messages":[]}` → **400** (`invalid_request`).
- Rate limiting and zod validation additionally covered by the vitest suite.

## Tests

`npm test` → **38 tests, 6 files, all passing**:

- `rate-limit.test.ts` — window slide, per-key isolation, client-key extraction.
- `utils.test.ts` — slugify, clamp, currency/percent formatting.
- `scenario-engine.test.ts` — determinism, bounds, **name-independence**, structure.
- `balldontlie.test.ts` — auth header, short-query short-circuit, error mapping, no-key failure, season logic, game filtering (mocked fetch).
- `search-route.test.ts` — 503 no-key, 400 short query, mapped happy path, 429 rate limit.
- `chat-route.test.ts` — 400 bad JSON / empty messages / bad role, labeled demo stream, 429 rate limit.

## CI

`.github/workflows/ci.yml` runs install → lint → test → build on Node 20. The
build step runs with empty keys to prove the app builds without secrets.

## Deploy plan

- **Target:** Vercel (awaits one-time owner login).
- **Env vars (Production + Preview):** `BALLDONTLIE_API_KEY`,
  `OPENROUTER_API_KEY`. Server-side only — never `NEXT_PUBLIC_*`.
- **Steps:** `vercel` (preview) → verify → `vercel --prod`.
- **Known limitation:** `lib/rate-limit.ts` is in-memory and per-instance
  (resets on cold start). Acceptable for a single-instance demo; swap for a
  shared store (Upstash Redis) before scaling to multiple instances.
- **No secrets** are committed; `.env*` is gitignored and `.env.example` ships
  with empty placeholders.
