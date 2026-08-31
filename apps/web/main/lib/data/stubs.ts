/** Stub data layer — empty shapes until the new API is wired. */

import { cache } from "react";
import { unstable_cache } from "next/cache";
import {
  CMS_DEFAULT_REVALIDATE_SECONDS,
  CMS_LAYOUT_TAG,
  PRODUCT_REVALIDATE_SECONDS,
  PRODUCTS_TAG,
  productTag,
} from "@agrohome/shared";

type ListMeta = { page?: number; limit?: number; totalPages?: number };
type ApiList<T = unknown> = { content: T[]; total?: number; meta?: ListMeta };
type ApiOne<T = unknown> = { content: T | null };

const emptyList = <T = unknown>(): ApiList<T> => ({
  content: [],
  total: 0,
  meta: { page: 1, limit: 20, totalPages: 1 },
});
const emptyOne = <T = unknown>(): ApiOne<T> => ({ content: null });

const API_BASE =
  process.env.API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:3002";

type ApiFetchOptions = {
  cache?: RequestCache;
  next?: { tags?: string[]; revalidate?: number | false };
};

async function apiJson<T>(
  path: string,
  options?: ApiFetchOptions
): Promise<T | null> {
  try {
    const init: RequestInit & { next?: ApiFetchOptions["next"] } = {
      headers: { "Content-Type": "application/json" },
    };
    if (options?.next) {
      init.next = options.next;
    } else {
      init.cache = options?.cache ?? "no-store";
    }
    const res = await fetch(
      `${API_BASE.replace(/\/$/, "")}/api/v1${path}`,
      init
    );
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

const productFetchCache: ApiFetchOptions = {
  next: {
    tags: [PRODUCTS_TAG],
    revalidate: PRODUCT_REVALIDATE_SECONDS,
  },
};

type CategoryNode = {
  id?: string;
  _id?: string;
  title?: string;
  slug?: string;
  parentId?: string | null;
  parent_id?: string | null;
  children?: CategoryNode[];
  [key: string]: unknown;
};

type MediaLike = { url?: string; alt?: string | null };

type ProductLike = {
  id?: string;
  _id?: string;
  subtitle?: string | null;
  subTitle?: string | null;
  media?: MediaLike | null;
  thumbnailUrl?: string;
  packages?: Array<{ id?: string; _id?: string; value?: number; unit?: string }>;
  package_ids?: Array<{ id?: string; _id?: string; value?: number; unit?: string }>;
  specs?: Array<{
    id?: string;
    _id?: string;
    value?: string;
    highlight?: boolean;
    specification?: { title?: string; position?: string };
    specification_id?: { title?: string; position?: string };
  }>;
  categories?: Array<{
    category?: { id?: string; _id?: string; title?: string; slug?: string };
    title?: string;
    slug?: string;
  }>;
  thumbnail_id?: MediaLike[];
  category_id?: Array<{ title?: string; slug?: string; _id?: string }>;
  [key: string]: unknown;
};

type BlogLike = {
  id?: string;
  _id?: string;
  title?: string;
  slug?: string;
  content?: string | null;
  media?: unknown;
  author?: {
    id?: string;
    nickname?: string | null;
    firstName?: string | null;
    lastName?: string | null;
  } | null;
  category?: {
    id?: string;
    _id?: string;
    title?: string;
    slug?: string;
    parentId?: string | null;
  } | null;
  categoryId?: string | null;
  authorId?: string | null;
  [key: string]: unknown;
};

type CommentLike = {
  id?: string;
  _id?: string;
  nickName?: string;
  content?: string;
  rating?: number | null;
  createdAt?: string;
  replies?: CommentLike[];
  [key: string]: unknown;
};

function normalizeCategoryTree(nodes: CategoryNode[] = []): CategoryNode[] {
  if (!Array.isArray(nodes)) return [];
  return nodes.map((node) => ({
    ...node,
    _id: node.id || node._id,
    parent_id: node.parentId ?? node.parent_id ?? null,
    children: normalizeCategoryTree(
      Array.isArray(node.children) ? node.children : []
    ),
  }));
}

function plainTextFromHtml(html?: string | null, max = 160) {
  const text = String(html || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!text) return "";
  return text.length > max ? `${text.slice(0, max).trim()}…` : text;
}

function authorDisplayName(author?: BlogLike["author"] | null) {
  if (!author) return "";
  const full = [author.firstName, author.lastName].filter(Boolean).join(" ").trim();
  return author.nickname || full || "";
}

function mediaToThumbnails(media: unknown, fallback?: MediaLike | null): MediaLike[] {
  if (Array.isArray(media) && media.length) {
    return media
      .map((item) => {
        if (item && typeof item === "object" && "url" in item) {
          return { url: String((item as MediaLike).url || ""), alt: (item as MediaLike).alt ?? null };
        }
        if (typeof item === "string" && item) return { url: item, alt: null };
        return null;
      })
      .filter((item): item is { url: string; alt: string | null } => Boolean(item?.url));
  }
  if (media && typeof media === "object" && "url" in (media as MediaLike)) {
    const item = media as MediaLike;
    if (item.url) return [{ url: item.url, alt: item.alt ?? null }];
  }
  if (typeof media === "string" && media) return [{ url: media, alt: null }];
  if (fallback?.url) return [fallback];
  return [];
}

function normalizeComment(c: CommentLike): CommentLike {
  return {
    ...c,
    _id: c.id || c._id,
    replies: Array.isArray(c.replies) ? c.replies.map(normalizeComment) : [],
  };
}

function normalizeProduct(p: ProductLike) {
  const media =
    p.media || (p.thumbnailUrl ? { url: p.thumbnailUrl, alt: null } : null);
  const category_id = p.categories?.length
    ? p.categories.map((c) => ({
        _id: c.category?.id || c.category?._id,
        title: c.category?.title || c.title,
        slug: c.category?.slug || c.slug,
      }))
    : p.category_id || [];
  const packages = Array.isArray(p.packages)
    ? p.packages
    : Array.isArray(p.package_ids)
      ? p.package_ids
      : [];
  const specs = Array.isArray(p.specs)
    ? p.specs.map((spec) => ({
        ...spec,
        _id: spec.id || spec._id,
        specification_id: spec.specification_id || {
          title: spec.specification?.title || "",
          position: spec.specification?.position || "attribute",
        },
      }))
    : [];
  return {
    ...p,
    _id: p.id || p._id,
    subTitle: p.subTitle || p.subtitle || "",
    media,
    thumbnail_id: media
      ? [{ url: media.url, alt: media.alt }]
      : p.thumbnail_id || [],
    category_id,
    package_ids: packages.map((item) => ({ ...item, _id: item.id || item._id })),
    specs,
  };
}

function normalizeBlog(b: BlogLike) {
  const author = b.author || null;
  const category = b.category
    ? {
        ...b.category,
        _id: b.category.id || b.category._id,
        parent_id: b.category.parentId ?? null,
      }
    : null;
  return {
    ...b,
    _id: b.id || b._id,
    subTitle: b.subTitle || plainTextFromHtml(b.content),
    author_id: author
      ? { ...author, _id: author.id, nickname: authorDisplayName(author) }
      : null,
    category_id: category,
    categoryId: b.categoryId || category?._id || null,
    thumbnail_id: mediaToThumbnails(b.media),
  };
}

function toPrismaBlogFilters(filters: Record<string, unknown> = {}) {
  const out: Record<string, unknown> = { ...filters };
  const categoryId = out.categoryId || out.category_id;
  const categoryIds = out.categoryIds || out.category_ids;
  delete out.category_id;
  delete out.category_ids;
  delete out.categoryIds;

  if (Array.isArray(categoryIds) && categoryIds.length) {
    out.categoryId = { in: categoryIds.map(String) };
  } else if (categoryId && typeof categoryId === "object") {
    out.categoryId = categoryId;
  } else if (categoryId) {
    out.categoryId = String(categoryId);
  } else {
    delete out.categoryId;
  }
  if (out.status === "published") delete out.status;
  return out;
}

/** Convert legacy Mongo-style product filters for the public products API. */
function toPrismaProductFilters(filters: Record<string, unknown> = {}) {
  const out: Record<string, unknown> = { ...filters };

  const legacySlug = out["category_id.slug"] as
    | { $in?: string[]; in?: string[] }
    | string[]
    | string
    | undefined;
  let slugs: string[] = Array.isArray(out.categorySlugs)
    ? (out.categorySlugs as unknown[]).map(String).filter(Boolean)
    : [];

  if (typeof legacySlug === "string") {
    slugs = [legacySlug];
  } else if (Array.isArray(legacySlug)) {
    slugs = legacySlug.map(String);
  } else if (legacySlug && typeof legacySlug === "object") {
    const list = legacySlug.$in || legacySlug.in || [];
    slugs = list.map(String);
  }
  if (legacySlug !== undefined) delete out["category_id.slug"];

  if (slugs.length) out.categorySlugs = slugs;
  else delete out.categorySlugs;

  return out;
}

function buildListQuery(params?: {
  sort?: string;
  search?: string;
  filters?: Record<string, unknown>;
  page?: number;
  limit?: number;
  transformFilters?: (f: Record<string, unknown>) => Record<string, unknown>;
}) {
  const qs = new URLSearchParams();
  if (params?.sort) qs.set("sort", params.sort);
  if (params?.search) qs.set("search", params.search);
  if (params?.page) qs.set("page", String(params.page));
  qs.set("limit", String(params?.limit ?? 100));
  if (params?.filters && Object.keys(params.filters).length) {
    const filters = params.transformFilters
      ? params.transformFilters(params.filters)
      : params.filters;
    qs.set("filters", JSON.stringify(filters));
  }
  return qs.toString();
}

export async function getSiteSettings() {
  return {
    content: {
      id: "default",
      logoUrl: "/logo.png",
      faviconUrl: "/favicon.ico" as string | null,
      footerText:
        "با کودهای ارگانیک آگروهوم، بدون بوی بد و مواد شیمیایی، گیاهانت را زنده نگه دار.",
      socialLinks: [
        { label: "اینستاگرام", href: "https://www.instagram.com/agrohome" },
        { label: "تلگرام", href: "https://t.me/agrohome" },
      ] as Array<{ label?: string; href?: string }>,
      footerLinkGroups: [
        {
          title: "دسترسی سریع",
          links: [
            { title: "صفحه اصلی", href: "/" },
            { title: "کودهای خانگی", href: "/products" },
            { title: "وبلاگ", href: "/blogs" },
            { title: "درباره ما", href: "/about" },
            { title: "تماس با ما", href: "/contact" },
          ],
        },
        {
          title: "فروشگاه",
          links: [
            { title: "همه محصولات", href: "/products" },
            { title: "مقالات و راهنما", href: "/blogs" },
            { title: "تماس با پشتیبانی", href: "/contact" },
          ],
        },
      ] as Array<{
        title?: string;
        links?: Array<{ title?: string; href?: string }>;
      }>,
    },
  };
}

/** @deprecated use getSiteSettings */
export async function getFooterWidget() {
  const settings = await getSiteSettings();
  return { content: settings.content };
}

export async function getProductCategoriesNested() {
  const load = async () => {
    const res = await apiJson<{ content: CategoryNode[] }>(
      "/product-categories/nested",
      { cache: "no-store" }
    );
    if (!res?.content?.length) return emptyList<CategoryNode>();
    return {
      content: normalizeCategoryTree(res.content),
      total: res.content.length,
      meta: { page: 1, limit: res.content.length, totalPages: 1 },
    };
  };

  try {
    // فقط نتیجهٔ غیرخالی در data cache ذخیره می‌شود تا empty sticky نشود
    return await unstable_cache(
      async () => {
        const result = await load();
        if (!result.content.length) {
          throw new Error("PRODUCT_CATEGORIES_EMPTY");
        }
        return result;
      },
      ["product-categories-nested", "v3"],
      {
        tags: [CMS_LAYOUT_TAG, PRODUCTS_TAG],
        revalidate: CMS_DEFAULT_REVALIDATE_SECONDS,
      }
    )();
  } catch {
    return load();
  }
}

export async function getProductCategories() {
  const res = await apiJson<{ content: CategoryNode[] }>("/product-categories");
  if (!res?.content?.length) return emptyList();
  return {
    content: normalizeCategoryTree(res.content),
    total: res.content.length,
  };
}

export async function getProductCategoryBySlug(slug: string) {
  const res = await apiJson<{ content: CategoryNode | null }>(
    `/product-categories/${encodeURIComponent(slug)}`
  );
  if (!res?.content) return emptyOne();
  const [normalized] = normalizeCategoryTree([res.content]);
  return { content: normalized };
}

export async function getHomeFaq() {
  return {
    content: {
      content: {
        items: [] as Array<{ _id?: string; title?: string; content?: string }>,
      },
    },
  };
}

export async function getHomeComments() {
  return emptyList();
}

export async function getAvailableProducts() {
  return listProducts({ sort: "-createdAt", limit: 12 });
}

export async function getPublishedBlogCategories() {
  const res = await apiJson<{ content: CategoryNode[] }>("/blog-categories");
  if (!res?.content?.length) return emptyList();
  return {
    content: normalizeCategoryTree(res.content),
    total: res.content.length,
  };
}

export async function getPublishedBlogs() {
  return listBlogs({ sort: "-createdAt", limit: 12 });
}

export const getProductBySlug = cache(async (slug: string) => {
  const res = await apiJson<{ content: ProductLike | null }>(
    `/products/${encodeURIComponent(slug)}`,
    {
      next: {
        tags: [PRODUCTS_TAG, productTag(slug)],
        revalidate: PRODUCT_REVALIDATE_SECONDS,
      },
    }
  );
  if (!res?.content) return emptyList();
  return { content: [normalizeProduct(res.content)], total: 1 };
});

export async function getProductSpecifications(_productId: string) {
  return emptyList();
}

export async function getSimilarProducts(categorySlug?: string) {
  if (!categorySlug) return emptyList();
  return listProducts({
    sort: "-createdAt",
    limit: 8,
    filters: { categorySlugs: [categorySlug] },
    cacheMode: "tagged",
  });
}

export async function getBlogBySlug(slug: string) {
  const res = await apiJson<{ content: BlogLike | null }>(
    `/blogs/${encodeURIComponent(slug)}`
  );
  if (!res?.content) return emptyOne();
  return { content: normalizeBlog(res.content) };
}

export async function getBlogSuggestions(
  categoryId?: string,
  excludeId?: string
) {
  const limit = 6;
  const exclude = (items: BlogLike[]) =>
    items.filter((item) => {
      const id = item._id || item.id;
      return !excludeId || id !== excludeId;
    });

  if (categoryId) {
    const sameCategory = await listBlogs({
      sort: "-createdAt",
      limit: limit + (excludeId ? 1 : 0),
      filters: { categoryId },
    });
    const filtered = exclude(sameCategory.content || []).slice(0, limit);
    if (filtered.length) {
      return { ...sameCategory, content: filtered, total: filtered.length };
    }
  }

  const recent = await listBlogs({
    sort: "-createdAt",
    limit: limit + (excludeId ? 1 : 0),
  });
  const filtered = exclude(recent.content || []).slice(0, limit);
  return { ...recent, content: filtered, total: filtered.length };
}

export async function getBlogCategoryBySlug(slug: string) {
  const res = await apiJson<{ content: CategoryNode | null }>(
    `/blog-categories/${encodeURIComponent(slug)}`
  );
  if (!res?.content) return emptyOne();
  const [normalized] = normalizeCategoryTree([res.content]);
  return { content: normalized };
}

export async function getWidgetKadamat() {
  return { content: [] as unknown[] };
}

type SeoRecord = {
  id?: string;
  targetPath?: string | null;
  targetType?: string | null;
  targetLegacyId?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  metaKeyWords?: string[];
  canonicalUrl?: string | null;
  pageId?: string | null;
};

function normalizeSeoPath(targetPath: string) {
  const trimmed = String(targetPath || "").trim();
  if (!trimmed || trimmed === "/") return "/";
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

async function getSeoByTarget(targetType: string, targetId: string) {
  if (!targetId) return emptyOne<SeoRecord>();
  const query = new URLSearchParams({
    targetType,
    targetLegacyId: targetId,
  });
  const res = await apiJson<{ content: SeoRecord | null }>(
    `/seo/by-target?${query.toString()}`
  );
  if (!res?.content) return emptyOne<SeoRecord>();
  return { content: res.content };
}

export async function getSeoByPath(targetPath: string) {
  const path = normalizeSeoPath(targetPath);
  const query = new URLSearchParams({ targetPath: path });
  const res = await apiJson<{ content: SeoRecord | null }>(
    `/seo/by-path?${query.toString()}`
  );
  if (!res?.content) return emptyList<SeoRecord>();
  return {
    content: [res.content],
    total: 1,
  };
}

export async function getProductSeo(productId: string) {
  return getSeoByTarget("product", productId);
}

export async function getBlogSeo(blogId: string) {
  return getSeoByTarget("blog", blogId);
}

export async function getCategorySeo(categoryId: string) {
  return getSeoByTarget("product_category", categoryId);
}

export async function getBlogCategorySeo(categoryId: string) {
  return getSeoByTarget("blog_category", categoryId);
}

export async function listProducts(params?: {
  sort?: string;
  search?: string;
  filters?: Record<string, unknown>;
  page?: number;
  limit?: number;
  /** Server-only tagged cache; client list keeps no-store. */
  cacheMode?: "no-store" | "tagged";
}) {
  const { cacheMode = "no-store", ...listParams } = params || {};
  const query = buildListQuery({
    ...listParams,
    transformFilters: toPrismaProductFilters,
  });
  const res = await apiJson<{
    content: ProductLike[];
    total?: number;
    meta?: ListMeta;
  }>(
    `/products?${query}`,
    cacheMode === "tagged" ? productFetchCache : { cache: "no-store" }
  );
  if (!res?.content?.length) {
    return {
      content: [],
      total: res?.total ?? 0,
      meta: res?.meta,
    };
  }
  return {
    content: res.content.map(normalizeProduct),
    total: res.total ?? res.content.length,
    meta: res.meta,
  };
}

export async function listBlogs(params?: {
  sort?: string;
  search?: string;
  filters?: Record<string, unknown>;
  page?: number;
  limit?: number;
}) {
  const query = buildListQuery({
    ...params,
    transformFilters: toPrismaBlogFilters,
  });
  const res = await apiJson<{
    content: BlogLike[];
    total?: number;
    meta?: ListMeta;
  }>(`/blogs?${query}`);
  const list = Array.isArray(res?.content) ? res.content : [];
  const total = res?.total ?? list.length;
  const limit = params?.limit ?? 20;
  const page = params?.page ?? 1;
  return {
    content: list.map(normalizeBlog),
    total,
    meta: {
      page: res?.meta?.page ?? page,
      limit: res?.meta?.limit ?? limit,
      totalPages:
        res?.meta?.totalPages ?? Math.max(1, Math.ceil(total / Math.max(1, limit))),
    },
  };
}

async function fetchComments(path: string) {
  try {
    const res = await fetch(`${API_BASE.replace(/\/$/, "")}/api/v1${path}`, {
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
    });
    const data = (await res.json().catch(() => ({}))) as {
      message?: string;
      content?: CommentLike[];
      total?: number;
      meta?: ListMeta;
    };
    if (!res.ok) {
      throw commentRequestError(
        data.message || "بارگذاری نظرات ناموفق بود. لطفاً صفحه را تازه کنید."
      );
    }
    const list = Array.isArray(data.content) ? data.content : [];
    const total = data.total ?? list.length;
    return {
      content: list.map(normalizeComment),
      total,
      meta: {
        page: data.meta?.page ?? 1,
        limit: data.meta?.limit ?? (list.length || 5),
        totalPages:
          data.meta?.totalPages ??
          Math.max(1, Math.ceil(total / Math.max(1, data.meta?.limit || 5))),
      },
    };
  } catch (error) {
    if (error instanceof Error && (error as { response?: unknown }).response) {
      throw error;
    }
    throw commentRequestError(
      "ارتباط با سرور برقرار نشد. اتصال اینترنت را بررسی کنید و دوباره تلاش کنید."
    );
  }
}

export async function getProductComments(
  productId: string,
  params?: { page?: number; limit?: number }
) {
  if (!productId) return emptyList();
  const qs = new URLSearchParams();
  qs.set("page", String(params?.page || 1));
  qs.set("limit", String(params?.limit ?? 5));
  return fetchComments(
    `/comments/product/${encodeURIComponent(productId)}?${qs.toString()}`
  );
}

export async function getBlogComments(
  blogId: string,
  params?: { page?: number; limit?: number }
) {
  if (!blogId) return emptyList();
  const qs = new URLSearchParams();
  qs.set("page", String(params?.page || 1));
  qs.set("limit", String(params?.limit ?? 5));
  return fetchComments(
    `/comments/blog/${encodeURIComponent(blogId)}?${qs.toString()}`
  );
}

function commentRequestError(message: string) {
  const err = new Error(message) as Error & {
    response?: { data?: { message?: string } };
  };
  err.response = { data: { message } };
  return err;
}

export async function submitComment(payload: Record<string, unknown>) {
  try {
    const res = await fetch(`${API_BASE.replace(/\/$/, "")}/api/v1/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = (await res.json().catch(() => ({}))) as {
      message?: string;
      content?: unknown;
    };
    if (!res.ok) {
      throw commentRequestError(
        data.message || "ثبت نظر ناموفق بود. لطفاً دوباره تلاش کنید."
      );
    }
    return { ok: true as const, content: data.content };
  } catch (error) {
    if (error instanceof Error && (error as { response?: unknown }).response) {
      throw error;
    }
    throw commentRequestError(
      "ارتباط با سرور برقرار نشد. اتصال اینترنت را بررسی کنید و دوباره تلاش کنید."
    );
  }
}

export async function submitContact(payload: Record<string, unknown>) {
  try {
    const res = await fetch(`${API_BASE.replace(/\/$/, "")}/api/v1/contact`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = (await res.json().catch(() => ({}))) as { message?: string };
    if (!res.ok) {
      return {
        ok: false as const,
        message: data.message || "ارسال پیام ناموفق بود. دوباره تلاش کنید.",
      };
    }
    return { ok: true as const };
  } catch {
    return {
      ok: false as const,
      message: "ارتباط با سرور برقرار نشد. اتصال اینترنت را بررسی کنید و دوباره تلاش کنید.",
    };
  }
}

export function mediaUrl(path?: string | null | { url?: string | null }) {
  const raw = (typeof path === 'object' && path ? path.url : path) || '';
  if (!raw) return '';
  if (raw.startsWith('http://') || raw.startsWith('https://') || raw.startsWith('data:')) {
    return raw;
  }
  // فایل‌های آپلود روی API هستند؛ بقیه از public فرانت لود می‌شوند
  if (!raw.includes('/uploads/')) {
    return raw.startsWith('/') ? raw : `/${raw}`;
  }
  const base = process.env.NEXT_PUBLIC_API_URL || '';
  if (!base) return raw.startsWith('/') ? raw : `/${raw}`;
  const normalized = raw.startsWith('/') ? raw : `/${raw}`;
  return `${base.replace(/\/$/, '')}${normalized}`;
}

export function mediaAlt(
  value?: string | null | { url?: string | null; alt?: string | null },
  fallback = ''
) {
  if (value && typeof value === 'object' && 'alt' in value) {
    return value.alt || fallback;
  }
  return fallback;
}
