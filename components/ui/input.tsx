import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, type, ...props }, ref) => (
  <input
    type={type}
    ref={ref}
    className={cn(
      "flex h-11 w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2",
      "text-sm text-slate-100 placeholder:text-slate-500",
      "transition-all duration-200",
      "focus-visible:outline-none focus-visible:border-cyan-400/60",
      "focus-visible:bg-white/[0.06]",
      "focus-visible:shadow-[0_0_0_4px_rgba(0,229,255,0.08),0_0_28px_-6px_rgba(0,229,255,0.45)]",
      "disabled:cursor-not-allowed disabled:opacity-50",
      "font-mono tracking-wide",
      className,
    )}
    {...props}
  />
));
Input.displayName = "Input";
