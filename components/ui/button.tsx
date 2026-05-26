import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium tracking-wide transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050816] disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "glow-button hover:[box-shadow:inset_0_1px_0_rgba(255,255,255,0.35),0_16px_44px_-12px_rgba(0,229,255,0.7),0_10px_30px_-8px_rgba(168,85,247,0.7)] hover:brightness-110 hover:-translate-y-px",
        outline:
          "border border-cyan-400/30 bg-cyan-500/[0.04] text-cyan-200 hover:bg-cyan-500/10 hover:border-cyan-400/60 hover:[text-shadow:0_0_12px_rgba(0,229,255,0.6)]",
        ghost:
          "text-slate-300 hover:bg-white/5 hover:text-cyan-200",
        danger:
          "bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-[0_10px_30px_-10px_rgba(251,113,133,0.7)] hover:brightness-110 hover:-translate-y-px",
        soft:
          "bg-white/[0.04] text-slate-200 border border-white/10 hover:bg-white/[0.08] hover:border-cyan-400/30",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-8 px-3 text-xs",
        lg: "h-12 px-7 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size }), className)}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { buttonVariants };
