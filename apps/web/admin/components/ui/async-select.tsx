"use client";

import * as React from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { RemoveScroll } from "react-remove-scroll";
import { Check, ChevronsUpDown, Loader2, Search, X } from "lucide-react";
import type { ListResponse } from "@agrohome/shared";
import { apiGet, unwrapList } from "@/lib/api";
import { cn, formatFaNumber } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type AsyncSelectOption = {
  value: string;
  label: string;
  meta?: string;
};

type AsyncSelectProps = {
  path: string;
  value?: string;
  onChange: (value: string, option?: AsyncSelectOption) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  mapItem: (item: Record<string, unknown>) => AsyncSelectOption;
  filters?: Record<string, unknown>;
  sort?: string;
  limit?: number;
  className?: string;
  disabled?: boolean;
  selectedLabel?: string;
  /** امکان خالی کردن انتخاب */
  allowClear?: boolean;
  /** شناسه‌هایی که نباید در لیست باشند (مثلاً خود رکورد و فرزندانش) */
  excludeValues?: string[];
};

export function AsyncSelect({
  path,
  value,
  onChange,
  placeholder = "انتخاب کنید",
  searchPlaceholder = "جستجو…",
  emptyText = "موردی یافت نشد",
  mapItem,
  filters,
  sort = "title",
  limit = 8,
  className,
  disabled,
  selectedLabel,
  allowClear = false,
  excludeValues,
}: AsyncSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [q, setQ] = React.useState("");
  const [debounced, setDebounced] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [loading, setLoading] = React.useState(false);
  const [options, setOptions] = React.useState<AsyncSelectOption[]>([]);
  const [total, setTotal] = React.useState(0);
  const [totalPages, setTotalPages] = React.useState(1);
  const [labelCache, setLabelCache] = React.useState<Record<string, string>>({});
  const mapRef = React.useRef(mapItem);
  mapRef.current = mapItem;
  const filtersKey = JSON.stringify(filters ?? {});
  const excludeKey = JSON.stringify(excludeValues ?? []);
  const excludeSet = React.useMemo(
    () => new Set((excludeValues || []).filter(Boolean)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [excludeKey]
  );

  React.useEffect(() => {
    if (selectedLabel && value) {
      setLabelCache((prev) => ({ ...prev, [value]: selectedLabel }));
    }
  }, [selectedLabel, value]);

  React.useEffect(() => {
    const t = setTimeout(() => setDebounced(q.trim()), 320);
    return () => clearTimeout(t);
  }, [q]);

  React.useEffect(() => {
    setPage(1);
  }, [debounced, path, filtersKey]);

  React.useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    apiGet<ListResponse<Record<string, unknown>>>(path, {
      page,
      limit,
      search: debounced || undefined,
      sort,
      filters: filters && Object.keys(filters).length ? JSON.stringify(filters) : undefined,
    })
      .then((res) => {
        if (cancelled) return;
        const data = unwrapList(res);
        const mapped = data.content
          .map((item) => mapRef.current(item))
          .filter((opt) => !excludeSet.has(opt.value));
        setOptions(mapped);
        setTotal(data.total);
        setTotalPages(data.meta.totalPages);
        setLabelCache((prev) => {
          const next = { ...prev };
          for (const opt of mapped) next[opt.value] = opt.label;
          return next;
        });
      })
      .catch(() => {
        if (!cancelled) {
          setOptions([]);
          setTotal(0);
          setTotalPages(1);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, path, page, limit, debounced, filtersKey, sort, filters, excludeSet]);

  const display =
    (value && labelCache[value]) || selectedLabel || (value ? value : "") || placeholder;

  return (
    <PopoverPrimitive.Root
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          setQ("");
          setDebounced("");
          setPage(1);
        }
      }}
    >
      <div className={cn("flex w-full items-center gap-1", className)}>
        <PopoverPrimitive.Trigger asChild>
          <Button
            type="button"
            variant="field"
            role="combobox"
            disabled={disabled}
            aria-expanded={open}
            className="min-w-0 flex-1 justify-between text-start"
          >
            <span className={cn("truncate", !value && "text-[var(--admin-muted)]")}>
              {value ? display : placeholder}
            </span>
            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-60" />
          </Button>
        </PopoverPrimitive.Trigger>
        {allowClear && value && !disabled ? (
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-10 w-10 shrink-0"
            aria-label="پاک کردن انتخاب"
            onClick={() => onChange("", undefined)}
          >
            <X className="h-4 w-4" />
          </Button>
        ) : null}
      </div>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="start"
          dir="rtl"
          onOpenAutoFocus={(e) => e.preventDefault()}
          onCloseAutoFocus={(e) => e.preventDefault()}
          className="z-[70] w-[var(--radix-popover-trigger-width)] min-w-[17rem] overflow-hidden rounded-[var(--admin-radius)] border border-[var(--admin-border)] bg-[var(--admin-surface)] p-2 shadow-[var(--admin-shadow)]"
        >
          <RemoveScroll allowPinchZoom enabled={open} removeScrollBar={false}>
            <div className="relative mb-2">
              <Search className="pointer-events-none absolute start-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--admin-muted)]" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={searchPlaceholder}
                className="h-9 ps-8"
                autoFocus
              />
            </div>

            <div
              className="max-h-56 overflow-y-auto overscroll-contain"
              onWheel={(e) => e.stopPropagation()}
              onTouchMove={(e) => e.stopPropagation()}
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2 py-8 text-sm text-[var(--admin-muted)]">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  در حال بارگذاری…
                </div>
              ) : options.length === 0 ? (
                <p className="px-2 py-6 text-center text-sm text-[var(--admin-muted)]">{emptyText}</p>
              ) : (
                <ul className="space-y-0.5">
                  {options.map((opt) => {
                    const selected = value === opt.value;
                    return (
                      <li key={opt.value}>
                        <button
                          type="button"
                          className={cn(
                            "flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-start text-sm transition-colors",
                            selected
                              ? "bg-[var(--admin-accent)]/15 text-[var(--admin-accent)]"
                              : "hover:bg-white/8"
                          )}
                          onClick={() => {
                            onChange(opt.value, opt);
                            setLabelCache((prev) => ({ ...prev, [opt.value]: opt.label }));
                            setOpen(false);
                          }}
                        >
                          <span className="min-w-0">
                            <span className="block truncate font-medium">{opt.label}</span>
                            {opt.meta ? (
                              <span className="block truncate text-xs text-[var(--admin-muted)]">
                                {opt.meta}
                              </span>
                            ) : null}
                          </span>
                          {selected ? <Check className="h-4 w-4 shrink-0" /> : null}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {!loading && totalPages > 1 ? (
              <div className="mt-2 flex items-center justify-between gap-2 border-t border-[var(--admin-border)] pt-2 text-xs text-[var(--admin-muted)]">
                <span>
                  صفحه {formatFaNumber(page)} از {formatFaNumber(totalPages)} · {formatFaNumber(total)}
                </span>
                <div className="flex gap-1">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    قبل
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    بعد
                  </Button>
                </div>
              </div>
            ) : null}
          </RemoveScroll>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
