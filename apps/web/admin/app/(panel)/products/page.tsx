"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, MessageSquare } from "lucide-react";
import { apiDelete, apiPut, ApiError } from "@/lib/api";
import { useResourceList } from "@/lib/use-resource-list";
import { PageHeader } from "@/components/shell/page-header";
import { DataToolbar } from "@/components/data/data-toolbar";
import { DataTable, type Column } from "@/components/data/data-table";
import { ConfirmDelete } from "@/components/data/confirm-delete";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProductEditor, type ProductRow } from "@/components/products/product-editor";
import { buildFilterMeta, enrichColumnsWithFilters } from "@/lib/enrich-column-filters";

export default function ProductsPage() {
  const list = useResourceList<ProductRow>("/admin/products", { sort: "sortOrder" });
  const [editorOpen, setEditorOpen] = useState(false);
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const columns: Column<ProductRow>[] = useMemo(
    () =>
      enrichColumnsWithFilters(
        [
          { key: "title", header: "عنوان", cell: (r) => r.title },
          {
            key: "slug",
            header: "اسلاگ",
            cell: (r) => (
              <span dir="ltr" className="text-start">
                {r.slug}
              </span>
            ),
          },
          {
            key: "status",
            header: "وضعیت",
            filter: {
              type: "select",
              options: [
                { value: "AVAILABLE", label: "موجود" },
                { value: "UNAVAILABLE", label: "ناموجود" },
              ],
            },
            cell: (r) => (
              <Badge variant={r.status === "AVAILABLE" ? "success" : "muted"}>
                {r.status === "AVAILABLE" ? "موجود" : "ناموجود"}
              </Badge>
            ),
          },
          {
            key: "featured",
            header: "ویژه",
            filter: { key: "isFeatured", type: "boolean" },
            cell: (r) => (r.isFeatured ? <Badge variant="accent">بله</Badge> : "—"),
          },
          {
            key: "actions",
            header: "عملیات",
            className: "w-0",
            filter: false,
            cell: (row) => (
              <div className="inline-flex flex-nowrap items-center gap-0.5">
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  aria-label="ویرایش"
                  onClick={() => {
                    setMode("edit");
                    setEditingId(row.id);
                    setEditorOpen(true);
                  }}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button type="button" size="icon" variant="ghost" aria-label="نظرات" asChild>
                  <Link
                    href={`/comments?filters=${encodeURIComponent(
                      JSON.stringify({ targetType: "product", productId: row.id })
                    )}`}
                  >
                    <MessageSquare className="h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  aria-label="حذف"
                  onClick={() => setDeleteId(row.id)}
                >
                  <Trash2 className="h-4 w-4 text-[var(--admin-danger)]" />
                </Button>
              </div>
            ),
          },
        ],
        [],
        []
      ),
    []
  );

  const filterMeta = useMemo(() => buildFilterMeta(columns), [columns]);

  return (
    <div dir="rtl">
      <PageHeader
        title="محصولات"
        description="ترتیب نمایش را با درگ‌ودراپ در جدول عوض کنید"
        actions={
          <Button
            type="button"
            onClick={() => {
              setMode("create");
              setEditingId(null);
              setEditorOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            محصول جدید
          </Button>
        }
      />

      <DataToolbar
        state={list.state}
        onChange={list.setQuery}
        searchPlaceholder="عنوان یا اسلاگ…"
        sortOptions={[
          { value: "sortOrder", label: "ترتیب دستی" },
          { value: "-createdAt", label: "جدیدترین" },
          { value: "title", label: "عنوان" },
        ]}
        filterMeta={filterMeta}
      />

      <DataTable
        columns={columns}
        rows={list.rows}
        loading={list.loading}
        error={list.error}
        page={list.meta.page}
        totalPages={list.meta.totalPages}
        total={list.total}
        onPageChange={(page) => list.setQuery({ page })}
        onRetry={list.reload}
        rowKey={(row) => row.id}
        filters={list.state.filters}
        onFiltersChange={(next) => list.setQuery({ filters: next }, { resetPage: true })}
        paginationMode={list.paginationMode}
        loadingMore={list.loadingMore}
        hasMore={list.hasMore}
        onLoadMore={list.loadMore}
        sortable
        onReorder={async (ordered) => {
          const base =
            list.paginationMode === "infinite" ? 0 : (list.state.page - 1) * list.state.limit;
          try {
            await apiPut("/admin/products/reorder", {
              items: ordered.map((row, index) => ({
                id: row.id,
                sortOrder: base + index,
              })),
            });
            toast.success("ترتیب ذخیره شد");
            list.reload();
          } catch (err) {
            toast.error(err instanceof ApiError ? err.message : "خطا در ذخیره ترتیب");
            throw err;
          }
        }}
      />

      <ProductEditor
        open={editorOpen}
        mode={mode}
        productId={editingId}
        onOpenChange={setEditorOpen}
        onSaved={list.reload}
      />

      <ConfirmDelete
        open={Boolean(deleteId)}
        onOpenChange={(v) => !v && setDeleteId(null)}
        onConfirm={async () => {
          if (!deleteId) return;
          await apiDelete(`/admin/products/${deleteId}`);
          list.reload();
        }}
      />
    </div>
  );
}
