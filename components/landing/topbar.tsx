"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Hexagon, Radar, ShieldAlert } from "lucide-react";

export function TopBar() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/5 bg-[#03050f]/70 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-[1600px] items-center gap-4 px-6">
        <Link href="/" className="group flex items-center gap-2.5">
          <motion.div
            initial={{ rotate: 0 }}
            animate={{ rotate: 360 }}
            transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
            className="relative"
          >
            <Hexagon
              className="h-6 w-6 text-cyan-300"
              strokeWidth={1.4}
              fill="rgba(0,229,255,0.08)"
            />
            <Hexagon
              className="absolute inset-0 h-6 w-6 text-violet-400 opacity-70"
              strokeWidth={1.2}
              style={{ transform: "rotate(30deg)" }}
            />
          </motion.div>
          <div className="flex items-baseline gap-2">
            <span className="text-base font-semibold tracking-[0.34em] text-holographic">
              ATHLIX
            </span>
            <span className="font-mono text-[10px] text-cyan-300/70 tracking-[0.32em]">
              AI
            </span>
          </div>
        </Link>

        <span className="mx-2 h-5 w-px bg-white/10" />

        <nav className="hidden md:flex items-center gap-1 text-[11px] font-mono uppercase tracking-[0.22em] text-slate-400">
          <span className="rounded-md bg-white/[0.04] border border-white/10 px-2.5 py-1 text-cyan-200">
            Terminal
          </span>
          <span className="rounded-md px-2.5 py-1 hover:text-cyan-200 cursor-default">
            Risk Engine
          </span>
          <span className="rounded-md px-2.5 py-1 hover:text-cyan-200 cursor-default">
            Wealth Models
          </span>
          <span className="rounded-md px-2.5 py-1 hover:text-cyan-200 cursor-default">
            Cohort Index
          </span>
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 rounded-md border border-emerald-400/20 bg-emerald-400/5 px-2.5 py-1">
            <span className="status-dot" />
            <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-emerald-200">
              ENGINE ONLINE
            </span>
          </div>
          <div className="flex items-center gap-2 rounded-md border border-amber-400/20 bg-amber-400/5 px-2.5 py-1">
            <ShieldAlert className="h-3 w-3 text-amber-300" />
            <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-amber-200">
              5 CRITICAL
            </span>
          </div>
          <div className="hidden md:flex items-center gap-2 rounded-md border border-cyan-400/20 bg-cyan-400/5 px-2.5 py-1">
            <Radar className="h-3 w-3 text-cyan-300" />
            <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-cyan-200">
              v0.9.4 · MVP
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
