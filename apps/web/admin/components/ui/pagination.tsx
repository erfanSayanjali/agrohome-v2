"use client";

import { useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, List, StretchVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, formatFaNumber } from "@/lib/utils";
import {
  usePaginationMode,
  type PaginationMode,
} from "@/lib/pagination-mode";

type PaginationProps = {
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
  /** نمایش سوییچ حالت صفحه‌بندی؛ پیش‌فرض true */
  showModeSwitch?: boolean;
  mode?: PaginationMode;
  loadingMore?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  /** تعداد ردیف‌های لودشده (برای infinite) */
  loadedCount?: number;
  /** اگر false باشد sentinel داخلی ساخته نمی‌شود (مثلاً وقتی جدول خودش observe می‌کند) */
  observeSentinel?: boolean;
};

function ModeSwitch({
  mode,
  onChange,
}: {
  mode: PaginationMode;
  onChange: (mode: PaginationMode) => void;
}) {
  return (
    <div
      className="inline-flex items-center rounded-md border border-[var(--admin-border)] p-0.5"
      role="group"
      aria-label="حالت صفحه‌بندی"
    >
      <button
        type="button"
        className={cn(
          "inline-flex h-7 items-center gap-1.5 rounded px-2 text-xs transition-colors",
          mode === "classic"
            ? "bg-[var(--admin-accent)]/15 text-[var(--admin-accent)]"
            : "text-[var(--admin-muted)] hover:text-[var(--admin-text)]"
        )}
        aria-pressed={mode === "classic"}
        onClick={() => onChange("classic")}
      >
        <List className="h-3.5 w-3.5" />
        صفحه‌بندی
      </button>
      <button
        type="button"
        className={cn(
          "inline-flex h-7 items-center gap-1.5 rounded px-2 text-xs transition-colors",
          mode === "infinite"
            ? "bg-[var(--admin-accent)]/15 text-[var(--admin-accent)]"
            : "text-[var(--admin-muted)] hover:text-[var(--admin-text)]"
        )}
        aria-pressed={mode === "infinite"}
        onClick={() => onChange("infinite")}
      >
        <StretchVertical className="h-3.5 w-3.5" />
        اسکرول
      </button>
    </div>
  );
}

export function Pagination({
  page,
  totalPages,
  total,
  onPageChange,
  showModeSwitch = true,
  mode: modeProp,
  loadingMore = false,
  hasMore = false,
  onLoadMore,
  loadedCount,
  observeSentinel = true,
}: PaginationProps) {
  const [storedMode, setMode] = usePaginationMode();
  const mode = modeProp ?? storedMode;
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!observeSentinel) return;
    if (mode !== "infinite" || !hasMore || !onLoadMore || loadingMore) return;
    const node = sentinelRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) onLoadMore();
      },
      { root: null, rootMargin: "320px 0px", threshold: 0 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [mode, hasMore, onLoadMore, loadingMore, loadedCount, observeSentinel]);

  const shown = loadedCount ?? total;

  return (
    <div className="flex flex-col gap-2 px-1 py-3 text-sm text-[var(--admin-muted)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span>
          {mode === "infinite" ? (
            total > 0 ? (
              <>
                نمایش {formatFaNumber(Math.min(shown, total))} از {formatFaNumber(total)} مورد
              </>
            ) : (
              <>{formatFaNumber(0)} مورد</>
            )
          ) : totalPages > 1 ? (
            <>
              صفحه {formatFaNumber(page)} از {formatFaNumber(totalPages)} ·{" "}
              {formatFaNumber(total)} مورد
            </>
          ) : (
            <>{formatFaNumber(total)} مورد</>
          )}
        </span>

        <div className="flex flex-wrap items-center gap-2">
          {showModeSwitch ? <ModeSwitch mode={mode} onChange={setMode} /> : null}

          {mode === "classic" && totalPages > 1 ? (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => onPageChange(page - 1)}
                aria-label="صفحه قبل"
              >
                <ChevronRight className="h-4 w-4" />
                قبل
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => onPageChange(page + 1)}
                aria-label="صفحه بعد"
              >
                بعد
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </>
          ) : null}

          {mode === "infinite" && hasMore ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={loadingMore}
              onClick={() => onLoadMore?.()}
            >
              {loadingMore ? "در حال بارگذاری…" : "بارگذاری بیشتر"}
            </Button>
          ) : null}
        </div>
      </div>

      {observeSentinel && mode === "infinite" && (hasMore || loadingMore) ? (
        <div ref={sentinelRef} className="h-1 w-full" aria-hidden />
      ) : null}
    </div>
  );
}
