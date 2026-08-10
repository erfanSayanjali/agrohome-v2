"use client";

import { ChevronDown, ChevronLeft } from "lucide-react";
import { cn, formatFaNumber } from "@/lib/utils";

type TreeTitleProps = {
  depth: number;
  hasChildren: boolean;
  expanded: boolean;
  childCount?: number;
  onToggle?: () => void;
  children: React.ReactNode;
  className?: string;
};

export function TreeTitle({
  depth,
  hasChildren,
  expanded,
  childCount = 0,
  onToggle,
  children,
  className,
}: TreeTitleProps) {
  return (
    <div
      className={cn("flex min-w-0 items-center gap-1.5", className)}
      style={{ paddingInlineStart: `${depth * 1.15}rem` }}
    >
      {hasChildren ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggle?.();
          }}
          className={cn(
            "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md",
            "text-[var(--admin-muted)] transition-colors",
            "hover:bg-[var(--admin-accent)]/10 hover:text-[var(--admin-accent)]"
          )}
          aria-label={expanded ? "بستن زیرشاخه‌ها" : "باز کردن زیرشاخه‌ها"}
          aria-expanded={expanded}
        >
          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      ) : (
        <span
          className="inline-flex h-7 w-7 shrink-0 items-center justify-center"
          aria-hidden
        >
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--admin-border)]" />
        </span>
      )}

      <div className="min-w-0 flex-1">
        <div className="truncate font-medium">{children}</div>
      </div>

      {hasChildren ? (
        <span className="shrink-0 rounded-md bg-white/6 px-1.5 py-0.5 text-[10px] tabular-nums text-[var(--admin-muted)]">
          {formatFaNumber(childCount)}
        </span>
      ) : null}
    </div>
  );
}
