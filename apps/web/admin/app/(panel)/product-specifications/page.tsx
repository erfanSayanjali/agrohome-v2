"use client";

import { Badge } from "@/components/ui/badge";
import { CrudResourcePage } from "@/components/data/crud-resource-page";

type Row = {
  id: string;
  productId: string;
  specificationId: string;
  value: string;
  highlight?: boolean;
  sortOrder?: number;
  product?: { title?: string };
  specification?: { title?: string };
};

export default function ProductSpecificationsPage() {
  return (
    <CrudResourcePage<Row>
      title="مشخصات محصول"
      description="ترتیب را با درگ‌ودراپ در جدول تغییر دهید"
      path="/admin/product-specifications"
      sortable
      columns={[
        {
          key: "product",
          header: "محصول",
          cell: (r) => r.product?.title || r.productId,
        },
        {
          key: "spec",
          header: "مشخصه",
          cell: (r) => r.specification?.title || r.specificationId,
        },
        { key: "value", header: "مقدار", cell: (r) => r.value },
        {
          key: "highlight",
          header: "برجسته",
          cell: (r) => (r.highlight ? <Badge variant="accent">بله</Badge> : "—"),
        },
      ]}
      createDefaults={{ highlight: false }}
      fields={[
        {
          name: "productId",
          label: "محصول",
          required: true,
          type: "async-select",
          placeholder: "جستجو و انتخاب محصول…",
          asyncSelect: {
            path: "/admin/products",
            mapItem: (item) => ({
              value: String(item.id),
              label: String(item.title || item.id),
              meta: item.slug ? String(item.slug) : undefined,
            }),
            searchPlaceholder: "نام محصول…",
            allowClear: false,
          },
        },
        {
          name: "specificationId",
          label: "مشخصه",
          required: true,
          type: "async-select",
          placeholder: "جستجو و انتخاب مشخصه…",
          asyncSelect: {
            path: "/admin/specifications",
            mapItem: (item) => ({
              value: String(item.id),
              label: String(item.title || item.id),
              meta: item.position ? String(item.position) : undefined,
            }),
            searchPlaceholder: "نام مشخصه…",
            allowClear: false,
          },
        },
        { name: "value", label: "مقدار", required: true },
        { name: "highlight", label: "برجسته", type: "switch" },
      ]}
      mapRowToForm={(r) => ({
        productId: r.productId,
        productIdLabel: r.product?.title ?? "",
        specificationId: r.specificationId,
        specificationIdLabel: r.specification?.title ?? "",
        value: r.value,
        highlight: Boolean(r.highlight),
      })}
    />
  );
}
