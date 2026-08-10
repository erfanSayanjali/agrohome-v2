import { cn } from "@/lib/utils";

export function Badge({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<"span"> & { variant?: "default" | "accent" | "muted" | "danger" | "success" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium",
        variant === "default" && "bg-white/10 text-[var(--admin-text)]",
        variant === "accent" && "bg-[var(--admin-accent)]/20 text-[var(--admin-accent)]",
        variant === "muted" && "bg-white/5 text-[var(--admin-muted)]",
        variant === "danger" && "bg-[var(--admin-danger)]/20 text-[var(--admin-danger)]",
        variant === "success" && "bg-[var(--admin-success)]/20 text-[var(--admin-success)]",
        className
      )}
      {...props}
    />
  );
}
