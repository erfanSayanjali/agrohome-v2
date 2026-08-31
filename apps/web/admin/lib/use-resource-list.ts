"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ListResponse } from "@agrohome/shared";
import { apiGet, ApiError, unwrapList } from "@/lib/api";
import { useServerQuery } from "@/lib/use-server-query";
import { isUnauthorized } from "@/components/providers/auth-provider";
import { usePaginationMode } from "@/lib/pagination-mode";
import { withBasePath } from "@/lib/base-path";

type ListMeta = { page: number; limit: number; totalPages: number };

function filterIdentity(params: {
  sort: string;
  search?: string;
  filters?: string;
  limit: number;
}) {
  return JSON.stringify({
    sort: params.sort,
    search: params.search || "",
    filters: params.filters || "",
    limit: params.limit,
  });
}

export function useResourceList<T>(
  path: string,
  defaults?: Partial<import("@/lib/use-server-query").ServerQueryState>
) {
  const { state, setQuery, apiParams } = useServerQuery(defaults);
  const [paginationMode] = usePaginationMode();
  const [rows, setRows] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [meta, setMeta] = useState<ListMeta>({
    page: state.page,
    limit: state.limit,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const loadedPageRef = useRef(0);
  const lastFilterKeyRef = useRef("");
  const lastTickRef = useRef(tick);
  const lastModeRef = useRef(paginationMode);

  const reload = useCallback(() => {
    if (paginationMode === "infinite" && state.page !== 1) {
      setQuery({ page: 1 }, { scroll: false });
    }
    setTick((t) => t + 1);
  }, [paginationMode, setQuery, state.page]);

  useEffect(() => {
    if (lastModeRef.current === paginationMode) return;
    lastModeRef.current = paginationMode;
    loadedPageRef.current = 0;
    if (state.page !== 1) setQuery({ page: 1 }, { scroll: false });
    setTick((t) => t + 1);
  }, [paginationMode, setQuery, state.page]);

  useEffect(() => {
    if (!path) {
      setRows([]);
      setTotal(0);
      setMeta({ page: 1, limit: state.limit, totalPages: 1 });
      setLoading(false);
      setLoadingMore(false);
      setError(null);
      loadedPageRef.current = 0;
      return;
    }

    let cancelled = false;

    if (paginationMode === "classic") {
      setLoading(true);
      setError(null);
      apiGet<ListResponse<T>>(path, apiParams)
        .then((res) => {
          if (cancelled) return;
          const list = unwrapList(res);
          setRows(list.content);
          setTotal(list.total);
          setMeta(list.meta ?? { page: state.page, limit: state.limit, totalPages: 1 });
          loadedPageRef.current = list.meta?.page ?? state.page;
          lastFilterKeyRef.current = filterIdentity(apiParams);
          lastTickRef.current = tick;
        })
        .catch((err: unknown) => {
          if (cancelled) return;
          if (isUnauthorized(err)) {
            window.location.href = withBasePath("/login");
            return;
          }
          setError(err instanceof ApiError ? err.message : "خطا در دریافت داده");
          setRows([]);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });

      return () => {
        cancelled = true;
      };
    }

    // infinite
    const fKey = filterIdentity(apiParams);
    const filterChanged = lastFilterKeyRef.current !== fKey;
    const tickChanged = lastTickRef.current !== tick;
    const shouldReset = filterChanged || tickChanged || loadedPageRef.current === 0;

    if (!shouldReset) {
      if (state.page <= loadedPageRef.current) return;
      if (state.page !== loadedPageRef.current + 1) return;
    }

    const nextPage = shouldReset ? 1 : state.page;
    const isAppend = !shouldReset && nextPage > 1;

    lastFilterKeyRef.current = fKey;
    lastTickRef.current = tick;

    if (isAppend) setLoadingMore(true);
    else {
      setLoading(true);
      setRows([]);
      loadedPageRef.current = 0;
    }
    setError(null);

    apiGet<ListResponse<T>>(path, { ...apiParams, page: nextPage })
      .then((res) => {
        if (cancelled) return;
        const list = unwrapList(res);
        const page = list.meta?.page ?? nextPage;
        if (isAppend) {
          setRows((prev) => {
            const seen = new Set(
              prev.map((r) => (r as { id?: string }).id).filter(Boolean) as string[]
            );
            const merged = [...prev];
            for (const item of list.content) {
              const id = (item as { id?: string }).id;
              if (id && seen.has(id)) continue;
              if (id) seen.add(id);
              merged.push(item);
            }
            return merged;
          });
        } else {
          setRows(list.content);
          if (state.page !== 1) setQuery({ page: 1 }, { scroll: false });
        }
        setTotal(list.total);
        setMeta(list.meta ?? { page, limit: state.limit, totalPages: 1 });
        loadedPageRef.current = page;
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (isUnauthorized(err)) {
          window.location.href = withBasePath("/login");
          return;
        }
        setError(err instanceof ApiError ? err.message : "خطا در دریافت داده");
        if (!isAppend) setRows([]);
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
          setLoadingMore(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [path, apiParams, tick, paginationMode, state.page, state.limit, setQuery]);

  const hasMore =
    paginationMode === "infinite" && meta.totalPages > 0 && meta.page < meta.totalPages;

  const loadMore = useCallback(() => {
    if (paginationMode !== "infinite") return;
    if (loading || loadingMore) return;
    const next = loadedPageRef.current + 1;
    if (next > meta.totalPages) return;
    setQuery({ page: next }, { scroll: false });
  }, [paginationMode, loading, loadingMore, meta.totalPages, setQuery]);

  return {
    state,
    setQuery,
    rows,
    total,
    meta,
    loading,
    loadingMore,
    error,
    reload,
    paginationMode,
    hasMore,
    loadMore,
  };
}
