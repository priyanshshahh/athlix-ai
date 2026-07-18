"use client";

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import * as React from "react";
import { tierFromScore, tierStyle } from "@/lib/risk-tiers";

const SIZE = 220;
const STROKE = 12;
const R = (SIZE - STROKE) / 2;
const C = 2 * Math.PI * R;

export function StabilityScore({
  score,
  delta,
}: {
  score: number;
  delta: number;
}) {
  const tier = tierFromScore(score);
  const style = tierStyle(tier);
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
            boxShadow: `0 0 60px -10px ${style.glow}`,
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
              <stop offset="50%" stopColor={style.hex} />
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
            className={`mt-1 text-6xl font-semibold tabular-nums leading-none ${style.text}`}
          >
            {val}
          </div>
          <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.22em] text-slate-400">
            / 100
          </div>
          <div
            className={`mt-3 rounded-md border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.22em]`}
            style={{
              color: style.hex,
              borderColor: `${style.hex}66`,
              background: `${style.hex}14`,
              boxShadow: `0 0 24px -8px ${style.glow}`,
            }}
          >
            {tier}
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
