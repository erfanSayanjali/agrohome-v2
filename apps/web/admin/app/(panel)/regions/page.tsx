"use client";

import { toast } from "sonner";
import { Rocket } from "lucide-react";
import { apiPost, ApiError } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CrudResourcePage } from "@/components/data/crud-resource-page";

type Region = {
  id: string;
  key: string;
  title: string;
  status: string;
  revalidateSeconds?: number;
};

export default function RegionsPage() {
  return (
    <CrudResourcePage<Region>
      title="مناطق CMS"
      path="/admin/regions"
      columns={[
        { key: "title", header: "عنوان", cell: (r) => r.title },
        { key: "key", header: "کلید", cell: (r) => <span dir="ltr">{r.key}</span> },
        {
          key: "status",
          header: "وضعیت",
          cell: (r) => (
            <Badge variant={r.status === "published" ? "success" : "muted"}>{r.status}</Badge>
          ),
        },
      ]}
      createDefaults={{ status: "draft", revalidateSeconds: 600 }}
      fields={[
        { name: "title", label: "عنوان", required: true },
        { name: "key", label: "کلید", required: true, dir: "ltr" },
        {
          name: "status",
          label: "وضعیت",
          type: "select",
          options: [
            { value: "draft", label: "پیش‌نویس" },
            { value: "published", label: "منتشر" },
          ],
        },
        { name: "revalidateSeconds", label: "بازتأیید", type: "number" },
      ]}
      extraActions={(row, reload) => (
        <Button
          type="button"
          size="icon"
          variant="ghost"
          aria-label="انتشار"
          onClick={async () => {
            try {
              await apiPost(`/admin/regions/${row.id}/publish`);
              toast.success("منطقه منتشر شد");
              reload();
            } catch (err) {
              toast.error(err instanceof ApiError ? err.message : "خطا");
            }
          }}
        >
          <Rocket className="h-4 w-4" />
        </Button>
      )}
    />
  );
}
