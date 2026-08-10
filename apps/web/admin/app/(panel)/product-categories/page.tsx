"use client";

import { Badge } from "@/components/ui/badge";
import { CrudResourcePage } from "@/components/data/crud-resource-page";
import { categoryDisplayLabel, mapCategoryOption } from "@/lib/category-option";

type Cat = {
  id: string;
  title: string;
  slug: string;
  publish: boolean;
  parentId?: string | null;
  sortOrder?: number;
  description?: string | null;
  parent?: { id: string; title: string; slug?: string | null } | null;
};

export default function ProductCategoriesPage() {
  return (
    <CrudResourcePage<Cat>
      title="دسته‌بندی محصول"
      description="دسته‌ها را به‌صورت درختی ببینید؛ برای والد از جستجو و صفحه‌بندی استفاده کنید"
      path="/admin/product-categories"
      nested={{ nestedPath: "/admin/product-categories-nested" }}
      sortable
      sortOptions={[
        { value: "title", label: "عنوان" },
        { value: "-createdAt", label: "جدیدترین" },
      ]}
      columns={[
        { key: "title", header: "عنوان", cell: (r) => r.title },
        { key: "slug", header: "اسلاگ", cell: (r) => <span dir="ltr">{r.slug}</span> },
        {
          key: "publish",
          header: "انتشار",
          cell: (r) => (
            <Badge variant={r.publish ? "success" : "muted"}>{r.publish ? "بله" : "خیر"}</Badge>
          ),
        },
      ]}
      createDefaults={{ publish: true }}
      fields={[
        { name: "title", label: "عنوان", required: true },
        { name: "slug", label: "اسلاگ", required: true, dir: "ltr" },
        { name: "description", label: "توضیحات", type: "textarea" },
        {
          name: "parentId",
          label: "دسته والد",
          type: "async-select",
          placeholder: "بدون والد (دسته ریشه)",
          asyncSelect: {
            path: "/admin/product-categories",
            mapItem: mapCategoryOption,
            allowClear: true,
            excludeSelfTree: true,
            searchPlaceholder: "نام دسته…",
            labelKey: "parentIdLabel",
          },
        },
        { name: "publish", label: "منتشر", type: "switch" },
      ]}
      mapRowToForm={(r) => ({
        title: r.title,
        slug: r.slug,
        description: r.description ?? "",
        parentId: r.parentId ?? "",
        parentIdLabel: r.parent
          ? categoryDisplayLabel({ title: r.parent.title })
          : "",
        publish: r.publish,
      })}
      mapFormToBody={(v) => {
        const { parentIdLabel: _label, ...rest } = v;
        return {
          ...rest,
          parentId: v.parentId ? v.parentId : null,
        };
      }}
      seoTarget={{ type: "product_category" }}
    />
  );
}
