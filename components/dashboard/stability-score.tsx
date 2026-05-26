"use client";

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import * as React from "react";

const SIZE = 220;
const STROKE = 12;
const R = (SIZE - STROKE) / 2;
const C = 2 * Math.PI * R;

function tierFromScore(score: number): {
  tier: "STABLE" | "ELEVATED" | "VOLATILE" | "CRITICAL";
  color: string;
  glow: string;
  text: string;
} {
  if (score < 35)
    return {
      tier: "CRITICAL",
      color: "#fb7185",
      glow: "rgba(251,113,133,0.65)",
      text: "neon-text-rose",
    };
  if (score < 55)
    return {
      tier: "VOLATILE",
      color: "#fbbf24",
      glow: "rgba(251,191,36,0.55)",
      text: "text-amber-200",
    };
  if (score < 75)
    return {
      tier: "ELEVATED",
      color: "#22d3ee",
      glow: "rgba(0,229,255,0.55)",
      text: "neon-text-cyan",
    };
  return {
    tier: "STABLE",
    color: "#34d399",
    glow: "rgba(52,211,153,0.55)",
    text: "neon-text-emerald",
  };
}

export function StabilityScore({
  score,
  delta,
}: {
  score: number;
  delta: number;
}) {
  const tier = tierFromScore(score);
  const mv = useMotionValue(0);
  const spring = useSpring(mv, { stiffness: 110, damping: 22, mass: 0.8 });
  const dash = useTransform(spring, (v) => `${(v / 100) * C} ${C}`);
  const display = useTransform(spring, (v) => Math.round(v));
  const [val, setVal] = React.useState(0);

  React.useEffect(() => {
    mv.set(score);
    const unsub = display.on("change", (v: number) => setVal(v));
    return unsub;
  }, [score, mv, display]);

  return (
    <div className="relative flex flex-col items-center">
      <div className="relative" style={{ width: SIZE, height: SIZE }}>
        <div
          aria-hidden
          className="absolute inset-0 rounded-full"
          style={{
            boxShadow: `0 0 60px -10px ${tier.glow}`,
          }}
        />
        <svg
          width={SIZE}
          height={SIZE}
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          className="relative -rotate-90"
        >
          <defs>
            <linearGradient id="score-grad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#22d3ee" />
              <stop offset="50%" stopColor={tier.color} />
              <stop offset="100%" stopColor="#a855f7" />
            </linearGradient>
            <filter id="score-glow">
              <feGaussianBlur stdDeviation="3" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={R}
            fill="none"
            stroke="rgba(120,144,192,0.12)"
            strokeWidth={STROKE}
          />
          <motion.circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={R}
            fill="none"
            stroke="url(#score-grad)"
            strokeWidth={STROKE}
            strokeLinecap="round"
            style={{ strokeDasharray: dash }}
            filter="url(#score-glow)"
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="font-mono text-[9px] uppercase tracking-[0.32em] text-cyan-300/80">
            Career Stability
          </div>
          <div
            className={`mt-1 text-6xl font-semibold tabular-nums leading-none ${tier.text}`}
          >
            {val}
          </div>
          <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.22em] text-slate-400">
            / 100
          </div>
          <div
            className={`mt-3 rounded-md border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.22em]`}
            style={{
              color: tier.color,
              borderColor: `${tier.color}66`,
              background: `${tier.color}14`,
              boxShadow: `0 0 24px -8px ${tier.glow}`,
            }}
          >
            {tier.tier}
          </div>
          <div
            className={`mt-2 font-mono text-[10px] tabular-nums ${
              delta >= 0 ? "text-emerald-300" : "text-rose-300"
            }`}
          >
            {delta >= 0 ? "▲" : "▼"} {Math.abs(delta).toFixed(1)} pts vs.
            baseline
          </div>
        </div>
      </div>
    </div>
  );
}
