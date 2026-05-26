import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[10px] font-mono uppercase tracking-[0.18em] transition-colors",
  {
    variants: {
      variant: {
        default: "border-cyan-400/40 bg-cyan-400/10 text-cyan-200",
        violet: "border-violet-400/40 bg-violet-400/10 text-violet-200",
        emerald: "border-emerald-400/40 bg-emerald-400/10 text-emerald-200",
        amber: "border-amber-400/40 bg-amber-400/10 text-amber-200",
        rose: "border-rose-400/50 bg-rose-500/10 text-rose-200",
        soft: "border-white/10 bg-white/5 text-slate-300",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
