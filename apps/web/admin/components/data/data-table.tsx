"use client";

import { useEffect, useRef, useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pagination } from "@/components/ui/pagination";
import { TableLoadMoreSkeleton, TableSkeleton } from "@/components/ui/skeletons";
import { Button } from "@/components/ui/button";
import { ColumnFilterButton } from "@/components/data/column-filter";
import { cn } from "@/lib/utils";
import { ActionTooltip } from "@/components/ui/icon-action-button";
import type { ColumnFilterDef, FilterValue } from "@/lib/table-filters";
import { getFilterFieldKey } from "@/lib/table-filters";
import type { PaginationMode } from "@/lib/pagination-mode";

export type Column<T> = {
  key: string;
  header: string;
  cell: (row: T) => React.ReactNode;
  className?: string;
  /** false = بدون فیلتر؛ undefined = فیلتر متنی روی key (به‌جز actions) */
  filter?: false | ColumnFilterDef;
};

type DataTableProps<T extends { id: string }> = {
  columns: Column<T>[];
  rows: T[];
  loading?: boolean;
  error?: string | null;
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
  onRetry?: () => void;
  emptyTitle?: string;
  emptyDescription?: string;
  rowKey?: (row: T) => string;
  /** فعال‌سازی درگ‌ودراپ ردیف‌ها */
  sortable?: boolean;
  onReorder?: (rows: T[]) => void | Promise<void>;
  filters?: Record<string, FilterValue>;
  onFiltersChange?: (filters: Record<string, FilterValue>) => void;
  paginationMode?: PaginationMode;
  loadingMore?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  /** مخفی کردن سوییچ حالت (مثلاً لیست درختی) */
  showPaginationMode?: boolean;
};

function resolveFilterConfig(col: Column<unknown>): ColumnFilterDef | null {
  if (col.key === "actions" || col.filter === false) return null;
  if (col.filter && typeof col.filter === "object") {
    return { type: "text", ...col.filter };
  }
  return { type: "text" };
}

export function DataTable<T extends { id: string }>({
  columns,
  rows,
  loading,
  error,
  page,
  totalPages,
  total,
  onPageChange,
  onRetry,
  emptyTitle = "موردی یافت نشد",
  emptyDescription = "با تغییر فیلتر یا افزودن مورد جدید شروع کنید.",
  rowKey = (row) => row.id,
  sortable = false,
  onReorder,
  filters = {},
  onFiltersChange,
  paginationMode,
  loadingMore = false,
  hasMore = false,
  onLoadMore,
  showPaginationMode = true,
}: DataTableProps<T>) {
  const [localRows, setLocalRows] = useState(rows);
  const [busy, setBusy] = useState(false);
  const loadMoreSentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setLocalRows(rows);
  }, [rows]);

  useEffect(() => {
    if (!hasMore || !onLoadMore || loadingMore) return;
    const node = loadMoreSentinelRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) onLoadMore();
      },
      { root: null, rootMargin: "320px 0px", threshold: 0 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, onLoadMore, loadingMore, localRows.length]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function setFilterValue(key: string, value: FilterValue | undefined) {
    if (!onFiltersChange) return;
    const next = { ...filters };
    if (value === undefined) delete next[key];
    else next[key] = value;
    onFiltersChange(next);
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id || !onReorder) return;
    const oldIndex = localRows.findIndex((r) => rowKey(r) === String(active.id));
    const newIndex = localRows.findIndex((r) => rowKey(r) === String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;
    const next = arrayMove(localRows, oldIndex, newIndex);
    setLocalRows(next);
    setBusy(true);
    try {
      await onReorder(next);
    } catch {
      setLocalRows(rows);
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return <TableSkeleton columns={columns.length + (sortable ? 1 : 0)} rows={8} />;
  }

  if (error) {
    return (
      <div className="rounded-[var(--admin-radius)] border border-[var(--admin-danger)]/40 bg-[var(--admin-danger)]/10 p-8 text-center">
        <p className="mb-3 font-medium">{error}</p>
        {onRetry ? (
          <Button type="button" variant="secondary" onClick={onRetry}>
            تلاش مجدد
          </Button>
        ) : null}
      </div>
    );
  }

  const headerRow = (
    <TableRow>
      {sortable ? <TableHead className="w-0 whitespace-nowrap px-2">ترتیب</TableHead> : null}
      {columns.map((col) => {
        const config = resolveFilterConfig(col as Column<unknown>);
        const fieldKey = config ? getFilterFieldKey(col.key, config) : null;
        return (
          <TableHead
            key={col.key}
            className={cn(
              col.className,
              col.key === "actions" && "text-start whitespace-nowrap"
            )}
          >
            <div className="flex items-center gap-1.5">
              <span>{col.header}</span>
              {config && fieldKey && onFiltersChange ? (
                <ColumnFilterButton
                  label={col.header}
                  filterKey={fieldKey}
                  config={config}
                  value={filters[fieldKey]}
                  onChange={setFilterValue}
                />
              ) : null}
            </div>
          </TableHead>
        );
      })}
    </TableRow>
  );

  const table = (
    <Table>
      <TableHeader>{headerRow}</TableHeader>
      <TableBody>
        {!localRows.length ? (
          <TableRow>
            <TableCell
              colSpan={columns.length + (sortable ? 1 : 0)}
              className="h-32 text-center"
            >
              <p className="mb-1 font-medium">{emptyTitle}</p>
              <p className="text-sm text-[var(--admin-muted)]">{emptyDescription}</p>
            </TableCell>
          </TableRow>
        ) : sortable ? (
          <SortableContext
            items={localRows.map((r) => rowKey(r))}
            strategy={verticalListSortingStrategy}
          >
            {localRows.map((row) => (
              <SortableTableRow key={rowKey(row)} id={rowKey(row)} disabled={busy}>
                {columns.map((col) => (
                  <TableCell
                    key={col.key}
                    className={cn(
                      col.className,
                      col.key === "actions" && "w-0 whitespace-nowrap"
                    )}
                  >
                    {col.cell(row)}
                  </TableCell>
                ))}
              </SortableTableRow>
            ))}
          </SortableContext>
        ) : (
          localRows.map((row) => (
            <TableRow key={rowKey(row)}>
              {columns.map((col) => (
                <TableCell
                  key={col.key}
                  className={cn(
                    col.className,
                    col.key === "actions" && "w-0 whitespace-nowrap"
                  )}
                >
                  {col.cell(row)}
                </TableCell>
              ))}
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );

  return (
    <div
      className={cn(
        "rounded-[var(--admin-radius)] border border-[var(--admin-border)] bg-[var(--admin-surface)]/50",
        busy && "pointer-events-none opacity-70"
      )}
    >
      {sortable && onReorder ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={(e) => void handleDragEnd(e)}
        >
          {table}
        </DndContext>
      ) : (
        table
      )}
      {hasMore || loadingMore ? (
        <div ref={loadMoreSentinelRef}>
          <TableLoadMoreSkeleton columns={columns.length + (sortable ? 1 : 0)} rows={4} />
        </div>
      ) : null}
      <div className="border-t border-[var(--admin-border)] px-3">
        <Pagination
          page={page}
          totalPages={totalPages}
          total={total}
          onPageChange={onPageChange}
          mode={paginationMode}
          showModeSwitch={showPaginationMode}
          loadingMore={loadingMore}
          hasMore={hasMore}
          onLoadMore={onLoadMore}
          loadedCount={localRows.length}
          observeSentinel={false}
        />
      </div>
    </div>
  );
}

function SortableTableRow({
  id,
  disabled,
  children,
}: {
  id: string;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id, disabled });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <TableRow
      ref={setNodeRef}
      style={style}
      className={cn(isDragging && "relative z-10 bg-[var(--admin-surface)] opacity-60")}
    >
      <TableCell className="w-0 px-2">
        <ActionTooltip label="جابجایی">
          <button
            type="button"
            className={cn(
              "inline-flex h-8 w-8 cursor-grab items-center justify-center rounded-md text-[var(--admin-muted)]",
              "hover:bg-[var(--admin-accent)]/10 hover:text-[var(--admin-accent)]",
              "active:cursor-grabbing"
            )}
            aria-label="جابجایی"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-4 w-4" />
          </button>
        </ActionTooltip>
      </TableCell>
      {children}
    </TableRow>
  );
}
