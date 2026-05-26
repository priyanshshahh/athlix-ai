"use client";

import {
  AreaChart,
  Area,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  ReferenceLine,
  Legend,
} from "recharts";
import { RiskTooltip } from "./risk-tooltip";
import type { WealthPoint } from "@/lib/mock-engine";

export function WealthChart({
  data,
  retirementCliffYr,
}: {
  data: WealthPoint[];
  retirementCliffYr: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <AreaChart data={data} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="grad-projected" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.7} />
            <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="grad-baseline" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#a855f7" stopOpacity={0.5} />
            <stop offset="100%" stopColor="#a855f7" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="grad-collapse" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fb7185" stopOpacity={0.45} />
            <stop offset="100%" stopColor="#fb7185" stopOpacity={0} />
          </linearGradient>
        </defs>

        <CartesianGrid strokeDasharray="3 6" stroke="rgba(96,165,250,0.08)" />
        <XAxis
          dataKey="age"
          tickLine={false}
          axisLine={{ stroke: "rgba(120,144,192,0.15)" }}
          tick={{ fill: "rgba(160,180,220,0.7)", fontSize: 11 }}
        />
        <YAxis
          tickLine={false}
          axisLine={{ stroke: "rgba(120,144,192,0.15)" }}
          tick={{ fill: "rgba(160,180,220,0.7)", fontSize: 11 }}
          tickFormatter={(v: number) =>
            v >= 1_000_000
              ? `$${(v / 1_000_000).toFixed(0)}M`
              : `$${(v / 1000).toFixed(0)}K`
          }
        />
        <Tooltip
          content={(p) => <RiskTooltip {...p} />}
          cursor={{
            stroke: "rgba(0,229,255,0.45)",
            strokeWidth: 1,
            strokeDasharray: "3 3",
          }}
        />
        <Legend
          wrapperStyle={{
            fontFamily: "var(--font-geist-mono, ui-monospace)",
            fontSize: 10,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "rgba(160,180,220,0.7)",
            paddingTop: 12,
          }}
          iconType="plainline"
        />
        <ReferenceLine
          x={retirementCliffYr}
          stroke="rgba(251,113,133,0.6)"
          strokeDasharray="2 4"
          label={{
            value: "Retire cliff",
            fill: "#fda4af",
            fontSize: 10,
            fontFamily: "monospace",
            position: "insideTopRight",
          }}
        />
        <Area
          type="monotone"
          name="Cohort baseline"
          dataKey="baseline"
          stroke="#c4b5fd"
          strokeWidth={1.5}
          strokeDasharray="4 4"
          fill="url(#grad-baseline)"
          isAnimationActive
          animationDuration={650}
        />
        <Area
          type="monotone"
          name="Collapse scenario"
          dataKey="collapse"
          stroke="#fb7185"
          strokeWidth={1.5}
          strokeDasharray="2 4"
          fill="url(#grad-collapse)"
          isAnimationActive
          animationDuration={650}
        />
        <Area
          type="monotone"
          name="ATHLIX projected"
          dataKey="projected"
          stroke="#22d3ee"
          strokeWidth={2.2}
          fill="url(#grad-projected)"
          isAnimationActive
          animationDuration={650}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
