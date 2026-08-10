"use client";

import { CrudResourcePage } from "@/components/data/crud-resource-page";

type Row = {
  id: string;
  title: string;
  slug: string;
  categoryId?: string | null;
  category?: { title?: string } | null;
};

export default function TagsPage() {
  return (
    <CrudResourcePage<Row>
      title="تگ‌ها"
      path="/admin/tags"
      searchPlaceholder="عنوان تگ…"
      columns={[
        { key: "title", header: "عنوان", cell: (r) => r.title },
        { key: "slug", header: "اسلاگ", cell: (r) => <span dir="ltr">{r.slug}</span> },
        { key: "cat", header: "موضوع", cell: (r) => r.category?.title || "—" },
      ]}
      fields={[
        { name: "title", label: "عنوان", required: true },
        { name: "slug", label: "اسلاگ", required: true, dir: "ltr" },
        {
          name: "categoryId",
          label: "موضوع تگ",
          type: "async-select",
          placeholder: "انتخاب موضوع…",
          asyncSelect: {
            path: "/admin/tag-categories",
            mapItem: (item) => ({
              value: String(item.id),
              label: String(item.title || item.id),
              meta: item.slug ? String(item.slug) : undefined,
            }),
            allowClear: true,
            searchPlaceholder: "جستجوی موضوع…",
          },
        },
      ]}
      mapRowToForm={(r) => ({
        title: r.title,
        slug: r.slug,
        categoryId: r.categoryId ?? "",
        categoryIdLabel: r.category?.title ?? "",
      })}
      mapFormToBody={(v) => ({
        title: v.title,
        slug: v.slug,
        categoryId: v.categoryId ? v.categoryId : null,
      })}
    />
  );
}
