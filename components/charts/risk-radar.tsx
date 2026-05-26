"use client";

import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip,
} from "recharts";
import type { RiskBucket } from "@/lib/mock-engine";

export function RiskRadar({ buckets }: { buckets: RiskBucket[] }) {
  return (
    <ResponsiveContainer width="100%" height={290}>
      <RadarChart data={buckets} outerRadius="78%">
        <defs>
          <radialGradient id="radar-fill" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.45} />
            <stop offset="100%" stopColor="#22d3ee" stopOpacity={0.05} />
          </radialGradient>
          <radialGradient id="radar-base" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#a855f7" stopOpacity={0.25} />
            <stop offset="100%" stopColor="#a855f7" stopOpacity={0.04} />
          </radialGradient>
        </defs>
        <PolarGrid stroke="rgba(96,165,250,0.18)" />
        <PolarAngleAxis
          dataKey="category"
          tick={{
            fill: "rgba(160,180,220,0.85)",
            fontSize: 10,
            fontFamily: "var(--font-geist-mono, monospace)",
          }}
        />
        <PolarRadiusAxis
          angle={90}
          domain={[0, 100]}
          tick={{ fill: "rgba(120,144,192,0.5)", fontSize: 9 }}
          stroke="rgba(96,165,250,0.15)"
        />
        <Radar
          name="Cohort baseline"
          dataKey="baseline"
          stroke="#c4b5fd"
          strokeWidth={1.2}
          strokeDasharray="3 3"
          fill="url(#radar-base)"
          fillOpacity={0.5}
          isAnimationActive
          animationDuration={550}
        />
        <Radar
          name="Player exposure"
          dataKey="exposure"
          stroke="#22d3ee"
          strokeWidth={2}
          fill="url(#radar-fill)"
          fillOpacity={1}
          isAnimationActive
          animationDuration={550}
        />
        <Tooltip
          contentStyle={{
            background: "rgba(8,12,32,0.92)",
            border: "1px solid rgba(0,229,255,0.35)",
            borderRadius: 12,
            fontFamily: "var(--font-geist-mono, monospace)",
            fontSize: 11,
          }}
          labelStyle={{ color: "#a5f3fc", letterSpacing: "0.18em" }}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
