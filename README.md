# ATHLIX AI

> **The Financial Intelligence Layer For Sports.**
> AI-powered athlete financial risk forecasting — career collapse, injury-linked
> earning decline, retirement liquidity failure, and contract instability
> rendered in one cinematic terminal.

ATHLIX AI is **not** fantasy sports, betting, or picks. It is a new
category — the first purpose-built financial-intelligence operating system
for athlete capital. The tool an agent, financial advisor, or front-office
risk officer opens every morning to forecast career collapse, contract
instability, and retirement liquidity in real time.

![ATHLIX preview](https://placehold.co/1600x800/050816/22d3ee?text=ATHLIX+AI+Terminal)

---

## Live demo flow

1. `/` — cinematic landing page with live ticker, athlete search, and a
   holographic dashboard preview.
2. Type a name (or click a suggested player) → `/dashboard/[slug]`.
3. Tweak the **Scenario Simulator** sliders (Age, Injury Severity, Contract
   Duration, Salary Exposure) → every chart, dial, and exposure bar
   recomputes in real time.
4. Launch **ATHLIX Intelligence** (bottom-right) → streaming institutional
   quant-grade analyst output via OpenRouter + DeepSeek.

---

## Tech stack

| Layer        | Tech                                                                |
| ------------ | ------------------------------------------------------------------- |
| Framework    | **Next.js 16** (App Router, Turbopack) + TypeScript                 |
| Styling      | **Tailwind CSS v4** + custom cinematic design system                |
| UI           | shadcn-style primitives + **Radix UI** + **Lucide Icons**           |
| Motion       | **Framer Motion** (page fades, scoring springs, ticker, particles)  |
| Charts       | **Recharts** (area, radar, custom holographic tooltip)              |
| AI           | **Vercel AI SDK v6** + `@openrouter/ai-sdk-provider` + **DeepSeek** |
| Sports data  | **BALLDONTLIE** SDK + REST                                          |
| Deploy       | **Vercel**                                                          |

---

## Project structure

```
athlix/
├── app/
│   ├── api/chat/route.ts              # AI SDK v6 stream (OpenRouter / DeepSeek)
│   ├── dashboard/page.tsx             # Cohort index
│   ├── dashboard/[player]/page.tsx    # Player risk terminal
│   ├── layout.tsx                     # Root layout + fonts + metadata
│   ├── template.tsx                   # Framer Motion page transitions
│   ├── page.tsx                       # Landing page
│   └── globals.css                    # Tailwind v4 + cyberpunk design system
├── components/
│   ├── landing/                       # Atmosphere, TopBar, Ticker, Search, Preview
│   ├── dashboard/                     # PlayerHero, StabilityScore, Simulator, Shell
│   ├── charts/                        # WealthChart, RiskRadar, RiskTooltip
│   ├── ai/                            # ChatPanel (useChat + DefaultChatTransport)
│   ├── motion/                        # PageFade
│   └── ui/                            # Card, Button, Badge, Slider, Tabs, Input, Skeleton
├── lib/
│   ├── utils.ts                       # cn(), formatCurrency, clamp, slugify
│   ├── mock-engine.ts                 # Deterministic risk simulation engine
│   └── balldontlie.ts                 # BALLDONTLIE REST wrapper
├── data/
│   └── players.ts                     # 5 hand-crafted analyst profiles
├── meta.json                          # Hackathon submission metadata
└── .env.local                         # Local secrets (gitignored)
```

---

## Local setup

```bash
# 1. Install
npm install

# 2. Configure secrets (already created at .env.local)
#    OPENROUTER_API_KEY=...
#    NEXT_PUBLIC_BALLDONTLIE_API_KEY=...

# 3. Dev server
npm run dev   # → http://localhost:3000

# 4. Production build
npm run build && npm start

# 5. Quality gates
npm run lint
npx tsc --noEmit
```

### Demo-safe fallback

If `OPENROUTER_API_KEY` is missing, `/api/chat` automatically streams a
believable canned analyst response in the v6 UI-message-stream protocol — the
demo never breaks live on stage.

---

## Mock intelligence engine

`lib/mock-engine.ts` is a deterministic financial-physics model. Inputs
(age, injury severity, contract duration, salary exposure) feed:

- **Career Stability Score** (0–100, color-tiered)
- **Collapse probability** (request-time)
- **Wealth trajectory** vs. cohort baseline vs. collapse scenario
- **Risk radar** across 6 vectors
- **Five risk dials** (Career / Injury / Behavioral / Compression / Retirement)
- **Engine insights** + flash flags + cohort percentile

The engine produces consistent, demo-stable numbers — no API surprises.

---

## Deploy to Vercel

```bash
# One-time
npm i -g vercel
vercel login

# First deployment (preview)
vercel

# Promote to production
vercel --prod
```

Add the env vars in **Vercel → Settings → Environment Variables**:

| Name                             | Scope                  |
| -------------------------------- | ---------------------- |
| `OPENROUTER_API_KEY`             | Production + Preview   |
| `NEXT_PUBLIC_BALLDONTLIE_API_KEY`| Production + Preview   |

Or sync from `.env.local`:

```bash
vercel env pull
# review .env values, then push specific keys with:
vercel env add OPENROUTER_API_KEY production
vercel env add NEXT_PUBLIC_BALLDONTLIE_API_KEY production
```

---

## Push to GitHub

```bash
git init
git add .
git commit -m "Initial ATHLIX AI MVP"

gh repo create athlix-ai --public --source=. --remote=origin
git push -u origin main
```

(`gh auth login` first if you haven't authenticated the GitHub CLI.)

---

## Hackathon submission

`meta.json` is at the project root. Update `videoUrl`, `repoUrl`, and
`deployedUrl` after recording / deploying.

### Loom recording structure (suggested 2-minute cut)

1. **0:00 – 0:15 — Hook.** Land on `/`. Let the ticker scroll, hover the hero.
   Say: *"This is ATHLIX AI — the financial intelligence layer for sports."*
2. **0:15 – 0:30 — Vision.** Read the hero: *"A new category — purpose-built
   financial intelligence for athlete capital. We predict career collapse,
   injury-linked earning decline, retirement liquidity failure, and contract
   instability in one terminal."*
3. **0:30 – 0:45 — Search → Terminal.** Click **Zion Williamson**. Pause on
   the cinematic page transition.
4. **0:45 – 1:15 — The "Oh sh\*t" moment.** Drag the **Injury Severity**
   slider from 78 → 95. Show wealth trajectory collapsing live. Flip the
   **Collapse Scenario** preset.
5. **1:15 – 1:45 — ATHLIX Intelligence.** Open the floating chat panel.
   Ask: *"What is the collapse probability over 36 months?"* Watch the
   stream.
6. **1:45 – 2:00 — Outro.** Cut back to `/dashboard` (cohort index). Say:
   *"Five athletes on screen — \$700M+ in contract value monitored — one
   terminal."*

---

## Roadmap (post-hackathon)

- Live data ingestion (BALLDONTLIE stats → real-time delta vs. mock baseline)
- Per-athlete portfolio view (multi-asset wealth modelling)
- Front-office permissioned mode (agent / FO / advisor roles)
- Macro overlays (CBA, cap, luxury-tax sensitivity)
- Multi-league: NFL, MLB, NHL, F1 driver finance

---

## Not financial advice

ATHLIX AI is a **research and demo platform**. All numbers in this MVP are
synthesized from a deterministic mock engine. No betting, fantasy, or
gambling functionality.

---

© 2026 Priyansh Shah · Built for hackathon submission
