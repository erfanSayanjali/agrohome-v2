import type { Column } from "@/components/data/data-table";
import type { FilterDef } from "@/components/data/data-toolbar";
import type { ColumnFilterDef } from "@/lib/table-filters";
import { getFilterFieldKey } from "@/lib/table-filters";

type FieldLike = {
  name: string;
  type?: string;
  options?: { value: string; label: string }[];
};

/** نگاشت کلید نمایشی ستون → فیلد واقعی API */
const COLUMN_KEY_ALIASES: Record<string, string | false> = {
  nick: "nickName",
  path: "targetPath",
  type: "targetType",
  featured: "isFeatured",
  home: "showOnHome",
  highlight: "highlight",
  product: "productId",
  spec: "specificationId",
  category: "categoryId",
  cat: "categoryId",
  role: "roleId",
  perms: false,
  pw: false,
  actions: false,
};

/** برای ستون title وقتی فیلد form متناظر metaTitle است (صفحه SEO) */
function resolveFilterKey(columnKey: string, fields: FieldLike[]): string | false {
  const alias = COLUMN_KEY_ALIASES[columnKey];
  if (alias === false) return false;
  if (alias) return alias;

  if (columnKey === "name") {
    if (fields.some((f) => f.name === "fullName")) return "fullName";
    if (fields.some((f) => f.name === "firstName")) return "firstName";
    return "firstName";
  }
  if (columnKey === "title" && fields.some((f) => f.name === "metaTitle")) {
    return "metaTitle";
  }
  return columnKey;
}

function inferFilterFromField(
  field: FieldLike | undefined,
  toolbar?: FilterDef
): ColumnFilterDef {
  if (toolbar) {
    return { type: "select", options: toolbar.options };
  }
  if (field?.type === "switch") {
    return { type: "boolean" };
  }
  if (field?.type === "select" && field.options?.length) {
    return { type: "select", options: field.options };
  }
  if (field?.type === "number") {
    return { type: "text", placeholder: "مقدار دقیق یا بخشی از عدد…" };
  }
  return { type: "text" };
}

export function enrichColumnsWithFilters<T>(
  columns: Column<T>[],
  fields: FieldLike[] = [],
  toolbarFilters: FilterDef[] = []
): Column<T>[] {
  return columns.map((col) => {
    if (col.filter === false) return col;
    if (col.filter && typeof col.filter === "object") {
      return {
        ...col,
        filter: { type: "text", ...col.filter },
      };
    }

    const resolved = resolveFilterKey(col.key, fields);
    if (resolved === false) {
      return { ...col, filter: false };
    }

    const field =
      fields.find((f) => f.name === resolved) || fields.find((f) => f.name === col.key);
    const toolbar =
      toolbarFilters.find((f) => f.key === resolved) ||
      toolbarFilters.find((f) => f.key === col.key);

    const inferred = inferFilterFromField(field, toolbar);
    return {
      ...col,
      filter: {
        ...inferred,
        key: resolved,
      },
    };
  });
}

export function buildFilterMeta<T>(columns: Column<T>[]) {
  return columns
    .map((col) => {
      const config = col.filter === false ? null : col.filter || { type: "text" as const };
      if (!config) return null;
      const key = getFilterFieldKey(col.key, config);
      if (!key) return null;
      return {
        key,
        label: col.header,
        type: config.type || ("text" as const),
        options: config.options,
      };
    })
    .filter(Boolean) as {
    key: string;
    label: string;
    type?: ColumnFilterDef["type"];
    options?: ColumnFilterDef["options"];
  }[];
}
