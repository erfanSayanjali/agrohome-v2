"use client";

import { CrudResourcePage } from "@/components/data/crud-resource-page";
import { DEFAULT_PACKAGE_UNIT, PACKAGE_UNITS } from "@/lib/package-units";

type Row = {
  id: string;
  value: string | number;
  unit?: string | null;
  productId: string;
  sortOrder?: number;
  product?: { title?: string } | null;
};

export default function PackagesPage() {
  return (
    <CrudResourcePage<Row>
      title="بسته‌ها"
      description="ترتیب را با درگ‌ودراپ در جدول تغییر دهید"
      path="/admin/packages"
      sortable
      columns={[
        { key: "value", header: "مقدار", cell: (r) => r.value },
        { key: "unit", header: "واحد", cell: (r) => r.unit || "—" },
        {
          key: "product",
          header: "محصول",
          cell: (r) =>
            r.product?.title ? r.product.title : <span dir="ltr">{r.productId}</span>,
        },
      ]}
      createDefaults={{ unit: DEFAULT_PACKAGE_UNIT }}
      fields={[
        { name: "value", label: "مقدار", required: true, type: "number" },
        {
          name: "unit",
          label: "واحد",
          required: true,
          type: "select",
          options: PACKAGE_UNITS.map((u) => ({ value: u.value, label: u.label })),
        },
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
      ]}
      mapRowToForm={(r) => ({
        value: r.value,
        unit: r.unit ?? DEFAULT_PACKAGE_UNIT,
        productId: r.productId,
        productIdLabel: r.product?.title ?? "",
      })}
    />
  );
}
