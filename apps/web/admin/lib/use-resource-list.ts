"use client";

import { useCallback, useEffect, useState } from "react";
import type { ListResponse } from "@agrohome/shared";
import { apiGet, ApiError, unwrapList } from "@/lib/api";
import { useServerQuery } from "@/lib/use-server-query";
import { isUnauthorized } from "@/components/providers/auth-provider";

export function useResourceList<T>(
  path: string,
  defaults?: Partial<import("@/lib/use-server-query").ServerQueryState>
) {
  const { state, setQuery, apiParams } = useServerQuery(defaults);
  const [data, setData] = useState<ListResponse<T> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const reload = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    if (!path) {
      setData(null);
      setLoading(false);
      setError(null);
      return;
    }
    let cancelled = false;
    const ctrl = new AbortController();
    setLoading(true);
    setError(null);
    apiGet<ListResponse<T>>(path, apiParams)
      .then((res) => {
        if (!cancelled) setData(unwrapList(res));
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (isUnauthorized(err)) {
          window.location.href = "/login";
          return;
        }
        setError(err instanceof ApiError ? err.message : "خطا در دریافت داده");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
      ctrl.abort();
    };
  }, [path, apiParams, tick]);

  return {
    state,
    setQuery,
    rows: data?.content ?? [],
    total: data?.total ?? 0,
    meta: data?.meta ?? { page: state.page, limit: state.limit, totalPages: 1 },
    loading,
    error,
    reload,
  };
}
