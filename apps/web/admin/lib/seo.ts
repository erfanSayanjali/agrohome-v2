import { apiGet, apiPut, unwrap } from "@/lib/api";

export type SeoTargetType =
  | "product"
  | "product_category"
  | "blog"
  | "blog_category"
  | "page";

export type SeoRecord = {
  id?: string;
  targetPath?: string | null;
  targetType?: string | null;
  targetLegacyId?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  metaKeyWords?: string[] | string | null;
  canonicalUrl?: string | null;
  pageId?: string | null;
};

export type SeoFormValues = {
  metaTitle: string;
  metaDescription: string;
  metaKeyWords: string;
  canonicalUrl: string;
  targetPath: string;
};

export function emptySeoForm(partial?: Partial<SeoFormValues>): SeoFormValues {
  return {
    metaTitle: "",
    metaDescription: "",
    metaKeyWords: "",
    canonicalUrl: "",
    targetPath: "",
    ...partial,
  };
}

export function keywordsToString(value: string[] | string | null | undefined): string {
  if (!value) return "";
  if (Array.isArray(value)) return value.join("، ");
  return String(value);
}

export function keywordsToArray(value: string): string[] {
  return value
    .split(/[,،]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function seoRecordToForm(seo: SeoRecord | null | undefined, fallbackPath = ""): SeoFormValues {
  if (!seo) return emptySeoForm({ targetPath: fallbackPath });
  return {
    metaTitle: seo.metaTitle || "",
    metaDescription: seo.metaDescription || "",
    metaKeyWords: keywordsToString(seo.metaKeyWords),
    canonicalUrl: seo.canonicalUrl || "",
    targetPath: seo.targetPath || fallbackPath,
  };
}

export function buildSeoPath(type: SeoTargetType, slug: string): string {
  const clean = String(slug || "")
    .trim()
    .replace(/^\/+/, "");
  switch (type) {
    case "product":
      return `/products/${clean}`;
    case "product_category":
      return `/product-categories/${clean}`;
    case "blog":
      return `/blogs/${clean}`;
    case "blog_category":
      return `/blog-categories/${clean}`;
    case "page":
      return clean.startsWith("/") ? clean : `/${clean}`;
    default:
      return `/${clean}`;
  }
}

export async function fetchSeoByTarget(params: {
  targetType?: SeoTargetType | string;
  targetId?: string;
  pageId?: string;
}): Promise<SeoRecord | null> {
  const res = await apiGet<{ content: SeoRecord | null }>("/admin/seo/by-target", {
    targetType: params.targetType,
    targetId: params.targetId,
    pageId: params.pageId,
  });
  return unwrap(res);
}

export async function upsertEntitySeo(input: {
  targetType: SeoTargetType | string;
  targetId: string;
  targetPath?: string | null;
  pageId?: string | null;
  form: SeoFormValues;
}): Promise<SeoRecord> {
  const res = await apiPut<{ content: SeoRecord }>("/admin/seo/upsert", {
    targetType: input.targetType,
    targetId: input.targetId,
    targetPath: input.targetPath || input.form.targetPath || null,
    pageId: input.pageId || null,
    metaTitle: input.form.metaTitle.trim() || null,
    metaDescription: input.form.metaDescription.trim() || null,
    metaKeyWords: keywordsToArray(input.form.metaKeyWords),
    canonicalUrl: input.form.canonicalUrl.trim() || null,
  });
  return unwrap(res);
}
