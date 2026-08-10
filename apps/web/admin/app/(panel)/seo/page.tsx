"use client";

import { CrudResourcePage } from "@/components/data/crud-resource-page";
import { keywordsToString } from "@/lib/seo";

type Row = {
  id: string;
  targetPath?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  metaKeyWords?: string[] | string | null;
  canonicalUrl?: string | null;
  targetType?: string | null;
  pageId?: string | null;
};

export default function SeoPage() {
  return (
    <CrudResourcePage<Row>
      title="SEO"
      description="فهرست سراسری متا؛ ویرایش مستقیم یا از تب SEO هر موجودیت"
      path="/admin/seo"
      searchPlaceholder="عنوان یا مسیر…"
      columns={[
        { key: "path", header: "مسیر", cell: (r) => <span dir="ltr">{r.targetPath || "—"}</span> },
        { key: "title", header: "عنوان متا", cell: (r) => r.metaTitle || "—" },
        { key: "type", header: "نوع", cell: (r) => r.targetType || "—" },
      ]}
      fields={[
        { name: "targetPath", label: "مسیر", dir: "ltr" },
        { name: "targetType", label: "نوع هدف" },
        { name: "metaTitle", label: "عنوان متا" },
        { name: "metaDescription", label: "توضیح متا", type: "textarea" },
        { name: "metaKeyWords", label: "کلمات کلیدی" },
        { name: "canonicalUrl", label: "Canonical", dir: "ltr" },
        { name: "pageId", label: "شناسه صفحه CMS", dir: "ltr" },
      ]}
      mapRowToForm={(r) => ({
        targetPath: r.targetPath ?? "",
        targetType: r.targetType ?? "",
        metaTitle: r.metaTitle ?? "",
        metaDescription: r.metaDescription ?? "",
        metaKeyWords: keywordsToString(r.metaKeyWords),
        canonicalUrl: r.canonicalUrl ?? "",
        pageId: r.pageId ?? "",
      })}
      mapFormToBody={(v) => ({
        ...v,
        pageId: v.pageId || null,
        metaKeyWords: String(v.metaKeyWords || "")
          .split(/[,،]/)
          .map((s) => s.trim())
          .filter(Boolean),
      })}
    />
  );
}
