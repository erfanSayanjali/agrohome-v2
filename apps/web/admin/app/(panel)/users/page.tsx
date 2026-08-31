"use client";

import { useEffect, useMemo, useState } from "react";
import { apiGet, unwrapList } from "@/lib/api";
import type { ListResponse } from "@agrohome/shared";
import { Badge } from "@/components/ui/badge";
import { CrudResourcePage } from "@/components/data/crud-resource-page";

type Role = { id: string; title: string };
type User = {
  id: string;
  phone: string;
  firstName?: string | null;
  lastName?: string | null;
  roleId?: string | null;
  role?: Role | null;
  hasPassword?: boolean;
};

export default function UsersPage() {
  const [roles, setRoles] = useState<Role[]>([]);

  useEffect(() => {
    apiGet<ListResponse<Role>>("/admin/roles", { limit: 100 })
      .then((res) => setRoles(unwrapList(res).content))
      .catch(() => setRoles([]));
  }, []);

  const roleOptions = useMemo(
    () => roles.map((r) => ({ value: r.id, label: r.title })),
    [roles]
  );

  const adminRoleId = roles[0]?.id ?? "";

  return (
    <CrudResourcePage<User>
      title="کاربران"
      description="مدیریت کاربران، نقش‌ها و رمز ورود"
      path="/admin/users"
      searchPlaceholder="موبایل یا نام…"
      columns={[
        { key: "phone", header: "موبایل", cell: (r) => <span dir="ltr">{r.phone}</span> },
        {
          key: "name",
          header: "نام",
          filter: { key: "firstName", type: "text", placeholder: "نام…" },
          cell: (r) => [r.firstName, r.lastName].filter(Boolean).join(" ") || "—",
        },
        {
          key: "role",
          header: "نقش",
          filter: {
            key: "roleId",
            type: "select",
            options: roleOptions,
            placeholder: "نقش",
          },
          cell: (r) => r.role?.title || <Badge variant="muted">بدون نقش</Badge>,
        },
        {
          key: "pw",
          header: "رمز",
          filter: false,
          cell: (r) => (r.hasPassword ? <Badge variant="success">دارد</Badge> : "—"),
        },
      ]}
      fields={[
        { name: "phone", label: "موبایل", required: true, dir: "ltr", placeholder: "09123456789" },
        { name: "firstName", label: "نام" },
        { name: "lastName", label: "نام خانوادگی" },
        {
          name: "roleId",
          label: "نقش",
          type: "combobox",
          options: roleOptions,
          placeholder: "انتخاب نقش",
        },
        {
          name: "password",
          label: "رمز عبور",
          required: true,
          dir: "ltr",
          placeholder: "حداقل ۶ کاراکتر",
        },
      ]}
      createDefaults={{
        roleId: adminRoleId,
      }}
      mapRowToForm={(r) => ({
        phone: r.phone,
        firstName: r.firstName ?? "",
        lastName: r.lastName ?? "",
        roleId: r.roleId ?? "",
        password: "",
      })}
      mapFormToBody={(v, mode) => {
        const body: Record<string, unknown> = {
          phone: String(v.phone ?? "").trim(),
          firstName: String(v.firstName ?? "").trim() || null,
          lastName: String(v.lastName ?? "").trim() || null,
          roleId: v.roleId ? String(v.roleId) : null,
        };
        const password = String(v.password ?? "").trim();
        if (password) body.password = password;
        else if (mode === "create") body.password = "";
        return body;
      }}
    />
  );
}
