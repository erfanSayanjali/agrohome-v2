"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ServerQueryState } from "@/lib/use-server-query";
import type { ColumnFilterDef, FilterValue } from "@/lib/table-filters";
import { formatFilterChip, isFilterActive } from "@/lib/table-filters";

export type FilterDef = {
  key: string;
  label: string;
  options: { value: string; label: string }[];
};

export type SortOption = { value: string; label: string };

export type ActiveFilterMeta = {
  key: string;
  label: string;
  type?: ColumnFilterDef["type"];
  options?: ColumnFilterDef["options"];
};

type DataToolbarProps = {
  state: ServerQueryState;
  onChange: (
    patch: Partial<ServerQueryState>,
    options?: { resetPage?: boolean }
  ) => void;
  searchPlaceholder?: string;
  sortOptions?: SortOption[];
  /** فیلترهای سراسری toolbar (اختیاری؛ ترجیح با فیلتر ستونی) */
  filters?: FilterDef[];
  /** متادیتای فیلترهای فعال ستونی برای نمایش چیپ */
  filterMeta?: ActiveFilterMeta[];
  actions?: React.ReactNode;
};

export function DataToolbar({
  state,
  onChange,
  searchPlaceholder = "جستجو…",
  sortOptions,
  filters,
  filterMeta,
  actions,
}: DataToolbarProps) {
  const [localSearch, setLocalSearch] = useState(state.search);

  useEffect(() => {
    setLocalSearch(state.search);
  }, [state.search]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (localSearch !== state.search) {
        onChange({ search: localSearch }, { resetPage: true });
      }
    }, 350);
    return () => clearTimeout(t);
  }, [localSearch, state.search, onChange]);

  const activeChips = useMemo(() => {
    const chips: { key: string; text: string }[] = [];
    const metaByKey = new Map((filterMeta || []).map((m) => [m.key, m]));
    for (const [key, value] of Object.entries(state.filters)) {
      if (!isFilterActive(value)) continue;
      const meta = metaByKey.get(key);
      const toolbar = filters?.find((f) => f.key === key);
      const label = meta?.label || toolbar?.label || key;
      const type = meta?.type || (toolbar ? "select" : "text");
      const options = meta?.options || toolbar?.options;
      chips.push({
        key,
        text: formatFilterChip(label, value, options, type),
      });
    }
    return chips;
  }, [state.filters, filterMeta, filters]);

  function clearFilter(key: string) {
    const next = { ...state.filters };
    delete next[key];
    onChange({ filters: next }, { resetPage: true });
  }

  function clearAllFilters() {
    onChange({ filters: {} }, { resetPage: true });
  }

  return (
    <div className="mb-4 flex flex-col gap-3">
      <div className="flex flex-wrap items-end gap-3">
        <FormField label="جستجو" htmlFor="toolbar-search" className="min-w-[14rem] flex-1">
          <div className="relative">
            <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--admin-muted)]" />
            <Input
              id="toolbar-search"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder={searchPlaceholder}
              className="ps-9"
            />
          </div>
        </FormField>

        {sortOptions?.length ? (
          <FormField label="مرتب‌سازی" className="w-44">
            <Select
              value={state.sort}
              onValueChange={(value) => onChange({ sort: value }, { resetPage: true })}
            >
              <SelectTrigger aria-label="مرتب‌سازی">
                <SelectValue placeholder="مرتب‌سازی" />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
        ) : null}

        {filters?.map((filter) => (
          <FormField key={filter.key} label={filter.label} className="w-44">
            <Select
              value={
                state.filters[filter.key] === undefined || state.filters[filter.key] === ""
                  ? "__all__"
                  : String(state.filters[filter.key])
              }
              onValueChange={(value) => {
                const next: Record<string, FilterValue> = { ...state.filters };
                if (value === "__all__") delete next[filter.key];
                else next[filter.key] = value;
                onChange({ filters: next }, { resetPage: true });
              }}
            >
              <SelectTrigger aria-label={filter.label}>
                <SelectValue placeholder={filter.label} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">همه</SelectItem>
                {filter.options.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
        ))}

        {actions ? <div className="ms-auto flex items-center gap-2 pb-0.5">{actions}</div> : null}
      </div>

      {activeChips.length ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-[var(--admin-muted)]">فیلترهای فعال:</span>
          {activeChips.map((chip) => (
            <button
              key={chip.key}
              type="button"
              className="inline-flex items-center gap-1 rounded-full border border-[var(--admin-accent)]/40 bg-[var(--admin-accent)]/10 px-2.5 py-1 text-xs text-[var(--admin-accent)] transition-colors hover:bg-[var(--admin-accent)]/20"
              onClick={() => clearFilter(chip.key)}
              title="حذف فیلتر"
            >
              {chip.text}
              <X className="h-3 w-3" />
            </button>
          ))}
          <Button type="button" size="sm" variant="ghost" onClick={clearAllFilters}>
            پاک‌سازی همه
          </Button>
        </div>
      ) : null}
    </div>
  );
}
