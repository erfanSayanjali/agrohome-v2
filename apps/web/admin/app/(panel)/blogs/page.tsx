"use client";

import Link from "next/link";
import { MessageSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CrudResourcePage } from "@/components/data/crud-resource-page";
import { categoryDisplayLabel, mapCategoryOption } from "@/lib/category-option";
import type { MediaRef } from "@agrohome/shared";
import { toMediaRef } from "@agrohome/shared";

type Row = {
  id: string;
  title: string;
  slug: string;
  status: string;
  content?: string | null;
  media?: MediaRef | null;
  categoryId?: string | null;
  category?: {
    title?: string;
    parent?: { title?: string | null } | null;
  } | null;
};

export default function BlogsPage() {
  return (
    <CrudResourcePage<Row>
      title="وبلاگ"
      path="/admin/blogs"
      searchPlaceholder="عنوان مطلب…"
      sortOptions={[
        { value: "-createdAt", label: "جدیدترین" },
        { value: "title", label: "عنوان" },
      ]}
      filters={[
        {
          key: "status",
          label: "وضعیت",
          options: [
            { value: "draft", label: "پیش‌نویس" },
            { value: "published", label: "منتشر" },
          ],
        },
      ]}
      columns={[
        { key: "title", header: "عنوان", cell: (r) => r.title },
        {
          key: "category",
          header: "دسته",
          cell: (r) =>
            categoryDisplayLabel({
              title: r.category?.title,
              parentTitle: r.category?.parent?.title,
            }) || "—",
        },
        {
          key: "status",
          header: "وضعیت",
          cell: (r) => (
            <Badge variant={r.status === "published" ? "success" : "muted"}>{r.status}</Badge>
          ),
        },
      ]}
      createDefaults={{ status: "draft" }}
      fields={[
        { name: "title", label: "عنوان", required: true },
        { name: "slug", label: "اسلاگ", required: true, dir: "ltr" },
        { name: "content", label: "محتوا", type: "richtext" },
        { name: "media", label: "تصویر", type: "media" },
        {
          name: "categoryId",
          label: "دسته وبلاگ",
          type: "async-select",
          placeholder: "جستجو و انتخاب دسته…",
          asyncSelect: {
            path: "/admin/blog-categories",
            mapItem: mapCategoryOption,
            allowClear: true,
            searchPlaceholder: "نام دسته…",
            labelKey: "categoryIdLabel",
          },
        },
        {
          name: "status",
          label: "وضعیت",
          type: "select",
          options: [
            { value: "draft", label: "پیش‌نویس" },
            { value: "published", label: "منتشر" },
          ],
        },
      ]}
      mapRowToForm={(r) => ({
        title: r.title,
        slug: r.slug,
        content: r.content ?? "",
        media: toMediaRef(r.media),
        categoryId: r.categoryId ?? "",
        categoryIdLabel: categoryDisplayLabel({
          title: r.category?.title,
          parentTitle: r.category?.parent?.title,
        }),
        status: r.status,
      })}
      mapFormToBody={(v) => ({
        title: v.title,
        slug: v.slug,
        content: v.content,
        media: toMediaRef(v.media),
        status: v.status,
        categoryId: v.categoryId ? v.categoryId : null,
      })}
      seoTarget={{ type: "blog" }}
      extraActions={(row) => (
        <Button type="button" size="icon" variant="ghost" aria-label="نظرات" asChild>
          <Link
            href={`/comments?filters=${encodeURIComponent(
              JSON.stringify({ targetType: "blog", blogId: row.id })
            )}`}
          >
            <MessageSquare className="h-4 w-4" />
          </Link>
        </Button>
      )}
    />
  );
}
