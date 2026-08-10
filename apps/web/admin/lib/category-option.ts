import type { AsyncSelectOption } from "@/components/ui/async-select";

type ParentRef = {
  id?: string;
  title?: string | null;
  slug?: string | null;
} | null;

/** برچسب دسته با مسیر والد برای دراپ‌داون‌های ادمین */
export function mapCategoryOption(item: Record<string, unknown>): AsyncSelectOption {
  const title = String(item.title || item.slug || item.id);
  const parent = item.parent as ParentRef | undefined;
  const parentTitle = parent?.title ? String(parent.title) : "";
  const slug = item.slug ? String(item.slug) : "";

  return {
    value: String(item.id),
    label: parentTitle ? `${parentTitle} › ${title}` : title,
    meta: parentTitle
      ? `زیرمجموعهٔ ${parentTitle}${slug ? ` · ${slug}` : ""}`
      : slug || undefined,
  };
}

export function categoryDisplayLabel(opts: {
  title?: string | null;
  parentTitle?: string | null;
}): string {
  const title = String(opts.title || "").trim();
  const parentTitle = String(opts.parentTitle || "").trim();
  if (!title) return "";
  return parentTitle ? `${parentTitle} › ${title}` : title;
}
