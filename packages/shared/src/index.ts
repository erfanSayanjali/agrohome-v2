export type MediaRef = {
  url: string;
  alt?: string | null;
};

/** نرمال‌سازی هر شکل قدیمی/جدید به MediaRef */
export function toMediaRef(value: unknown): MediaRef | null {
  if (value == null || value === "") return null;
  if (typeof value === "string") {
    const url = value.trim();
    return url ? { url, alt: null } : null;
  }
  if (Array.isArray(value)) return toMediaRef(value[0]);
  if (typeof value === "object" && value !== null && "url" in value) {
    const raw = value as { url?: unknown; alt?: unknown };
    const url = String(raw.url ?? "").trim();
    if (!url) return null;
    const alt =
      raw.alt == null || raw.alt === "" ? null : String(raw.alt);
    return { url, alt };
  }
  return null;
}

export function mediaUrlOf(value: unknown): string {
  return toMediaRef(value)?.url || "";
}

export function mediaAltOf(value: unknown, fallback = ""): string {
  return toMediaRef(value)?.alt || fallback;
}

export type ProductListItem = {
  id: string;
  title: string;
  slug: string;
  subtitle?: string | null;
  media?: MediaRef | null;
  isFeatured?: boolean;
  status: "AVAILABLE" | "UNAVAILABLE";
};

export type BlogListItem = {
  id: string;
  title: string;
  slug: string;
  media?: MediaRef | null;
  status: "published" | "draft";
};

export type CategoryTreeNode = {
  id: string;
  title: string;
  slug: string;
  children?: CategoryTreeNode[];
};

export const API_PREFIX = "/api/v1";

export const CMS_DEFAULT_REVALIDATE_SECONDS = 3600;
export const CMS_LAYOUT_TAG = "cms-layout";
export const CMS_PAGES_INDEX_TAG = "cms-pages-index";
export const PRODUCTS_TAG = "products";
export const PRODUCT_REVALIDATE_SECONDS = 3600;

export function productTag(slug: string): string {
  const bare = String(slug || "")
    .trim()
    .replace(/^\/+/, "")
    .replace(/\/+$/, "");
  return `product:${bare || "unknown"}`;
}

export function productPath(slug: string): string {
  const bare = String(slug || "")
    .trim()
    .replace(/^\/+/, "")
    .replace(/\/+$/, "");
  return `/product/${bare}`;
}

const CMS_DEDICATED_SLUGS = ["/", "/about", "/contact"] as const;
const CMS_RESERVED_PREFIXES = [
  "/products",
  "/product",
  "/blogs",
  "/blog",
] as const;

/** `/` و `home` → `/` ؛ `about` و `/about` → `/about` */
export function normalizeCmsSlug(slug: string): string {
  let raw = (slug || "/").trim();
  try {
    raw = decodeURIComponent(raw);
  } catch {
    /* keep raw */
  }
  const bare = raw.replace(/^\/+/, "").replace(/\/+$/, "");
  if (!bare || bare === "home") return "/";
  return `/${bare}`;
}

export function cmsPageTag(slug: string): string {
  return `cms-page:${normalizeCmsSlug(slug)}`;
}

export function cmsPagePath(slug: string): string {
  return normalizeCmsSlug(slug);
}

export function isCmsCatchAllSlug(slug: string): boolean {
  const normalized = normalizeCmsSlug(slug);
  if ((CMS_DEDICATED_SLUGS as readonly string[]).includes(normalized)) {
    return false;
  }
  return !CMS_RESERVED_PREFIXES.some(
    (prefix) => normalized === prefix || normalized.startsWith(`${prefix}/`)
  );
}

export type ListMeta = {
  page: number;
  limit: number;
  totalPages: number;
};

export type ListResponse<T> = {
  content: T[];
  total: number;
  meta: ListMeta;
};

export type ApiOk<T> = {
  content: T;
  total?: number;
  meta?: ListMeta | Record<string, unknown>;
};
