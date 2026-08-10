import { cn } from "@/lib/utils";

export function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-[var(--admin-radius-sm)] bg-white/8",
        className
      )}
      {...props}
    />
  );
}
