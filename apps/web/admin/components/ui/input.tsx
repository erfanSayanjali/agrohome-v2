import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, dir, ...props }, ref) => {
    const resolvedDir = dir ?? "rtl";
    return (
      <input
        {...props}
        type={type}
        ref={ref}
        dir={resolvedDir}
        className={cn(
          "flex h-10 w-full rounded-[var(--admin-radius-sm)] border border-[var(--admin-border)] bg-[var(--admin-bg-elevated)] px-3 py-2 text-sm text-[var(--admin-text)] placeholder:text-[var(--admin-muted)] disabled:cursor-not-allowed disabled:opacity-50",
          resolvedDir === "ltr" ? "text-left" : "text-right",
          className
        )}
      />
    );
  }
);
Input.displayName = "Input";
