"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { apiGet, apiPost, ApiError, unwrapList } from "@/lib/api";
import type { ListResponse } from "@agrohome/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CrudResourcePage } from "@/components/data/crud-resource-page";
import { Combobox } from "@/components/ui/combobox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

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
  const [assignUser, setAssignUser] = useState<User | null>(null);
  const [roleId, setRoleId] = useState("");
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    apiGet<ListResponse<Role>>("/admin/roles", { limit: 100 })
      .then((res) => setRoles(unwrapList(res).content))
      .catch(() => setRoles([]));
  }, []);

  return (
    <>
      <CrudResourcePage<User>
        key={reloadToken}
        title="کاربران"
        description="اختصاص نقش طبق قانون PRD"
        path="/admin/users"
        searchPlaceholder="موبایل یا نام…"
        disableCreate
        disableEdit
        disableDelete
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
              options: roles.map((r) => ({ value: r.id, label: r.title })),
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
        fields={[]}
        extraActions={(row) => (
          <Button type="button" size="sm" variant="secondary" onClick={() => {
            setAssignUser(row);
            setRoleId(row.roleId || "");
          }}>
            نقش
          </Button>
        )}
      />

      <Dialog open={Boolean(assignUser)} onOpenChange={(o) => !o && setAssignUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>اختصاص نقش</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label>نقش</Label>
            <Combobox
              options={roles.map((r) => ({ value: r.id, label: r.title }))}
              value={roleId}
              onChange={setRoleId}
              placeholder="انتخاب نقش"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setAssignUser(null)}>
              انصراف
            </Button>
            <Button
              type="button"
              onClick={async () => {
                if (!assignUser || !roleId) return;
                try {
                  await apiPost(`/admin/users/${assignUser.id}/assign-role`, { roleId });
                  toast.success("نقش اختصاص یافت");
                  setAssignUser(null);
                  setReloadToken((t) => t + 1);
                } catch (err) {
                  toast.error(err instanceof ApiError ? err.message : "خطا");
                }
              }}
            >
              ذخیره
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
