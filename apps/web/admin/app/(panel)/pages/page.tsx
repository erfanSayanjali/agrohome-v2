"use client";

import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CrudResourcePage } from "@/components/data/crud-resource-page";
import { IconActionButton } from "@/components/ui/icon-action-button";

type Page = {
  id: string;
  title: string;
  slug: string;
  status: string;
  revalidateSeconds?: number;
};

export default function PagesListPage() {
  return (
    <CrudResourcePage<Page>
      title="صفحه‌ساز"
      description="فهرست صفحات CMS؛ هر تغییر در بوم همان لحظه روی سایت اعمال می‌شود"
      path="/admin/pages"
      searchPlaceholder="عنوان یا اسلاگ…"
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
        { key: "slug", header: "اسلاگ", cell: (r) => <span dir="ltr">{r.slug}</span> },
        {
          key: "status",
          header: "وضعیت",
          cell: (r) => (
            <Badge variant={r.status === "published" ? "success" : "muted"}>{r.status}</Badge>
          ),
        },
      ]}
      createDefaults={{ status: "published", revalidateSeconds: 3600, slug: "/" }}
      fields={[
        { name: "title", label: "عنوان", required: true },
        { name: "slug", label: "اسلاگ", required: true, dir: "ltr" },
        {
          name: "status",
          label: "وضعیت",
          type: "select",
          options: [
            { value: "draft", label: "پیش‌نویس" },
            { value: "published", label: "منتشر" },
          ],
        },
        { name: "revalidateSeconds", label: "بازتأیید (ثانیه)", type: "number" },
      ]}
      seoTarget={{ type: "page", linkPageId: true }}
      extraActions={(row) => (
        <IconActionButton tooltip="باز کردن بوم" asChild>
          <Link href={`/pages/${row.id}`}>
            <ExternalLink className="h-4 w-4" />
          </Link>
        </IconActionButton>
      )}
    />
  );
}
