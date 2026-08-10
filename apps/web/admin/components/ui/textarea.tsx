import * as React from "react";
import { cn } from "@/lib/utils";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, dir, ...props }, ref) => {
  const resolvedDir = dir ?? "rtl";
  return (
    <textarea
      {...props}
      ref={ref}
      dir={resolvedDir}
      className={cn(
        "flex min-h-[96px] w-full rounded-[var(--admin-radius-sm)] border border-[var(--admin-border)] bg-[var(--admin-bg-elevated)] px-3 py-2 text-sm text-[var(--admin-text)] placeholder:text-[var(--admin-muted)] disabled:cursor-not-allowed disabled:opacity-50",
        resolvedDir === "ltr" ? "text-left" : "text-right",
        className
      )}
    />
  );
});
Textarea.displayName = "Textarea";
