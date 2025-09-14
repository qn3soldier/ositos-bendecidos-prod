import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-semibold ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-95 transform-gpu",
  {
    variants: {
      variant: {
        default: [
          "bg-gradient-to-r from-zinc-900 to-zinc-800",
          "border border-zinc-700/50",
          "text-zinc-100",
          "shadow-[0_0_20px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.1)]",
          "backdrop-blur-xl",
          "hover:from-zinc-800 hover:to-zinc-700",
          "hover:border-zinc-600/50",
          "hover:shadow-[0_0_30px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.15)]",
          "hover:scale-105"
        ],
        gold: [
          "bg-gradient-to-r from-yellow-500 to-amber-500",
          "border border-yellow-400/30",
          "text-black font-bold",
          "shadow-[0_0_25px_rgba(245,158,11,0.3),inset_0_1px_0_rgba(255,255,255,0.2)]",
          "backdrop-blur-xl",
          "hover:from-yellow-400 hover:to-amber-400",
          "hover:border-yellow-300/50",
          "hover:shadow-[0_0_35px_rgba(245,158,11,0.5),inset_0_1px_0_rgba(255,255,255,0.3)]",
          "hover:scale-105"
        ],
        glass: [
          "bg-gradient-to-r from-white/10 to-white/5",
          "border border-white/20",
          "text-white",
          "shadow-[0_8px_32px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.1)]",
          "backdrop-blur-2xl backdrop-saturate-150",
          "hover:from-white/15 hover:to-white/10",
          "hover:border-white/30",
          "hover:shadow-[0_12px_40px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.15)]",
          "hover:scale-105"
        ],
        outline: [
          "border-2 border-zinc-700",
          "bg-transparent",
          "text-zinc-300",
          "hover:bg-zinc-800/50",
          "hover:border-zinc-600",
          "hover:text-white",
          "hover:scale-105"
        ]
      },
      size: {
        default: "h-12 px-6 py-3",
        sm: "h-10 px-4 py-2 text-xs",
        lg: "h-14 px-8 py-4 text-base",
        xl: "h-16 px-10 py-5 text-lg"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
