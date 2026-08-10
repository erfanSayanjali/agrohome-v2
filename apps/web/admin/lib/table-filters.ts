export type FilterValue = string | number | boolean | { contains: string; mode?: "insensitive" };

export type ColumnFilterType = "text" | "select" | "boolean";

export type ColumnFilterDef = {
  /** کلید فیلتر برای API؛ پیش‌فرض همان key ستون */
  key?: string;
  type?: ColumnFilterType;
  options?: { value: string; label: string }[];
  placeholder?: string;
};

export function isFilterActive(value: unknown): boolean {
  if (value === undefined || value === null || value === "") return false;
  if (typeof value === "object" && value !== null && "contains" in value) {
    return Boolean(String((value as { contains?: unknown }).contains ?? "").trim());
  }
  return true;
}

export function getFilterFieldKey(columnKey: string, filter?: false | ColumnFilterDef): string | null {
  if (filter === false) return null;
  if (columnKey === "actions") return null;
  return filter?.key || columnKey;
}

export function getTextFilterDisplay(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "object" && value !== null && "contains" in value) {
    return String((value as { contains?: unknown }).contains ?? "");
  }
  return String(value);
}

export function toTextFilterValue(raw: string): FilterValue | undefined {
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  return { contains: trimmed, mode: "insensitive" };
}

export function getSelectFilterDisplay(value: unknown): string {
  if (value == null || value === "") return "";
  return String(value);
}

export function formatFilterChip(
  label: string,
  value: unknown,
  options?: { value: string; label: string }[],
  type?: ColumnFilterType
): string {
  if (type === "boolean") {
    const on = value === true || value === "true";
    return `${label}: ${on ? "بله" : "خیر"}`;
  }
  if (type === "select") {
    const raw = getSelectFilterDisplay(value);
    const opt = options?.find((o) => o.value === raw);
    return `${label}: ${opt?.label || raw}`;
  }
  return `${label}: ${getTextFilterDisplay(value)}`;
}
