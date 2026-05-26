"use client";

import type { TooltipContentProps } from "recharts";
import type {
  ValueType,
  NameType,
} from "recharts/types/component/DefaultTooltipContent";
import { formatCurrency } from "@/lib/utils";

type Payload = {
  baseline?: number;
  projected?: number;
  collapse?: number;
  retirement?: number;
};

/**
 * Custom cinematic Recharts tooltip.
 * Strongly typed against AI SDK / Recharts TooltipContentProps generics.
 */
export function RiskTooltip(props: TooltipContentProps<ValueType, NameType>) {
  const { active, payload, label } = props;
  if (!active || !payload || payload.length === 0) return null;

  const p = (payload[0]?.payload ?? {}) as Payload;
  const projected = p.projected ?? 0;
  const baseline = p.baseline ?? 0;
  const collapse = p.collapse ?? 0;
  const retirement = p.retirement ?? 0;

  const delta = baseline === 0 ? 0 : ((projected - baseline) / baseline) * 100;
  const collapseProb = baseline === 0 ? 0 : ((baseline - collapse) / baseline) * 100;

  return (
    <div className="glass-card-strong neon-border-cyan relative min-w-[230px] px-3.5 py-3 font-mono text-[11px]">
      <div className="flex items-center justify-between gap-3 pb-2 border-b border-white/10">
        <span className="uppercase tracking-[0.22em] text-cyan-300/80">
          Age {label}
        </span>
        <span className="status-dot" />
      </div>
      <div className="mt-2 space-y-1.5">
        <Row
          label="Projected wealth"
          value={formatCurrency(projected, { compact: true })}
          tone="cyan"
        />
        <Row
          label="Cohort baseline"
          value={formatCurrency(baseline, { compact: true })}
          tone="violet"
        />
        <Row
          label="Δ vs. cohort"
          value={`${delta >= 0 ? "+" : ""}${delta.toFixed(1)}%`}
          tone={delta >= 0 ? "emerald" : "rose"}
        />
        <Row
          label="Collapse probability"
          value={`${Math.max(0, collapseProb).toFixed(1)}%`}
          tone="rose"
        />
        <Row
          label="Retirement income"
          value={formatCurrency(retirement, { compact: true })}
          tone="amber"
        />
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "cyan" | "violet" | "emerald" | "rose" | "amber";
}) {
  const colorMap: Record<string, string> = {
    cyan: "text-cyan-200",
    violet: "text-violet-200",
    emerald: "text-emerald-200",
    rose: "text-rose-200",
    amber: "text-amber-200",
  };
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-slate-400 uppercase tracking-[0.18em] text-[9px]">
        {label}
      </span>
      <span className={`${colorMap[tone]} tabular-nums`}>{value}</span>
    </div>
  );
}
