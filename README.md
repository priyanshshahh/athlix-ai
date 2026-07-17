# ATHLIX AI

> **An athlete financial-risk scenario simulator, on real NBA data.**

ATHLIX is a **scenario simulator**, not a predictive model. You pick a player,
tune four sliders (age, injury severity, contract duration, salary exposure),
and a set of **fixed, deterministic formulas** produce a self-consistent risk
readout — stability score, collapse probability, wealth trajectory, exposure
buckets, and cohort percentile. Same inputs always produce the same outputs. It
does **not** forecast real-world outcomes and is **not** financial advice.

What *is* real: NBA player search, bios, and recent team results come live from
the [BALLDONTLIE](https://www.balldontlie.io) API, fetched **server-side**. What
*is* a modeling assumption: every dollar figure and the synthetic cohort
baseline. The `/methodology` page in the app spells out exactly which is which,
and prints the formulas.

---

## Verified behavior

All of the following was exercised end-to-end against the running app on
2026-07-17 (see [`docs/PROJECT-NOTES.md`](docs/PROJECT-NOTES.md) for the raw
captures):

- **Live search** — `GET /api/players/search?q=curry` returned real players
  (Stephen Curry, id 115, Golden State Warriors) from BALLDONTLIE.
- **Live stats** — the Stephen Curry dashboard server-rendered his real bio
  (Davidson, Golden State Warriors) and real recent games (April 2026 finals),
  sourced and timestamped.
- **Live AI** — `POST /api/chat` streamed a real DeepSeek response via
  OpenRouter, grounded in the active scenario context.
- **Graceful degradation** — with no keys, live search returns `503` and the
  chat serves a **labeled** demo stream; the build still succeeds.

---

## Architecture

```
Browser (client components)
  │  search-as-you-type  ────────►  GET /api/players/search   ─┐
  │  chat (useChat/SSE)  ────────►  POST /api/chat            ─┤ server-only
  │                                                            │  (keys never
  ▼                                                            │   sent to
Player dashboard (server component, SSR)                       │   the browser)
  └─ getLiveStats() ───────────────────────────────────────────┘
        │
        ├─ lib/balldontlie.ts   → BALLDONTLIE REST (Authorization header)
        ├─ lib/live-stats.ts    → assembles bio + recent games (or null → offline)
        ├─ lib/scenario-engine.ts → deterministic simulator (no name special-casing)
        └─ lib/rate-limit.ts    → in-memory sliding-window limiter (both routes)
```

Key design points:

- **Server-side keys only.** `BALLDONTLIE_API_KEY` and `OPENROUTER_API_KEY` are
  read in route handlers / server components. There is no `NEXT_PUBLIC_*` key —
  nothing secret is bundled into client JS.
- **The simulator reads attributes, never names.** A test asserts that two
  profiles differing only by name produce byte-identical output.
- **Honest failure.** No key or a failed upstream call yields an explicit
  offline / demo state, never invented numbers.
- **Rate limited.** Search 30/min, chat 20/min, per client, with `Retry-After`.

### Tech stack

| Layer       | Tech                                                     |
| ----------- | -------------------------------------------------------- |
| Framework   | Next.js 16 (App Router) + TypeScript                     |
| Styling     | Tailwind CSS v4 + custom design system                   |
| UI / motion | Radix primitives, Lucide icons, Framer Motion, Recharts  |
| AI          | Vercel AI SDK v6 + `@openrouter/ai-sdk-provider` (DeepSeek) |
| Sports data | BALLDONTLIE REST                                          |
| Validation  | zod (route input)                                        |
| Tests       | Vitest (38 tests)                                        |

---

## Run it (3 commands)

```bash
npm install
cp .env.example .env.local      # then paste your two keys (both optional)
npm run dev                     # → http://localhost:3000
```

The app runs with **no keys** — you just get the offline/demo states. Add keys
to `.env.local` to light up live search, live stats, and live AI. Both keys are
server-side only; see [`.env.example`](.env.example).

### Other scripts

```bash
npm test          # vitest run (38 tests)
npm run lint      # eslint
npm run build     # production build (succeeds without keys)
npm start         # serve the production build
```

---

## Deploy (Vercel)

Vercel is the intended target (awaits a one-time owner login).

```bash
npm i -g vercel
vercel            # preview
vercel --prod     # production
```

Set the two server-side env vars in **Vercel → Settings → Environment
Variables** (Production + Preview): `BALLDONTLIE_API_KEY`, `OPENROUTER_API_KEY`.
Do **not** prefix either with `NEXT_PUBLIC_`.

The in-memory rate limiter is per-instance and resets on cold start — fine for a
single-instance demo. For multi-instance production, swap `lib/rate-limit.ts`
for a shared store (e.g. Upstash Redis).

---

## Not financial advice

ATHLIX is a research and demonstration tool. All risk figures are outputs of a
deterministic scenario simulator over user-set inputs — scenario simulation,
not prediction. No betting, fantasy, or gambling functionality.

© 2026 Priyansh Shah
