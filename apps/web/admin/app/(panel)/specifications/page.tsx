"use client";

import { CrudResourcePage } from "@/components/data/crud-resource-page";

type Row = { id: string; title: string; position?: string | null };

export default function SpecificationsPage() {
  return (
    <CrudResourcePage<Row>
      title="مشخصه‌ها"
      path="/admin/specifications"
      searchPlaceholder="عنوان مشخصه…"
      columns={[
        { key: "title", header: "عنوان", cell: (r) => r.title },
        { key: "position", header: "موقعیت", cell: (r) => r.position || "—" },
      ]}
      createDefaults={{ position: "attribute" }}
      fields={[
        { name: "title", label: "عنوان", required: true },
        {
          name: "position",
          label: "موقعیت",
          type: "select",
          options: [
            { value: "attribute", label: "attribute" },
            { value: "highlight", label: "highlight" },
          ],
        },
      ]}
    />
  );
}
