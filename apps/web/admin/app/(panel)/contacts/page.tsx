"use client";

import { toast } from "sonner";
import { apiPut, ApiError } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CrudResourcePage } from "@/components/data/crud-resource-page";

type Row = {
  id: string;
  fullName?: string | null;
  subject?: string | null;
  email?: string | null;
  phone?: string | null;
  message: string;
  status: string;
};

export default function ContactsPage() {
  return (
    <CrudResourcePage<Row>
      title="پیام‌های تماس"
      path="/admin/contact-messages"
      searchPlaceholder="نام، ایمیل، موضوع…"
      filters={[
        {
          key: "status",
          label: "وضعیت",
          options: [
            { value: "new", label: "جدید" },
            { value: "read", label: "خوانده‌شده" },
            { value: "archived", label: "بایگانی" },
          ],
        },
      ]}
      columns={[
        { key: "name", header: "نام", cell: (r) => r.fullName || "—" },
        { key: "subject", header: "موضوع", cell: (r) => r.subject || "—" },
        {
          key: "message",
          header: "پیام",
          cell: (r) => <span className="line-clamp-2 max-w-md">{r.message}</span>,
        },
        {
          key: "status",
          header: "وضعیت",
          cell: (r) => (
            <Badge variant={r.status === "new" ? "accent" : "muted"}>{r.status}</Badge>
          ),
        },
      ]}
      fields={[
        { name: "fullName", label: "نام" },
        { name: "subject", label: "موضوع" },
        { name: "email", label: "ایمیل", dir: "ltr" },
        { name: "phone", label: "تلفن", dir: "ltr" },
        { name: "message", label: "پیام", type: "textarea", required: true },
        {
          name: "status",
          label: "وضعیت",
          type: "select",
          options: [
            { value: "new", label: "جدید" },
            { value: "read", label: "خوانده‌شده" },
            { value: "archived", label: "بایگانی" },
          ],
        },
      ]}
      createDefaults={{ status: "new" }}
      extraActions={(row, reload) => (
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={async () => {
            const next = row.status === "new" ? "read" : row.status === "read" ? "archived" : "new";
            try {
              await apiPut(`/admin/contact-messages/${row.id}`, { status: next });
              toast.success(`وضعیت: ${next}`);
              reload();
            } catch (err) {
              toast.error(err instanceof ApiError ? err.message : "خطا");
            }
          }}
        >
          تغییر وضعیت
        </Button>
      )}
    />
  );
}
