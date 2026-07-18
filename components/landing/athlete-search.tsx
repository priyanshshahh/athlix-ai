"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Sparkles, ArrowRight, Loader2, WifiOff, Timer } from "lucide-react";
import { PLAYERS, SUGGESTED_SLUGS } from "@/data/players";
import { defaultTierForProfile, type RiskTier } from "@/lib/scenario-engine";
import { tierStyle } from "@/lib/risk-tiers";

export type SearchResult = {
  id: number;
  name: string;
  slug: string;
  position: string | null;
  team: { id: number; abbreviation: string; fullName: string } | null;
};

// Precompute the DYNAMIC default-input tier for each curated profile so the
// pill here matches the tier the player's terminal shows on load, rather than
// the stale hand-set `riskTier` field. See lib/risk-tiers.ts.
const SUGGESTED = SUGGESTED_SLUGS.map((s) => PLAYERS.find((p) => p.slug === s)!)
  .filter(Boolean)
  .map((p) => ({ profile: p, tier: defaultTierForProfile(p) }));

const DEBOUNCE_MS = 250;

export function AthleteSearch() {
  const router = useRouter();
  const [value, setValue] = React.useState("");
  const [focused, setFocused] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [results, setResults] = React.useState<SearchResult[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [offline, setOffline] = React.useState(false);
  const [retryAfter, setRetryAfter] = React.useState<number | null>(null);
  const abortRef = React.useRef<AbortController | null>(null);

  // Debounced live search against the server-side BALLDONTLIE proxy. All
  // state writes live inside the timer callback (never synchronously in the
  // effect body) so typing does not trigger cascading renders.
  React.useEffect(() => {
    const q = value.trim();
    const t = setTimeout(async () => {
      if (q.length < 2) {
        setResults([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      try {
        const res = await fetch(`/api/players/search?q=${encodeURIComponent(q)}`, {
          signal: controller.signal,
        });
        if (res.status === 503) {
          setOffline(true);
          setResults([]);
          return;
        }
        if (res.status === 429) {
          // Surface the server's Retry-After instead of a blank "no matches".
          const secs = Number(res.headers.get("Retry-After"));
          setRetryAfter(Number.isFinite(secs) && secs > 0 ? secs : 60);
          setResults([]);
          return;
        }
        if (!res.ok) {
          setResults([]);
          return;
        }
        const body = (await res.json()) as { data: SearchResult[] };
        setOffline(false);
        setRetryAfter(null);
        setResults(body.data);
      } catch {
        // aborted or network error — keep previous state
      } finally {
        setLoading(false);
      }
    }, DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [value]);

  const go = (href: string) => {
    setSubmitting(true);
    router.push(href);
  };

  const submit = () => {
    if (results[0]) {
      go(`/dashboard/${results[0].slug}?bdl=${results[0].id}`);
    } else if (!value.trim() && SUGGESTED[0]) {
      go(`/dashboard/${SUGGESTED[0].profile.slug}`);
    }
  };

  const showLive = value.trim().length >= 2;

  return (
    <div className="relative w-full max-w-3xl">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className={`relative glass-card-strong overflow-hidden ${
          focused ? "neon-border-cyan" : "border-white/10"
        }`}
      >
        <div className="pointer-events-none absolute inset-0 grid-overlay-fine opacity-50" />
        <div className="pointer-events-none absolute -inset-px rounded-[22px] animate-shimmer opacity-60" />

        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
          className="relative flex items-center gap-3 px-5 py-4"
        >
          <Search className="h-5 w-5 text-cyan-300" />
          <input
            type="search"
            inputMode="search"
            enterKeyHint="search"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setTimeout(() => setFocused(false), 120)}
            placeholder="Search any NBA player, e.g. Stephen Curry…"
            className="flex-1 bg-transparent text-lg font-mono tracking-wide text-slate-100 placeholder:text-slate-500 focus:outline-none"
            aria-label="Search athlete"
          />
          <div className="hidden md:flex items-center gap-2 font-mono text-[10px] text-slate-500 uppercase tracking-[0.22em]">
            <kbd className="rounded border border-white/10 bg-white/[0.04] px-1.5 py-0.5">
              ⏎
            </kbd>
            Analyze
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="ml-2 inline-flex items-center gap-2 rounded-lg glow-button px-4 py-2 text-sm disabled:opacity-60"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            Run Risk Scan
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>
      </motion.div>

      <AnimatePresence>
        {focused && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            aria-live="polite"
            className="absolute z-30 mt-2 w-full glass-card-strong p-2"
          >
            <div className="px-3 pt-2 pb-1 font-mono text-[10px] uppercase tracking-[0.28em] text-cyan-300/70 flex items-center justify-between">
              <span>
                {showLive ? "Live NBA Search · BALLDONTLIE" : "Featured Profiles"}
              </span>
              <span className="text-slate-500">
                {showLive ? `${results.length} matches` : `${SUGGESTED.length} curated`}
              </span>
            </div>

            {offline && showLive && (
              <div className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-xs text-amber-200">
                <WifiOff className="h-3.5 w-3.5" />
                Live search offline — BALLDONTLIE key not configured.
              </div>
            )}

            {retryAfter !== null && showLive && (
              <div className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-xs text-amber-200">
                <Timer className="h-3.5 w-3.5" />
                Search rate limit reached — try again in ~{retryAfter}s.
              </div>
            )}

            <div className="grid gap-1">
              {!showLive &&
                SUGGESTED.map(({ profile: p, tier }) => (
                  <button
                    key={p.slug}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      go(`/dashboard/${p.slug}`);
                    }}
                    className="group flex items-center gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-cyan-400/[0.06] transition"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-md border border-white/10 bg-gradient-to-br from-cyan-500/20 to-violet-500/20 font-mono text-[11px] text-cyan-200">
                      {p.teamAbbr}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-100">{p.name}</span>
                        <span className="font-mono text-[10px] text-slate-500">
                          {p.position} · {p.jersey}
                        </span>
                      </div>
                      <div className="font-mono text-[10px] text-slate-500 uppercase tracking-[0.18em] truncate">
                        {p.team} · curated profile
                      </div>
                    </div>
                    <RiskPill tier={tier} />
                    <ArrowRight className="h-4 w-4 text-slate-500 group-hover:text-cyan-300 transition" />
                  </button>
                ))}

              {showLive &&
                results.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      go(`/dashboard/${r.slug}?bdl=${r.id}`);
                    }}
                    className="group flex items-center gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-cyan-400/[0.06] transition"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-md border border-white/10 bg-gradient-to-br from-cyan-500/20 to-violet-500/20 font-mono text-[11px] text-cyan-200">
                      {r.team?.abbreviation ?? "FA"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-100">{r.name}</span>
                        {r.position && (
                          <span className="font-mono text-[10px] text-slate-500">
                            {r.position}
                          </span>
                        )}
                      </div>
                      <div className="font-mono text-[10px] text-slate-500 uppercase tracking-[0.18em] truncate">
                        {r.team?.fullName ?? "Free agent"} · live record
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-500 group-hover:text-cyan-300 transition" />
                  </button>
                ))}

              {showLive && !loading && !offline && retryAfter === null && results.length === 0 && (
                <div className="px-3 py-3 text-sm text-slate-400">
                  No NBA players match{" "}
                  <span className="text-cyan-200 font-mono">&quot;{value}&quot;</span>.
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function RiskPill({ tier }: { tier: RiskTier }) {
  return (
    <span
      className={`rounded-md border px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.22em] ${tierStyle(tier).pill}`}
    >
      {tier}
    </span>
  );
}
