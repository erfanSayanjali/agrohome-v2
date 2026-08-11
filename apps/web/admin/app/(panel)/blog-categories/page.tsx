"use client";

import { Badge } from "@/components/ui/badge";
import { CrudResourcePage } from "@/components/data/crud-resource-page";
import { categoryDisplayLabel, mapCategoryOption } from "@/lib/category-option";
import type { MediaRef } from "@agrohome/shared";
import { toMediaRef } from "@agrohome/shared";

type Row = {
  id: string;
  title: string;
  slug: string;
  publish: boolean;
  description?: string | null;
  parentId?: string | null;
  media?: MediaRef | null;
  parent?: { id: string; title: string; slug?: string | null } | null;
};

export default function BlogCategoriesPage() {
  return (
    <CrudResourcePage<Row>
      title="دسته وبلاگ"
      path="/admin/blog-categories"
      nested={{ nestedPath: "/admin/blog-categories-nested" }}
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
        { name: "description", label: "توضیحات", type: "richtext" },
        { name: "media", label: "تصویر", type: "media" },
        {
          name: "parentId",
          label: "دسته والد",
          type: "async-select",
          placeholder: "بدون والد (دسته ریشه)",
          asyncSelect: {
            path: "/admin/blog-categories",
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
        media: toMediaRef(r.media),
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
          media: toMediaRef(v.media),
          parentId: v.parentId ? v.parentId : null,
        };
      }}
      seoTarget={{ type: "blog_category" }}
    />
  );
}
