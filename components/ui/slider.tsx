"use client";

import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { cn } from "@/lib/utils";

export const Slider = React.forwardRef<
  React.ComponentRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex w-full touch-none select-none items-center",
      className,
    )}
    {...props}
  >
    <SliderPrimitive.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-white/[0.06] border border-white/5">
      <SliderPrimitive.Range className="absolute h-full bg-gradient-to-r from-cyan-400 via-sky-400 to-violet-400 shadow-[0_0_18px_rgba(0,229,255,0.55)]" />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb
      className={cn(
        "block h-4 w-4 rounded-full border-2 border-cyan-300",
        "bg-gradient-to-br from-cyan-200 to-violet-300",
        "shadow-[0_0_18px_rgba(0,229,255,0.85),inset_0_0_4px_rgba(255,255,255,0.4)]",
        "transition-all duration-150 hover:scale-110",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60",
        "disabled:pointer-events-none disabled:opacity-50",
      )}
    />
  </SliderPrimitive.Root>
));
Slider.displayName = "Slider";
