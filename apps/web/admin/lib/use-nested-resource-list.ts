"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { apiGet, ApiError } from "@/lib/api";
import { isUnauthorized } from "@/components/providers/auth-provider";
import type { ServerQueryState } from "@/lib/use-server-query";
import {
  collectExpandIdsForFilter,
  countTreeNodes,
  filterTree,
  flattenVisible,
  indexTreeById,
  type FlatTreeRow,
  type TreeNode,
} from "@/lib/tree";
import type { FilterValue } from "@/lib/table-filters";
import { withBasePath } from "@/lib/base-path";

type NestedListOptions = {
  enabled?: boolean;
  /** منبع حقیقت URL — معمولاً از useResourceList / useServerQuery */
  state: ServerQueryState;
  setQuery: (
    patch: Partial<ServerQueryState>,
    options?: { resetPage?: boolean; scroll?: boolean }
  ) => void;
};

function matchesFilters<T extends Record<string, unknown>>(
  row: T,
  filters: Record<string, FilterValue>
) {
  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined || value === null || value === "") continue;
    const raw = row[key];
    if (typeof value === "object" && value !== null && "contains" in value) {
      const needle = String((value as { contains?: unknown }).contains ?? "")
        .trim()
        .toLowerCase();
      if (!needle) continue;
      if (!String(raw ?? "").toLowerCase().includes(needle)) return false;
      continue;
    }
    if (typeof value === "object" && value !== null && "op" in value) {
      const v = String((value as { value?: unknown }).value ?? "").toLowerCase();
      if (!v) continue;
      if (!String(raw ?? "")
        .toLowerCase()
        .includes(v)) {
        return false;
      }
      continue;
    }
    if (value === true || value === false || value === "true" || value === "false") {
      const want = value === true || value === "true";
      if (Boolean(raw) !== want) return false;
      continue;
    }
    if (String(raw) !== String(value)) return false;
  }
  return true;
}

function filterTreeByRecordFilters<T extends { id: string }>(
  nodes: TreeNode<T>[],
  filters: Record<string, FilterValue>
): TreeNode<T>[] {
  if (!Object.keys(filters).length) return nodes;
  const walk = (list: TreeNode<T>[]): TreeNode<T>[] => {
    const out: TreeNode<T>[] = [];
    for (const node of list) {
      const kids = walk(node.children || []);
      const selfOk = matchesFilters(node as unknown as Record<string, unknown>, filters);
      if (selfOk || kids.length) {
        out.push({
          ...node,
          children: selfOk ? node.children || [] : kids,
        });
      }
    }
    return out;
  };
  return walk(nodes);
}

function collectAllIds<T extends { id: string }>(nodes: TreeNode<T>[]): string[] {
  const ids: string[] = [];
  const walk = (list: TreeNode<T>[]) => {
    for (const node of list) {
      ids.push(node.id);
      if (node.children?.length) walk(node.children);
    }
  };
  walk(nodes);
  return ids;
}

export function useNestedResourceList<T extends { id: string; title?: string | null; slug?: string | null }>(
  nestedPath: string | null | undefined,
  options: NestedListOptions
) {
  const enabled = Boolean(nestedPath) && options.enabled !== false;
  const { state, setQuery } = options;
  const [tree, setTree] = useState<TreeNode<T>[]>([]);
  const [loading, setLoading] = useState(Boolean(enabled));
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const reload = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    if (!enabled || !nestedPath) {
      setTree([]);
      setLoading(false);
      setError(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    apiGet<{ content: TreeNode<T>[] }>(nestedPath)
      .then((res) => {
        if (cancelled) return;
        const roots = Array.isArray(res.content) ? res.content : [];
        setTree(roots);
        setExpanded(new Set(roots.map((r) => r.id)));
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (isUnauthorized(err)) {
          window.location.href = withBasePath("/login");
          return;
        }
        setError(err instanceof ApiError ? err.message : "خطا در دریافت درخت");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [enabled, nestedPath, tick]);

  const byId = useMemo(() => indexTreeById(tree), [tree]);

  const filteredTree = useMemo(() => {
    let next = filterTree(tree, state.search);
    next = filterTreeByRecordFilters(next, state.filters);
    return next;
  }, [tree, state.search, state.filters]);

  useEffect(() => {
    const hasSearch = Boolean(state.search.trim());
    const hasFilters = Object.keys(state.filters).length > 0;
    if (!hasSearch && !hasFilters) return;
    setExpanded((prev) => {
      const merged = new Set(prev);
      if (hasSearch) {
        for (const id of collectExpandIdsForFilter(tree, state.search)) merged.add(id);
      }
      if (hasFilters) {
        for (const id of collectAllIds(filteredTree)) merged.add(id);
      }
      return merged;
    });
  }, [state.search, state.filters, tree, filteredTree]);

  const visibleRows: FlatTreeRow<T>[] = useMemo(
    () => flattenVisible(filteredTree, expanded),
    [filteredTree, expanded]
  );

  const total = useMemo(() => countTreeNodes(filteredTree), [filteredTree]);

  const toggle = useCallback((id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const expandAll = useCallback(() => {
    setExpanded(new Set(byId.keys()));
  }, [byId]);

  const collapseAll = useCallback(() => {
    setExpanded(new Set());
  }, []);

  return {
    state,
    setQuery,
    rows: visibleRows,
    tree,
    byId,
    total,
    meta: { page: 1, limit: total || 1, totalPages: 1 },
    loading,
    error,
    reload,
    expanded,
    toggle,
    expandAll,
    collapseAll,
  };
}
