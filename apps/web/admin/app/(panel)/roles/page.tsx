"use client";

import { CrudResourcePage } from "@/components/data/crud-resource-page";

type Row = { id: string; title: string; permissions?: unknown };

export default function RolesPage() {
  return (
    <CrudResourcePage<Row>
      title="نقش‌ها"
      path="/admin/roles"
      columns={[
        { key: "title", header: "عنوان", cell: (r) => r.title },
        {
          key: "perms",
          header: "دسترسی‌ها",
          cell: (r) => (
            <span className="line-clamp-1 max-w-sm text-xs text-[var(--admin-muted)]" dir="ltr">
              {JSON.stringify(r.permissions ?? [])}
            </span>
          ),
        },
      ]}
      fields={[
        { name: "title", label: "عنوان", required: true },
        {
          name: "permissionsJson",
          label: "permissions (JSON)",
          type: "textarea",
          placeholder: '[{"entity":"*","actions":["create","update","delete","read"]}]',
          dir: "ltr",
        },
      ]}
      mapRowToForm={(r) => ({
        title: r.title,
        permissionsJson: JSON.stringify(r.permissions ?? [], null, 2),
      })}
      mapFormToBody={(v) => {
        let permissions: unknown = [];
        try {
          permissions = JSON.parse(String(v.permissionsJson || "[]"));
        } catch {
          permissions = [];
        }
        return { title: v.title, permissions };
      }}
      createDefaults={{
        permissionsJson: '[{"entity":"*","actions":["create","update","delete","read"]}]',
      }}
    />
  );
}
