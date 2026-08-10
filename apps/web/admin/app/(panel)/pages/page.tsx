"use client";

import Link from "next/link";
import { toast } from "sonner";
import { ExternalLink, Rocket } from "lucide-react";
import { apiPost, ApiError } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CrudResourcePage } from "@/components/data/crud-resource-page";

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
      description="فهرست صفحات CMS؛ ویرایش بوم و انتشار"
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
      createDefaults={{ status: "draft", revalidateSeconds: 600, slug: "/" }}
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
      extraActions={(row, reload) => (
        <>
          <Button asChild size="icon" variant="ghost" aria-label="بوم">
            <Link href={`/pages/${row.id}`}>
              <ExternalLink className="h-4 w-4" />
            </Link>
          </Button>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            aria-label="انتشار"
            onClick={async () => {
              try {
                await apiPost(`/admin/pages/${row.id}/publish`);
                toast.success("منتشر شد");
                reload();
              } catch (err) {
                toast.error(err instanceof ApiError ? err.message : "خطا");
              }
            }}
          >
            <Rocket className="h-4 w-4" />
          </Button>
        </>
      )}
    />
  );
}
