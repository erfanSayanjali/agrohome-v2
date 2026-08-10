"use client";

import { CrudResourcePage } from "@/components/data/crud-resource-page";

type Row = { id: string; title: string; slug: string };

export default function TagCategoriesPage() {
  return (
    <CrudResourcePage<Row>
      title="موضوع تگ"
      path="/admin/tag-categories"
      columns={[
        { key: "title", header: "عنوان", cell: (r) => r.title },
        { key: "slug", header: "اسلاگ", cell: (r) => <span dir="ltr">{r.slug}</span> },
      ]}
      fields={[
        { name: "title", label: "عنوان", required: true },
        { name: "slug", label: "اسلاگ", required: true, dir: "ltr" },
      ]}
    />
  );
}
