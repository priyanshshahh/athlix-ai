"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Activity,
  Calendar,
  HeartPulse,
  Wallet,
  FileSignature,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import type { SimulatorInputs } from "@/lib/mock-engine";

const PRESETS: Array<{
  id: string;
  label: string;
  description: string;
  inputs: SimulatorInputs;
  tone: "rose" | "amber" | "cyan" | "emerald";
}> = [
  {
    id: "collapse",
    label: "Collapse Scenario",
    description: "Severe injury, contract expiry, exposure spike",
    inputs: { age: 30, injurySeverity: 92, contractDurationYrs: 1, salaryExposure: 84 },
    tone: "rose",
  },
  {
    id: "fragile",
    label: "Fragile Star",
    description: "Elite production, recurring injuries",
    inputs: { age: 27, injurySeverity: 70, contractDurationYrs: 3, salaryExposure: 65 },
    tone: "amber",
  },
  {
    id: "rebound",
    label: "Rebound Path",
    description: "Recovery underway, stable contract",
    inputs: { age: 25, injurySeverity: 38, contractDurationYrs: 4, salaryExposure: 48 },
    tone: "cyan",
  },
  {
    id: "blue-chip",
    label: "Blue Chip",
    description: "Cohort-leading durability",
    inputs: { age: 24, injurySeverity: 18, contractDurationYrs: 5, salaryExposure: 38 },
    tone: "emerald",
  },
];

export function Simulator({
  inputs,
  setInputs,
  defaults,
}: {
  inputs: SimulatorInputs;
  setInputs: (i: SimulatorInputs) => void;
  defaults: SimulatorInputs;
}) {
  const setOne = <K extends keyof SimulatorInputs>(
    key: K,
    value: SimulatorInputs[K],
  ) => setInputs({ ...inputs, [key]: value });

  return (
    <div className="glass-card relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 grid-overlay-fine opacity-40" />
      <div className="relative flex items-center justify-between border-b border-white/5 px-5 py-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-cyan-300" />
          <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-cyan-300/80">
            Scenario Simulator
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setInputs(defaults)}
          className="text-[10px] uppercase tracking-[0.22em]"
        >
          <RotateCcw className="h-3 w-3" />
          Reset
        </Button>
      </div>

      <div className="relative grid gap-5 p-5">
        <ControlRow
          icon={<Calendar className="h-4 w-4 text-cyan-300" />}
          label="Age"
          value={`${inputs.age} yr`}
        >
          <Slider
            value={[inputs.age]}
            min={20}
            max={42}
            step={1}
            onValueChange={(v) => setOne("age", v[0])}
          />
        </ControlRow>

        <ControlRow
          icon={<HeartPulse className="h-4 w-4 text-rose-300" />}
          label="Injury Severity"
          value={`${inputs.injurySeverity}%`}
        >
          <Slider
            value={[inputs.injurySeverity]}
            min={0}
            max={100}
            step={1}
            onValueChange={(v) => setOne("injurySeverity", v[0])}
          />
        </ControlRow>

        <ControlRow
          icon={<FileSignature className="h-4 w-4 text-violet-300" />}
          label="Contract Duration"
          value={`${inputs.contractDurationYrs} yr`}
        >
          <Slider
            value={[inputs.contractDurationYrs]}
            min={1}
            max={7}
            step={1}
            onValueChange={(v) => setOne("contractDurationYrs", v[0])}
          />
        </ControlRow>

        <ControlRow
          icon={<Wallet className="h-4 w-4 text-amber-300" />}
          label="Salary Exposure"
          value={`${inputs.salaryExposure}%`}
        >
          <Slider
            value={[inputs.salaryExposure]}
            min={0}
            max={100}
            step={1}
            onValueChange={(v) => setOne("salaryExposure", v[0])}
          />
        </ControlRow>

        <div className="mt-1 border-t border-white/5 pt-4">
          <div className="mb-2 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.32em] text-cyan-300/80">
            <Activity className="h-3 w-3" />
            Stress Presets
          </div>
          <div className="grid grid-cols-2 gap-2">
            {PRESETS.map((p) => (
              <motion.button
                key={p.id}
                whileTap={{ scale: 0.96 }}
                onClick={() => setInputs(p.inputs)}
                className={`group relative rounded-lg border border-white/10 bg-white/[0.03] p-2.5 text-left transition hover:bg-white/[0.06] hover:border-cyan-400/30`}
              >
                <div className="flex items-center justify-between">
                  <span className={`font-mono text-[10px] uppercase tracking-[0.22em] ${toneText(p.tone)}`}>
                    {p.label}
                  </span>
                  <span className={`h-1.5 w-1.5 rounded-full ${toneBg(p.tone)} shadow-[0_0_10px_currentColor]`} />
                </div>
                <div className="mt-1 text-[10px] text-slate-400 leading-tight">
                  {p.description}
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ControlRow({
  icon,
  label,
  value,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-slate-300">
          {icon}
          {label}
        </div>
        <span className="font-mono text-xs tabular-nums text-cyan-200">{value}</span>
      </div>
      {children}
    </div>
  );
}

function toneText(t: "rose" | "amber" | "cyan" | "emerald"): string {
  if (t === "rose") return "text-rose-200";
  if (t === "amber") return "text-amber-200";
  if (t === "cyan") return "text-cyan-200";
  return "text-emerald-200";
}
function toneBg(t: "rose" | "amber" | "cyan" | "emerald"): string {
  if (t === "rose") return "bg-rose-300";
  if (t === "amber") return "bg-amber-300";
  if (t === "cyan") return "bg-cyan-300";
  return "bg-emerald-300";
}
