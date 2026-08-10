"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { FilterValue } from "@/lib/table-filters";
import { isFilterActive } from "@/lib/table-filters";

export type ServerQueryState = {
  page: number;
  limit: number;
  sort: string;
  search: string;
  filters: Record<string, FilterValue>;
};

function parseFilters(raw: string | null): Record<string, FilterValue> {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const out: Record<string, FilterValue> = {};
    for (const [k, v] of Object.entries(parsed)) {
      if (!isFilterActive(v)) continue;
      if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") {
        out[k] = v;
        continue;
      }
      if (v && typeof v === "object" && "contains" in v) {
        const contains = String((v as { contains?: unknown }).contains ?? "").trim();
        if (!contains) continue;
        out[k] = {
          contains,
          mode: (v as { mode?: "insensitive" }).mode === "insensitive" ? "insensitive" : "insensitive",
        };
        continue;
      }
    }
    return out;
  } catch {
    return {};
  }
}

export function useServerQuery(defaults?: Partial<ServerQueryState>) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const state: ServerQueryState = useMemo(
    () => ({
      page: Math.max(1, Number(searchParams.get("page")) || defaults?.page || 1),
      limit: Math.min(100, Math.max(1, Number(searchParams.get("limit")) || defaults?.limit || 20)),
      sort: searchParams.get("sort") || defaults?.sort || "-createdAt",
      search: searchParams.get("search") || defaults?.search || "",
      filters: parseFilters(searchParams.get("filters")),
    }),
    [searchParams, defaults?.page, defaults?.limit, defaults?.sort, defaults?.search]
  );

  const setQuery = useCallback(
    (patch: Partial<ServerQueryState>, options?: { resetPage?: boolean }) => {
      const next = new URLSearchParams(searchParams.toString());
      const merged: ServerQueryState = {
        ...state,
        ...patch,
        filters: patch.filters !== undefined ? patch.filters : state.filters,
      };
      if (options?.resetPage) merged.page = 1;

      next.set("page", String(merged.page));
      next.set("limit", String(merged.limit));
      next.set("sort", merged.sort);
      if (merged.search) next.set("search", merged.search);
      else next.delete("search");

      const cleaned: Record<string, FilterValue> = {};
      for (const [k, v] of Object.entries(merged.filters)) {
        if (isFilterActive(v)) cleaned[k] = v as FilterValue;
      }
      if (Object.keys(cleaned).length) next.set("filters", JSON.stringify(cleaned));
      else next.delete("filters");

      router.replace(`${pathname}?${next.toString()}`);
    },
    [pathname, router, searchParams, state]
  );

  const apiParams = useMemo(
    () => ({
      page: state.page,
      limit: state.limit,
      sort: state.sort,
      search: state.search || undefined,
      filters: Object.keys(state.filters).length ? JSON.stringify(state.filters) : undefined,
    }),
    [state]
  );

  return { state, setQuery, apiParams };
}
