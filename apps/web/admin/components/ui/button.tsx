import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[var(--admin-radius-sm)] text-sm font-semibold transition-colors disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-[var(--admin-accent)] text-[var(--admin-accent-fg)] hover:brightness-105",
        secondary:
          "bg-[var(--admin-surface-2)] text-[var(--admin-text)] border border-[var(--admin-border)] hover:bg-[var(--admin-surface)]",
        ghost: "hover:bg-white/5 text-[var(--admin-text)]",
        outline:
          "border border-[var(--admin-border)] bg-transparent hover:border-[var(--admin-border-strong)]",
        field:
          "border border-[var(--admin-border)] bg-[var(--admin-bg-elevated)] font-normal text-[var(--admin-text)] hover:border-[var(--admin-border-strong)] hover:bg-[var(--admin-bg-elevated)]",
        danger: "bg-[var(--admin-danger)] text-white hover:brightness-110",
        link: "text-[var(--admin-accent)] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-11 px-6",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
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
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  }
);
Button.displayName = "Button";

export { buttonVariants };
